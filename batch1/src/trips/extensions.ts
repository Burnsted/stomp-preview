import { isAtOrAfter } from "./clock.js";
import { findMembership, isHostOrCohost } from "./eligibility.js";
import { hasActivePass } from "./pass.js";
import type {
  Clock,
  ExtensionId,
  ExtensionRecord,
  GuardResult,
  PassEntitlement,
  StomperId,
  Trip,
  TripMembership,
} from "./types.js";

export function validateExtensionRecord(
  record: Partial<ExtensionRecord>,
): GuardResult<ExtensionRecord> {
  const required = [
    "id",
    "previousEndAt",
    "revisedEndAt",
    "approverStomperId",
    "approverRole",
    "approvedAt",
  ] as const;
  for (const key of required) {
    if (record[key] == null || record[key] === "") {
      return {
        ok: false,
        reason: "extension_fields_incomplete",
        message: `Missing locked field: ${key}`,
      };
    }
  }
  return { ok: true, value: record as ExtensionRecord };
}

export interface ExtendInput {
  trip: Trip;
  memberships: TripMembership[];
  passes: PassEntitlement[];
  actorId: StomperId;
  revisedEndAt: string;
  extensionId: ExtensionId;
  clock: Clock;
  requestedBy?: StomperId;
}

/**
 * Approve an extension while active.
 * Guards: host/cohost, approver active Pass (D5), approvedAt < scheduledEndAt,
 * entitlementOk, revisedEnd > previousEnd, not day_sesh, trip active.
 */
export function approveExtension(input: ExtendInput): GuardResult<{ trip: Trip; record: ExtensionRecord }> {
  const { trip, memberships, passes, actorId, revisedEndAt, extensionId, clock } = input;
  const at = clock.nowIso();

  if (trip.kind === "day_sesh") {
    return { ok: false, reason: "day_sesh_no_extension" };
  }
  if (trip.status === "completed" || trip.status === "retention-expired") {
    return { ok: false, reason: "trip_already_finalized" };
  }
  if (trip.status === "cancelled") {
    return { ok: false, reason: "trip_cancelled" };
  }
  if (trip.status !== "active") {
    return { ok: false, reason: "trip_not_active" };
  }
  // Auto-finalize if we're already at/past deadline before considering extension
  if (isAtOrAfter(at, trip.scheduledEndAt)) {
    return { ok: false, reason: "after_deadline", message: "approvedAt must be before scheduledEndAt" };
  }
  if (!trip.entitlementOk) {
    return { ok: false, reason: "entitlement_not_satisfied" };
  }

  const actor = findMembership(memberships, trip.id, actorId);
  if (!isHostOrCohost(actor)) {
    return { ok: false, reason: "not_host_or_cohost" };
  }
  if (!hasActivePass(passes, actorId, at)) {
    return { ok: false, reason: "approver_pass_inactive", message: "D5: approver must hold active Rider Pass" };
  }
  if (!(Date.parse(revisedEndAt) > Date.parse(trip.scheduledEndAt))) {
    return { ok: false, reason: "revised_end_not_after_previous" };
  }

  const record: ExtensionRecord = {
    id: extensionId,
    previousEndAt: trip.scheduledEndAt,
    revisedEndAt,
    approverStomperId: actorId,
    approverRole: actor.role as "host" | "cohost",
    approvedAt: at,
    requestedBy: input.requestedBy,
  };
  const validated = validateExtensionRecord(record);
  if (!validated.ok) return validated;

  // Append-only; do not mutate prior records. Membership participationEndsAt NOT moved here.
  const nextTrip: Trip = {
    ...trip,
    scheduledEndAt: revisedEndAt,
    extensions: [...trip.extensions, record],
    officialEndDate: null,
  };

  // Riders with active Pass track scheduledEndAt; lapsed (frozen) stay put.
  return { ok: true, value: { trip: nextTrip, record } };
}

/**
 * After a successful extension, bump participationEndsAt only for members with
 * currently active Pass (not frozen grace).
 */
export function syncParticipationAfterExtension(
  memberships: TripMembership[],
  trip: Trip,
  passes: PassEntitlement[],
  atIso: string,
): TripMembership[] {
  return memberships.map((m) => {
    if (m.tripId !== trip.id) return m;
    if (m.role === "viewer") return m;
    if (m.graceUntilAt && !hasActivePass(passes, m.stomperId, atIso)) {
      // Frozen — later extension does not move participationEndsAt (AF22)
      return m;
    }
    if (hasActivePass(passes, m.stomperId, atIso)) {
      return { ...m, participationEndsAt: trip.scheduledEndAt };
    }
    return m;
  });
}
