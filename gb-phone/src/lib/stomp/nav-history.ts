/**
 * Screen back-stack helpers (t1236u).
 * Root Home (greet) never shows a misleading Back control.
 */
import type { Screen } from "@/lib/stomp/store";

/** Screens that are journey / root — Back is suppressed. */
export const NO_BACK_SCREENS: ReadonlySet<Screen> = new Set([
  "greet",
  "welcome",
  "home",
]);

export function shouldShowBack(screen: Screen, history: readonly Screen[]): boolean {
  if (NO_BACK_SCREENS.has(screen)) return false;
  return history.length > 0;
}

export function pushScreenHistory(
  history: readonly Screen[],
  from: Screen,
  to: Screen,
  max = 24,
): Screen[] {
  if (from === to) return [...history];
  // Don't stack duplicates of the same destination when bouncing.
  const next = [...history, from];
  return next.slice(-max);
}
