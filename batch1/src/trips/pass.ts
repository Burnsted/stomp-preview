import { isAtOrAfter, isBefore } from "./clock.js";
import type { GuardResult, PassEntitlement, StomperId } from "./types.js";

export function findPassAt(
  passes: PassEntitlement[],
  stomperId: StomperId,
  atIso: string,
): PassEntitlement | undefined {
  // Prefer the entitlement covering `atIso`; fall back to latest by endIso.
  const covering = passes.filter(
    (p) =>
      p.stomperId === stomperId &&
      p.status === "active" &&
      isAtOrAfter(atIso, p.startIso) &&
      isBefore(atIso, p.endIso),
  );
  if (covering.length > 0) {
    return covering.sort((a, b) => (a.endIso < b.endIso ? 1 : -1))[0];
  }
  return passes
    .filter((p) => p.stomperId === stomperId)
    .sort((a, b) => (a.endIso < b.endIso ? 1 : -1))[0];
}

export function hasActivePass(
  passes: PassEntitlement[],
  stomperId: StomperId,
  atIso: string,
): boolean {
  return passes.some(
    (p) =>
      p.stomperId === stomperId &&
      p.status === "active" &&
      isAtOrAfter(atIso, p.startIso) &&
      isBefore(atIso, p.endIso),
  );
}

export function requireActivePass(
  passes: PassEntitlement[],
  stomperId: StomperId,
  atIso: string,
): GuardResult {
  if (hasActivePass(passes, stomperId, atIso)) return { ok: true, value: undefined };
  return { ok: false, reason: "pass_inactive", message: `No active Pass for ${stomperId} at ${atIso}` };
}

/** Latest Pass end for a stomper (any status), for archive anchoring. */
export function latestPassEnd(
  passes: PassEntitlement[],
  stomperId: StomperId,
): string | undefined {
  const owned = passes.filter((p) => p.stomperId === stomperId);
  if (owned.length === 0) return undefined;
  return owned.sort((a, b) => (a.endIso < b.endIso ? 1 : -1))[0].endIso;
}

export function lapsePass(
  pass: PassEntitlement,
  atIso: string,
): PassEntitlement {
  return {
    ...pass,
    status: "lapsed",
    history: [...pass.history, { kind: "lapsed", atIso }],
  };
}
