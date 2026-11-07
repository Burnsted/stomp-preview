/**
 * Demo Pass lifecycle bridge for RiderHub — FICTIONAL ONLY (t1208u).
 * Re-exports batch1 policy; never treats client flags as production entitlements.
 */
export { PASS_EXPORT_ONLY_MONTHS } from "@woz/trips/retention.js";

export {
  PASS_LIFECYCLE_POLICY,
  canAccessReportCard,
  enterExportOnly,
  renewPassAccess,
  resolvePassAccess,
  type PassAccessState,
  type PassLifecycleInput,
  type PassLifecycleSnapshot,
} from "@woz/trips/pass-lifecycle.js";

export {
  WELCOME_BACK_INACTIVE_DAYS,
  decideWelcomeBack,
  type SavedDemoHistory,
  type WelcomeBackDecision,
} from "@woz/trips/welcome-back.js";

export {
  FOUNDER_ELIGIBILITY,
  evaluateFounderEligibility,
  founderBoardFictionStyle,
} from "@woz/trips/founder-eligibility.js";

export {
  buildCrewPortraitComposite,
  CHARACTER_SLOT_LABELS,
  isAllowedSlotLabel,
  type CharacterSlotLabel,
  type PortraitParticipant,
  type PortraitViewerRole,
} from "@woz/trips/crew-portrait.js";

export {
  resolveTripDropVisual,
  type TripDropVisual,
  type TripDropVisualState,
} from "@woz/trips/trip-drop-visual.js";
