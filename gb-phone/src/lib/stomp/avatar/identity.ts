/**
 * STOMPER display-name identity helpers (t1169u).
 * Starter `.label` values (Nova, Mira, Kai, …) are appearance-template tags only —
 * never silent displayName fallbacks.
 */

/** Existing commit gate: non-empty after trim. No other product rules found in-repo. */
export function isValidStomperDisplayName(raw: string): boolean {
  return raw.trim().length > 0;
}

/** Ordinal look copy for starter selector UI (not a personality / rider name). */
export function lookOrdinalLabel(index1Based: number, total: number): string {
  return `Look ${index1Based} of ${total}`;
}
