/** Shared result + error types (Full-cycle F). Local-only; no network. */
export type Ok<T> = { ok: true; value: T };
export type Err<E extends string = string> = { ok: false; error: E; message?: string };
export type Result<T, E extends string = string> = Ok<T> | Err<E>;
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E extends string>(error: E, message?: string): Err<E> => ({ ok: false, error, message });

/** Guards every full-cycle module re-asserts. Must stay false until owner approval. */
export const FULLCYCLE_GUARDS = {
  liveAuth: false,
  cloudSync: false,
  liveUpload: false,
  publicSharing: false,
  liveNfc: false,
  backgroundWakeWord: false,
  hardwareCompatClaims: false,
  isAuthoritativeGbApp: false,
} as const;

/** Rejects strings that look like real PII (emails / phone numbers). */
export function looksLikePii(s: string): boolean {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(s) || /(\+?\d[\d\s().-]{8,}\d)/.test(s);
}
