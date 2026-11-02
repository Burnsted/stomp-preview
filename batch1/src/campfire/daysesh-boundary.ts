/**
 * Day Sesh ↔ Campfire boundary (Campfire-side guarantee).
 * Closing a Day Sesh NEVER deletes/mutates Squad or Campfire records.
 * PR #13 daysesh/* is NOT on main — local stub only for fictional tests.
 */
import type {
  Campfire,
  CloseDaySeshResult,
  DaySeshStub,
  Membership,
  Squad,
  StomperId,
} from "./cf2-types.js";
import { daySeshMediaDeadline } from "./retention.js";

export function closeDaySesh(
  sesh: DaySeshStub,
  nowIso: string,
): CloseDaySeshResult {
  return {
    sesh: { ...sesh, status: "closed", closedAt: nowIso },
    campfireEffects: [],
  };
}

/** Assert Squad + Campfire unchanged after Day Sesh close. */
export function assertCampfireUntouched(args: {
  before: { squad: Squad; campfire: Campfire; memberships: Membership[] };
  after: { squad: Squad; campfire: Campfire; memberships: Membership[] };
}): boolean {
  return (
    JSON.stringify(args.before.squad) === JSON.stringify(args.after.squad) &&
    JSON.stringify(args.before.campfire) ===
      JSON.stringify(args.after.campfire) &&
    JSON.stringify(args.before.memberships) ===
      JSON.stringify(args.after.memberships)
  );
}

/**
 * Day Sesh / Trip Viewer participation never implies Squad membership.
 */
export function viewerOrParticipantHasSquadAccess(args: {
  stomperId: StomperId;
  memberships: readonly Membership[];
  squadId: string;
  isTripViewer: boolean;
  isDaySeshParticipant: boolean;
}): boolean {
  const member = args.memberships.some(
    (m) =>
      m.squadId === args.squadId &&
      m.stomperId === args.stomperId &&
      m.state === "active",
  );
  if (member) return true;
  // Viewer / DS participant alone → no entitlement leak
  if (args.isTripViewer || args.isDaySeshParticipant) return false;
  return false;
}

export function daySeshMediaPolicyFlag() {
  return daySeshMediaDeadline();
}
