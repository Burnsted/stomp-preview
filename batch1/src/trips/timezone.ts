import { err, ok } from "../core/result.js";
import type { Result } from "../core/result.js";

/** Minimal IANA allowlist used by fictional fixtures + AF39. */
const KNOWN_IANA = new Set([
  "UTC",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "Pacific/Auckland",
  "Europe/London",
]);

export function isValidIanaTimeZone(tz: string): boolean {
  if (KNOWN_IANA.has(tz)) return true;
  try {
    // Throws RangeError for invalid zones in modern engines.
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function assertTimeZone(tz: string): Result<string, "invalid_timezone"> {
  return isValidIanaTimeZone(tz) ? ok(tz) : err("invalid_timezone", `Invalid IANA timeZone: ${tz}`);
}

/**
 * Format a UTC instant for display in the trip's IANA zone.
 * Guards always use UTC; this is display-only.
 */
export function formatInTimeZone(
  utcIso: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = new Date(utcIso);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
    ...options,
  });
  return fmt.format(d);
}

/** AF39 helper: Dec 10, 11:59 PM MST style (no comma after day in some engines). */
export function renderScheduledEndLabel(utcIso: string, timeZone: string): string {
  return formatInTimeZone(utcIso, timeZone);
}

/**
 * DST-crossing check: same wall-clock format rules across a spring/fall boundary.
 * Returns offset minutes east of UTC (negative for US zones).
 */
export function offsetMinutesAt(utcIso: string, timeZone: string): number {
  const d = new Date(utcIso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(d);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // e.g. "GMT-7" / "GMT-6"
  const m = /GMT([+-]\d+)(?::(\d+))?/.exec(tzName);
  if (!m) return 0;
  const hours = Number(m[1]);
  const mins = Number(m[2] ?? "0");
  return hours * 60 + Math.sign(hours || 1) * mins;
}
