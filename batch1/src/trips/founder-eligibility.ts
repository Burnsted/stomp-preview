/**
 * Founder's Edition eligibility — UNSET / DISABLED stub (t1208u D5).
 *
 * Gold Founder board styling may render as fiction; do NOT award Founder status
 * until owner approves cutoff. Options A/B/C remain TBD.
 * Not a paid SKU. No manufacturer trademarks. Youth excluded while D7 off.
 */

export type FounderEligibilityOption = "A" | "B" | "C" | "unset";

export type FounderEligibilityConfig = {
  /** Which option — UNSET until Ted picks. */
  ruleId: FounderEligibilityOption;
  /** ISO UTC cutoff — OWNER SUPPLIES when chosen. */
  cutoffAt: string | null;
  /** Option B count cap — null until chosen. */
  firstN: number | null;
  registeredByField: "accountCreatedAt" | "stomperProfileCreatedAt";
  sportsScope: "snowboarding";
  excludeYouthUntilApproved: true;
  /** Master switch — stays false until owner Go. */
  awardsEnabled: false;
  paidSku: false;
  manufacturerTrademarksAllowed: false;
  note: string;
};

/** Single policy config — disabled by default. */
export const FOUNDER_ELIGIBILITY: FounderEligibilityConfig = {
  ruleId: "unset",
  cutoffAt: null,
  firstN: null,
  registeredByField: "accountCreatedAt",
  sportsScope: "snowboarding",
  excludeYouthUntilApproved: true,
  awardsEnabled: false,
  paidSku: false,
  manufacturerTrademarksAllowed: false,
  note:
    "Founder eligibility UNSET/DISABLED. Options A/B/C TBD. Do not award Founder status until owner approves cutoff. Fiction gold styling OK; not a paid SKU.",
};

export type FounderAwardDecision =
  | { awarded: false; reason: "awards_disabled" | "cutoff_unset" | "youth_excluded" | "out_of_window"; notice: string }
  | { awarded: true; reason: "eligible"; notice: string };

/**
 * Always deny while awardsEnabled is false / cutoff unset.
 * Even if a future caller passes a registration timestamp, no award until Go.
 */
export function evaluateFounderEligibility(args: {
  registeredAtIso: string | null;
  isYouth?: boolean;
  nowIso: string;
  config?: FounderEligibilityConfig;
}): FounderAwardDecision {
  const cfg = args.config ?? FOUNDER_ELIGIBILITY;
  if (!cfg.awardsEnabled || cfg.ruleId === "unset") {
    return {
      awarded: false,
      reason: "awards_disabled",
      notice: cfg.note,
    };
  }
  if (args.isYouth && cfg.excludeYouthUntilApproved) {
    return {
      awarded: false,
      reason: "youth_excluded",
      notice: "Youth / Grom Founder grants blocked while D7 gate disabled.",
    };
  }
  if (!cfg.cutoffAt && cfg.ruleId === "A") {
    return {
      awarded: false,
      reason: "cutoff_unset",
      notice: "Option A cutoff not owner-supplied.",
    };
  }
  // Defensive: awardsEnabled is typed false; this path is unreachable until Go.
  return {
    awarded: false,
    reason: "awards_disabled",
    notice: "Founder awards remain disabled (fictional config).",
  };
}

/** Fiction-only gold board styling flag — does not imply entitlement. */
export function founderBoardFictionStyle(awarded: boolean): {
  goldFounderChrome: boolean;
  fictionalOnly: true;
  entitlement: false;
} {
  return {
    goldFounderChrome: awarded === true,
    fictionalOnly: true,
    entitlement: false,
  };
}
