/**
 * Live conditions path — gated OFF until owner authorization (t1221u).
 * No paid API keys, no network calls in this pass.
 */
import { LIVE_CONDITIONS_ENABLED } from "./types";

export type LiveActivation = {
  enabled: boolean;
  reason: string;
};

export function liveConditionsActivation(): LiveActivation {
  if (!LIVE_CONDITIONS_ENABLED) {
    return {
      enabled: false,
      reason:
        "LIVE path gated off (LIVE_CONDITIONS_ENABLED=false). Owner must approve provider + keys before activation. Fiction adapter remains the only source.",
    };
  }
  return {
    enabled: true,
    reason: "LIVE path enabled — wire a licensed provider adapter before labeling LIVE.",
  };
}

/** Never call paid / live endpoints from this module in the fiction-first pass. */
export function assertLiveCallsBlocked(): void {
  const gate = liveConditionsActivation();
  if (!gate.enabled) return;
  throw new Error("LIVE path flagged enabled without a provider adapter — refuse silent fabrication.");
}
