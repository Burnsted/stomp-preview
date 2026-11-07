/**
 * Day Sesh entitlement — active Rider Pass required; NO Trip Drop grace; NO Viewers; $0.
 */
import { isAtOrAfter, isBefore } from "../trips/clock.js";
import { hasActivePass } from "../trips/pass.js";
import type { PassEntitlement, StomperId } from "../trips/types.js";
import { daySeshStatusAt } from "./lifecycle.js";
import type { DaySesh, DaySeshParticipant, GuardResult } from "./types.js";

/**
 * Join / access Day Sesh: active Pass only. Trip Drop graceUntilAt NEVER unlocks Day Sesh.
 */
export function canJoinDaySesh(
  stomperId: StomperId,
  sesh: DaySesh,
  passes: PassEntitlement[],
  atIso: string,
): GuardResult {
  const status = daySeshStatusAt(sesh, atIso);
  if (status === "closed" || status === "expired") {
    return { ok: false, reason: "day_sesh_expired" };
  }
  if (!hasActivePass(passes, stomperId, atIso)) {
    return {
      ok: false,
      reason: "pass_inactive",
      message: "Day Sesh requires active Rider Pass (no grace)",
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Per-rider access at `atIso`: must be participant, within participationEndsAt, active Pass.
 * Pass expiry mid-sesh cuts access immediately (plan default) — no grace.
 */
export function riderDaySeshAccessAt(
  participant: DaySeshParticipant | undefined,
  sesh: DaySesh,
  passes: PassEntitlement[],
  atIso: string,
): boolean {
  if (!participant) return false;
  if (sesh.status === "closed" || sesh.closedAt) return false;
  if (isAtOrAfter(atIso, participant.participationEndsAt) && atIso !== participant.participationEndsAt) {
    return false;
  }
  // Still before scheduled start: join allowed with Pass, but "riding" access starts at start
  if (isBefore(atIso, sesh.scheduledStartAt)) {
    return hasActivePass(passes, participant.stomperId, atIso);
  }
  return hasActivePass(passes, participant.stomperId, atIso);
}

/** Day Sesh never has Viewers. */
export function canAddDaySeshViewer(_sesh: DaySesh): GuardResult {
  return { ok: false, reason: "day_sesh_no_viewers", message: "Day Sesh has no Viewers" };
}

/** No additional Day Sesh charge. */
export function daySeshCharge(_sesh: DaySesh): 0 {
  return 0;
}

/**
 * Explicit denial helper when caller also holds a Trip membership with grace —
 * proves Trip Drop grace cannot grant Day Sesh access.
 */
export function daySeshDeniedDespiteTripGrace(
  stomperId: StomperId,
  sesh: DaySesh,
  passes: PassEntitlement[],
  atIso: string,
  tripGraceUntilAt: string | undefined,
): GuardResult {
  const join = canJoinDaySesh(stomperId, sesh, passes, atIso);
  if (join.ok) return join;
  // Even if grace is still open on a Trip Drop, Day Sesh stays denied without Pass
  if (tripGraceUntilAt && (isBefore(atIso, tripGraceUntilAt) || atIso === tripGraceUntilAt)) {
    return {
      ok: false,
      reason: "pass_inactive",
      message: "Trip Drop grace NEVER unlocks Day Sesh",
    };
  }
  return join;
}
