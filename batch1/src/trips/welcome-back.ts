/**
 * Returning STOMPER welcome-back — FICTIONAL / DEMO ONLY (t1208u D3).
 *
 * ≥90 days inactive may surface personalized welcome-back from **actual saved**
 * demo history only. Pass-expiry WINS over welcome-back: expired users must NOT
 * unlock full unauthorized history via welcome-back.
 */

import { addUtcDays, isAtOrAfter, isBefore } from "./clock.js";
import { resolvePassAccess, type PassLifecycleInput } from "./pass-lifecycle.js";

export const WELCOME_BACK_INACTIVE_DAYS = 90;

export type SavedDemoHistory = {
  /** Last activity ISO from demo/localStorage — must be real saved data. */
  lastActiveIso: string | null;
  lastEligibleTripLabel?: string | null;
  workingOnTricks?: readonly string[];
  stompedTricks?: readonly string[];
  savedBoardLabels?: readonly string[];
  avatarDisplayName?: string | null;
  upcomingTripDropInvites?: readonly string[];
  reportCardAvailable?: boolean;
};

export type WelcomeBackDecision =
  | {
      show: false;
      reason:
        | "pass_expired_wins"
        | "not_inactive_enough"
        | "no_saved_history"
        | "active_pass_required";
      notice: string;
    }
  | {
      show: true;
      reason: "inactive_90d_active_pass";
      notice: string;
      /** Only fields present in saved demo history — never invented. */
      payload: {
        lastEligibleTripLabel: string | null;
        workingOnTricks: readonly string[];
        stompedTricks: readonly string[];
        savedBoardLabels: readonly string[];
        avatarDisplayName: string | null;
        upcomingTripDropInvites: readonly string[];
        reportCardAvailable: boolean;
      };
    };

/**
 * Welcome-back eligibility. Pass-expiry wins: any non-active Pass access
 * returns show:false with pass_expired_wins (even if inactive ≥90d).
 */
export function decideWelcomeBack(args: {
  pass: PassLifecycleInput;
  saved: SavedDemoHistory;
  nowIso: string;
}): WelcomeBackDecision {
  const access = resolvePassAccess(args.pass);
  if (access.state !== "active") {
    return {
      show: false,
      reason: "pass_expired_wins",
      notice:
        "Pass expiry wins over welcome-back. Limited-access / export experience only — no full-history unlock.",
    };
  }

  if (!args.saved.lastActiveIso) {
    return {
      show: false,
      reason: "no_saved_history",
      notice: "No actual saved demo history to personalize welcome-back.",
    };
  }

  const threshold = addUtcDays(args.saved.lastActiveIso, WELCOME_BACK_INACTIVE_DAYS);
  if (isBefore(args.nowIso, threshold)) {
    return {
      show: false,
      reason: "not_inactive_enough",
      notice: `Welcome-back needs ≥${WELCOME_BACK_INACTIVE_DAYS} days inactive from saved activity.`,
    };
  }

  if (!isAtOrAfter(args.nowIso, threshold)) {
    return {
      show: false,
      reason: "not_inactive_enough",
      notice: `Welcome-back needs ≥${WELCOME_BACK_INACTIVE_DAYS} days inactive from saved activity.`,
    };
  }

  return {
    show: true,
    reason: "inactive_90d_active_pass",
    notice:
      "Welcome back — personalized from actual saved demo history only. No invented accomplishments.",
    payload: {
      lastEligibleTripLabel: args.saved.lastEligibleTripLabel ?? null,
      workingOnTricks: [...(args.saved.workingOnTricks ?? [])],
      stompedTricks: [...(args.saved.stompedTricks ?? [])],
      savedBoardLabels: [...(args.saved.savedBoardLabels ?? [])],
      avatarDisplayName: args.saved.avatarDisplayName ?? null,
      upcomingTripDropInvites: [...(args.saved.upcomingTripDropInvites ?? [])],
      reportCardAvailable: args.saved.reportCardAvailable === true,
    },
  };
}
