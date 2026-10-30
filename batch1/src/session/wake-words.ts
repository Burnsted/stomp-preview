/**
 * SESSION wake names — registry only.
 * No unrestricted background listening. No proprietary radio SDKs.
 */

export type WakeNameId = "hey_session" | "yo_session" | "sesh";

export interface WakeName {
  id: WakeNameId;
  phrase: string;
  /** Optional shorter form; still requires explicit user-initiated listen session. */
  optional?: boolean;
}

export const WAKE_NAMES: readonly WakeName[] = [
  { id: "hey_session", phrase: "Hey Session" },
  { id: "yo_session", phrase: "Yo Session" },
  { id: "sesh", phrase: "Sesh", optional: true },
] as const;

export function normalizeWakeUtterance(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchWakeName(utterance: string): WakeName | undefined {
  const n = normalizeWakeUtterance(utterance);
  return WAKE_NAMES.find((w) => normalizeWakeUtterance(w.phrase) === n);
}
