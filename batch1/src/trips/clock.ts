import type { Clock } from "./types.js";

/** Injected clock — no live Date.now() dependency in production sense. */
export function fixedClock(iso: string): Clock {
  return { nowIso: () => iso };
}

export function advanceClock(clock: Clock, toIso: string): Clock {
  return fixedClock(toIso);
}

export function compareIso(a: string, b: string): number {
  return Date.parse(a) - Date.parse(b);
}

export function isBefore(a: string, b: string): boolean {
  return compareIso(a, b) < 0;
}

export function isAtOrAfter(a: string, b: string): boolean {
  return compareIso(a, b) >= 0;
}

export function isBeforeOrEqual(a: string, b: string): boolean {
  return compareIso(a, b) <= 0;
}

export function minIso(a: string, b: string): string {
  return compareIso(a, b) <= 0 ? a : b;
}

export function maxIso(a: string, b: string): string {
  return compareIso(a, b) >= 0 ? a : b;
}

/** Add whole days to an ISO instant (UTC arithmetic). */
export function addUtcDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Add hours to an ISO instant (UTC). */
export function addUtcHours(iso: string, hours: number): string {
  const d = new Date(iso);
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Add months approximating 30.4375 days? Prefer calendar months via UTC date. */
export function addUtcMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}
