import { isAtOrAfter, isBefore } from "./clock.js";
import { findMembership, isHostOrCohost } from "./eligibility.js";
import { capParticipationAtEarlyEnd } from "./membership.js";
import { hasActivePass } from "./pass.js";
import { assertTimeZone } from "./timezone.js";
import type {
  Clock,
  GuardResult,
  PassEntitlement,
  StomperId,
  Trip,
  TripMembership,
  TripWorld,
} from "./types.js";

export function publishTrip(trip: Trip): GuardResult<Trip> {
  if (trip.status !== "draft") {
    return { ok: false, reason: "invalid_publish", message: `Cannot publish from ${trip.status}` };
  }
  const tz = assertTimeZone(trip.timeZone);
  if (!tz.ok) {
    return { ok: false, reason: "invalid_timezone", message: tz.message };
  }
  if (!isBefore(trip.startIso, trip.originalEndAt)) {
    return { ok: false, reason: "invalid_publish", message: "originalEndAt must be after start" };
  }
  return {
    ok: true,
    value: { ...trip, status: "scheduled", officialEndDate: null },
  };
}

/** scheduled → active when start reached (server UTC). */
export function maybeStartTrip(trip: Trip, clock: Clock): Trip {
  if (trip.status !== "scheduled") return trip;
  if (isAtOrAfter(clock.nowIso(), trip.startIso)) {
    return { ...trip, status: "active" };
  }
  return trip;
}

/**
 * Auto-finalize at scheduledEndAt unless a valid extension was already applied
 * (scheduledEndAt already advanced). Call after time advances.
 */
export function maybeAutoFinalize(trip: Trip, clock: Clock): Trip {
  if (trip.status !== "active") return trip;
  if (isAtOrAfter(clock.nowIso(), trip.scheduledEndAt)) {
    return {
      ...trip,
      status: "completed",
      officialEndDate: trip.scheduledEndAt,
      finalizedBy: "auto",
    };
  }
  return trip;
}

export function tickTrip(trip: Trip, clock: Clock): Trip {
  return maybeAutoFinalize(maybeStartTrip(trip, clock), clock);
}

export interface CancelInput {
  trip: Trip;
  memberships: TripMembership[];
  actorId: StomperId;
  confirmed: boolean;
  clock: Clock;
  reason?: string;
  passes?: PassEntitlement[];
}

/**
 * Cancel only from draft|scheduled (D1). Active → reject (use early-end).
 * officialEndDate stays null forever. Terminal; no reopen.
 */
export function cancelTrip(input: CancelInput): GuardResult<{ trip: Trip }> {
  const { trip, memberships, actorId, confirmed, clock, reason } = input;
  if (trip.status === "active") {
    return {
      ok: false,
      reason: "cannot_cancel_active",
      message: "Active trips use early-end, not cancel",
    };
  }
  if (trip.status !== "draft" && trip.status !== "scheduled") {
    return { ok: false, reason: "trip_cancelled", message: `Cannot cancel from ${trip.status}` };
  }
  if (!confirmed) {
    return { ok: false, reason: "confirmation_required" };
  }
  const actor = findMembership(memberships, trip.id, actorId);
  if (!isHostOrCohost(actor)) {
    // Allow cancel by hostId even if membership list incomplete in draft
    if (trip.hostId !== actorId) {
      return { ok: false, reason: "not_host_or_cohost" };
    }
  }
  const at = clock.nowIso();
  const role = actor?.role === "cohost" ? "cohost" : "host";
  return {
    ok: true,
    value: {
      trip: {
        ...trip,
        status: "cancelled",
        officialEndDate: null,
        cancelledAt: at,
        cancelledBy: actorId,
        cancelAudit: {
          actorId,
          actorRole: role,
          confirmedAt: at,
          reason,
        },
      },
    },
  };
}

export interface EarlyEndInput {
  trip: Trip;
  memberships: TripMembership[];
  passes: PassEntitlement[];
  actorId: StomperId;
  confirmed: boolean;
  clock: Clock;
  reason?: string;
}

/**
 * Early end (D2): host OR co-host + confirmation → completed,
 * officialEndDate := endedAt, finalizedBy=manual_early_end, audit, cap participation.
 */
export function earlyEndTrip(
  input: EarlyEndInput,
): GuardResult<{ trip: Trip; memberships: TripMembership[] }> {
  const { trip, memberships, actorId, confirmed, clock, reason } = input;
  if (trip.status !== "active") {
    return { ok: false, reason: "trip_not_active" };
  }
  if (!confirmed) {
    return { ok: false, reason: "confirmation_required" };
  }
  const actor = findMembership(memberships, trip.id, actorId);
  if (!isHostOrCohost(actor)) {
    return { ok: false, reason: "not_host_or_cohost" };
  }
  const endedAt = clock.nowIso();
  if (!isBefore(endedAt, trip.scheduledEndAt)) {
    // Early end must be before scheduled end; otherwise just auto-finalize
    return {
      ok: false,
      reason: "after_deadline",
      message: "Early end requires endedAt < scheduledEndAt",
    };
  }
  const nextTrip: Trip = {
    ...trip,
    status: "completed",
    officialEndDate: endedAt,
    finalizedBy: "manual_early_end",
    endedEarly: {
      actorId,
      actorRole: actor.role as "host" | "cohost",
      confirmedAt: endedAt,
      reason,
    },
  };
  const nextMemberships = capParticipationAtEarlyEnd(memberships, trip.id, endedAt);
  return { ok: true, value: { trip: nextTrip, memberships: nextMemberships } };
}

/** Reject extend/reopen/edit ends on completed or cancelled via trip-management. */
export function rejectTripManagementMutation(
  trip: Trip,
): GuardResult {
  if (trip.status === "completed" || trip.status === "retention-expired") {
    return { ok: false, reason: "trip_already_finalized" };
  }
  if (trip.status === "cancelled") {
    return { ok: false, reason: "trip_cancelled" };
  }
  return { ok: true, value: undefined };
}

export function tryReopenTrip(trip: Trip): GuardResult {
  return rejectTripManagementMutation(trip).ok === false
    ? rejectTripManagementMutation(trip)
    : { ok: false, reason: "trip_already_finalized", message: "Ordinary reopen rejected" };
}

export function tryEditOfficialEndDate(trip: Trip, _next: string): GuardResult {
  if (trip.officialEndDate != null) {
    return { ok: false, reason: "trip_already_finalized", message: "officialEndDate immutable after finalize" };
  }
  if (trip.status === "cancelled") {
    return { ok: false, reason: "trip_cancelled", message: "cancelled officialEndDate stays null" };
  }
  return { ok: false, reason: "trip_already_finalized" };
}

/** Advance world clock: start + auto-finalize. */
export function tickWorld(world: TripWorld, clock: Clock): TripWorld {
  return { ...world, trip: tickTrip(world.trip, clock) };
}

/** Attribution helper for privileged actions (D7). */
export function attributeAction(
  memberships: TripMembership[],
  trip: Trip,
  actorId: StomperId,
  passes: PassEntitlement[],
  atIso: string,
): { actorId: StomperId; role: string; passActive: boolean } | null {
  const m = findMembership(memberships, trip.id, actorId);
  if (!m) return null;
  return {
    actorId,
    role: m.role,
    passActive: hasActivePass(passes, actorId, atIso),
  };
}
