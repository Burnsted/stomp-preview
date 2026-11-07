/**
 * A7 — SPECIFICATION ONLY (t1152u rehearsal).
 *
 * Planning assumption (NOT production authorization):
 *   #12 AvatarConfig.ageBand "grom"  →  #14 AccountStatus "youth"
 *   #12 AvatarConfig.ageBand "adult" →  #14 AccountStatus "active"
 *   erased AccountStatus is preserved when already known (never invent erasure).
 *
 * HARD RULES for this rehearsal:
 * - No GB shell / gb-phone edits.
 * - No youth enrollment, guardian consent, or live age verification.
 * - A grom *label* does NOT prove an authorized youth account.
 * - Campfire youth_disabled gate may use the mapped status in fictional tests only.
 *
 * See: docs/integration-rehearsal/A7-AGE-BAND-SPEC.md
 */

export type AvatarAgeBand = "adult" | "grom";
export type AccountStatusView = "active" | "youth" | "erased";

export type CrewMateView = {
  code: string;
  name: string;
};

export type MembershipView = {
  /** Fictional view only — role defaults to member; state active. */
  stomperId: string;
  role: "member";
  state: "active";
  displayName: string;
  source: "crew_mate_view";
};

/**
 * Thin documented stub — pure mapping for fictional fixtures / AF-XINT.
 * Does NOT enroll youth or change Grom authorization in any product shell.
 */
export function ageBandToAccountStatus(
  ageBand: AvatarAgeBand,
  existing?: AccountStatusView,
): AccountStatusView {
  if (existing === "erased") return "erased";
  if (ageBand === "grom") return "youth";
  return "active";
}

/**
 * Thin view adapter: gb-phone CrewMate → Campfire-shaped membership view.
 * SPEC ONLY — does not write Squad/Membership stores or touch GB shell.
 */
export function crewMateToMembership(mate: CrewMateView): MembershipView {
  return {
    stomperId: mate.code,
    role: "member",
    state: "active",
    displayName: mate.name,
    source: "crew_mate_view",
  };
}
