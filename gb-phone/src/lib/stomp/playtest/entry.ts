/**
 * Family playtest entry routing (t1215u).
 * First-time default screen is branded `welcome` (store default).
 * Partial avatar drafts resume onboard without restart/corruption.
 * Completed profiles never re-enter welcome/onboard; Home is `greet`.
 * FICTIONAL / DEMO ONLY.
 */

import type { OnboardStep } from "@/lib/stomp/avatar/types";
import type { Screen } from "@/lib/stomp/store";

export type PlaytestEntryInput = {
  onboardComplete: boolean;
  hasConfig: boolean;
  draftStep: OnboardStep;
  draftStarterId: string | null;
  persistedScreen: Screen | null | undefined;
};

/** True when draft has progress that must not restart from step 1. */
export function hasPartialAvatarDraft(input: {
  onboardComplete: boolean;
  draftStep: OnboardStep;
  draftStarterId: string | null;
}): boolean {
  if (input.onboardComplete) return false;
  if (input.draftStarterId) return true;
  if (input.draftStep !== 1 && input.draftStep !== "done") return true;
  return false;
}

/**
 * Resolve a corrective screen after rehydrate, or `null` when the persisted
 * screen should stay as-is.
 */
export function resolvePlaytestEntry(input: PlaytestEntryInput): Screen | null {
  const screen = input.persistedScreen ?? null;
  const completed = input.onboardComplete && input.hasConfig;

  if (hasPartialAvatarDraft(input)) {
    return screen === "avatar-onboard" ? null : "avatar-onboard";
  }

  if (completed) {
    // Returning / completed: never re-show welcome or restart onboard.
    if (screen === "welcome" || screen === "avatar-onboard") return "greet";
    return null;
  }

  // First-time: store default is welcome; do not yank an explicit Explore/Home jump.
  return null;
}

/** Home for returning demos / after Explore Solo. */
export const PLAYTEST_HOME_SCREEN: Screen = "greet";
