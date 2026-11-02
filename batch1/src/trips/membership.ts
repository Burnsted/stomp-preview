import { isBefore, minIso } from "./clock.js";
import { hasActivePass } from "./pass.js";
import type {
  PassEntitlement,
  StomperId,
  Trip,
  TripMembership,
  TripRole,
} from "./types.js";

/**
 * Derive participationEndsAt (D9 / t1136u recommended derivation):
 * - Pass valid → tracks trip.scheduledEndAt
 * - Pass lapses mid-trip → frozen at graceUntilAt (= scheduledEndAt at lapse)
 * - Later extension does NOT move frozen value
 * - Renewal (new Pass covering new days) → recompute ≤ scheduledEndAt
 * - Never past finalize (officialEndDate)
 */
export function deriveParticipationEndsAt(args: {
  trip: Trip;
  membership: TripMembership;
  passes: PassEntitlement[];
  atIso: string;
}): string {
  const { trip, membership, passes, atIso } = args;
  const cap = trip.officialEndDate
    ? minIso(trip.scheduledEndAt, trip.officialEndDate)
    : trip.scheduledEndAt;

  if (hasActivePass(passes, membership.stomperId, atIso)) {
    return minIso(trip.scheduledEndAt, cap);
  }

  // Lapsed with frozen grace — do not move on later extensions
  if (membership.graceUntilAt) {
    return membership.participationEndsAt;
  }

  return membership.participationEndsAt || cap;
}

/**
 * On Pass lapse during an active trip: freeze graceUntilAt = current scheduledEndAt,
 * freeze participationEndsAt to that same value. Prior window recorded.
 */
export function applyPassLapseToMembership(
  membership: TripMembership,
  trip: Trip,
  lapsedAtIso: string,
): TripMembership {
  if (trip.status !== "active") return membership;
  if (membership.graceUntilAt) return membership; // already frozen
  const graceUntilAt = trip.scheduledEndAt;
  return {
    ...membership,
    graceUntilAt,
    participationEndsAt: graceUntilAt,
    priorGraceWindow: {
      fromIso: lapsedAtIso,
      untilIso: graceUntilAt,
    },
  };
}

/**
 * Mid-trip renewal: recompute participationEndsAt to min(newPass.end, scheduledEndAt).
 * Does NOT rewrite priorGraceWindow / graceUntilAt history record.
 * Archive clock restart is handled separately in retention.ts.
 */
export function applyPassRenewalToMembership(
  membership: TripMembership,
  trip: Trip,
  newPass: PassEntitlement,
): TripMembership {
  if (trip.status === "completed" || trip.status === "cancelled" || trip.status === "retention-expired") {
    // AF28 — renewal does not resurrect finalized trip; participationEndsAt unchanged
    return membership;
  }
  const nextEnd = minIso(newPass.endIso, trip.scheduledEndAt);
  return {
    ...membership,
    participationEndsAt: nextEnd,
    // graceUntilAt / priorGraceWindow intact (not rewritten)
  };
}

/** Cap all members' participationEndsAt at endedAt (early-end AF34). Grace records unchanged. */
export function capParticipationAtEarlyEnd(
  memberships: TripMembership[],
  tripId: Trip["id"],
  endedAt: string,
): TripMembership[] {
  return memberships.map((m) => {
    if (m.tripId !== tripId) return m;
    if (isBefore(endedAt, m.participationEndsAt)) {
      return { ...m, participationEndsAt: endedAt };
    }
    return m;
  });
}

export function appointCohost(args: {
  trip: Trip;
  memberships: TripMembership[];
  actorId: StomperId;
  targetId: StomperId;
  atIso: string;
}): { ok: true; memberships: TripMembership[] } | { ok: false; reason: string } {
  const actor = args.memberships.find(
    (m) => m.tripId === args.trip.id && m.stomperId === args.actorId,
  );
  if (!actor || (actor.role !== "host" && actor.role !== "cohost")) {
    return { ok: false, reason: "not_host_or_cohost" };
  }
  const target = args.memberships.find(
    (m) => m.tripId === args.trip.id && m.stomperId === args.targetId,
  );
  if (!target || target.status !== "active") {
    return { ok: false, reason: "target_missing" };
  }
  if (target.role === "host") {
    return { ok: false, reason: "cannot_remove_host" };
  }
  const next: TripMembership = {
    ...target,
    role: "cohost",
    appointedBy: args.actorId,
    appointedAt: args.atIso,
  };
  return {
    ok: true,
    memberships: args.memberships.map((m) =>
      m.tripId === args.trip.id && m.stomperId === args.targetId ? next : m,
    ),
  };
}

export function makeMembership(partial: {
  tripId: Trip["id"];
  stomperId: StomperId;
  role: TripRole;
  joinedAtIso: string;
  participationEndsAt: string;
  graceUntilAt?: string;
  appointedBy?: StomperId;
  appointedAt?: string;
  priorGraceWindow?: TripMembership["priorGraceWindow"];
  status?: TripMembership["status"];
}): TripMembership {
  return {
    tripId: partial.tripId,
    stomperId: partial.stomperId,
    role: partial.role,
    status: partial.status ?? "active",
    joinedAtIso: partial.joinedAtIso,
    participationEndsAt: partial.participationEndsAt,
    graceUntilAt: partial.graceUntilAt,
    appointedBy: partial.appointedBy,
    appointedAt: partial.appointedAt,
    priorGraceWindow: partial.priorGraceWindow,
  };
}
