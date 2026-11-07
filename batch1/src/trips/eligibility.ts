import { isAtOrAfter, isBefore } from "./clock.js";
import { hasActivePass } from "./pass.js";
import type {
  GuardResult,
  PassEntitlement,
  StomperId,
  Trip,
  TripMembership,
  ViewerEntitlement,
} from "./types.js";

export function findMembership(
  memberships: TripMembership[],
  tripId: Trip["id"],
  stomperId: StomperId,
): TripMembership | undefined {
  return memberships.find((m) => m.tripId === tripId && m.stomperId === stomperId);
}

export function isHostOrCohost(m: TripMembership | undefined): m is TripMembership {
  return !!m && m.status === "active" && (m.role === "host" || m.role === "cohost");
}

export function actorRoleOnTrip(
  memberships: TripMembership[],
  trip: Trip,
  actorId: StomperId,
): TripMembership["role"] | undefined {
  return findMembership(memberships, trip.id, actorId)?.role;
}

/** Grace: only on active trip membership with graceUntilAt; never Day Sesh / new trips. */
export function inGrace(
  membership: TripMembership | undefined,
  trip: Trip,
  atIso: string,
): boolean {
  if (!membership || membership.status !== "active") return false;
  if (trip.kind !== "trip" || trip.status !== "active") return false;
  if (!membership.graceUntilAt) return false;
  return (
    isAtOrAfter(atIso, membership.joinedAtIso) &&
    (isBefore(atIso, membership.graceUntilAt) || atIso === membership.graceUntilAt)
  );
}

/**
 * Rider access: at <= participationEndsAt, and either active Pass or grace covering at.
 * AF22: 11-08T20:00 true, 11-09T00:00 denied when participationEndsAt=11-08T23:59.
 * Day Sesh uses daysesh/entitlement — never call this for Day Sesh.
 */
export function hasRiderAccessAt(
  membership: TripMembership | undefined,
  trip: Trip,
  passes: PassEntitlement[],
  atIso: string,
): boolean {
  if (!membership || membership.status !== "active") return false;
  if (!["host", "cohost", "rider"].includes(membership.role)) return false;
  // Deny strictly after participationEndsAt
  if (isAtOrAfter(atIso, membership.participationEndsAt) && atIso !== membership.participationEndsAt) {
    return false;
  }
  if (hasActivePass(passes, membership.stomperId, atIso)) return true;
  if (
    membership.graceUntilAt &&
    (isBefore(atIso, membership.graceUntilAt) || atIso === membership.graceUntilAt)
  ) {
    return true;
  }
  return false;
}

export function canJoinAsRider(
  stomperId: StomperId,
  trip: Trip,
  passes: PassEntitlement[],
  atIso: string,
  existing?: TripMembership,
): GuardResult {
  if (trip.status !== "active" && trip.status !== "scheduled") {
    return { ok: false, reason: "trip_not_active" };
  }
  // Grace only for EXISTING rider on this trip — not new joins
  if (existing && existing.tripId === trip.id && hasRiderAccessAt(existing, trip, passes, atIso)) {
    return { ok: true, value: undefined };
  }
  if (!hasActivePass(passes, stomperId, atIso)) {
    return { ok: false, reason: "pass_inactive", message: "Active Pass required to join as Rider" };
  }
  return { ok: true, value: undefined };
}

export function canAddViewer(trip: Trip): GuardResult {
  if (trip.kind !== "trip") {
    return { ok: false, reason: "day_sesh_no_viewers" };
  }
  return { ok: true, value: undefined };
}

export function canUpgradeViewerToRider(
  stomperId: StomperId,
  trip: Trip,
  memberships: TripMembership[],
  passes: PassEntitlement[],
  approverId: StomperId,
  atIso: string,
): GuardResult {
  if (!hasActivePass(passes, stomperId, atIso)) {
    return { ok: false, reason: "pass_inactive" };
  }
  const approver = findMembership(memberships, trip.id, approverId);
  if (!isHostOrCohost(approver)) {
    return { ok: false, reason: "not_host_or_cohost" };
  }
  if (!hasActivePass(passes, approverId, atIso)) {
    return { ok: false, reason: "approver_pass_inactive" };
  }
  return { ok: true, value: undefined };
}

/** Download allowed when at <= downloadUntilIso and not revoked. */
export function canDownloadViewer(
  viewer: ViewerEntitlement | undefined,
  atIso: string,
): GuardResult {
  if (!viewer) return { ok: false, reason: "viewer_download_denied" };
  if (viewer.revokedAtIso && isAtOrAfter(atIso, viewer.revokedAtIso)) {
    return { ok: false, reason: "viewer_download_denied", message: "revoked" };
  }
  if (!viewer.downloadUntilIso) {
    return {
      ok: false,
      reason: "viewer_download_denied",
      message: "no authoritative deadline (not finalized)",
    };
  }
  if (isBefore(atIso, viewer.downloadUntilIso) || atIso === viewer.downloadUntilIso) {
    return { ok: true, value: undefined };
  }
  return { ok: false, reason: "viewer_download_denied" };
}

/** Co-host cannot remove/demote host (D7). */
export function canRemoveOrDemote(
  actor: TripMembership,
  target: TripMembership,
): GuardResult {
  if (!isHostOrCohost(actor)) return { ok: false, reason: "not_host_or_cohost" };
  if (target.role === "host") {
    return { ok: false, reason: "cannot_remove_host" };
  }
  return { ok: true, value: undefined };
}
