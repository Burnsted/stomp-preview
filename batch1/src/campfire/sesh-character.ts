/**
 * SV-0 lightweight Sesh character-state mapper (logic only).
 * READY/LISTENING · WORKING · DONE — DONE only on delivered.
 * Visual assets wait for GB; this is pure state mapping.
 */
import type { SeshPendingStatus } from "./sesh-pending.js";

export type SeshCharacterState = "ready" | "listening" | "working" | "done";

/** Alias used in AF copy — Ready/Listening is one visual family. */
export type SeshCharacterPose = SeshCharacterState;

/**
 * Map pending (or null idle) → character pose.
 * DONE exclusively when status === delivered.
 * Failures / cancel / expiry never show DONE.
 */
export function characterForPendingStatus(
  status: SeshPendingStatus | null | undefined,
): SeshCharacterState {
  if (status === "delivered") return "done";
  if (status === "confirmed" || status === "queued") return "working";
  if (status === "prepared") return "listening";
  // cancelled | expired | replaced | rejected_recheck | failed | ambiguous | idle
  return "ready";
}

/** Reduced-motion: same pose names; callers skip animation loops. */
export function characterPoseReducedMotion(
  status: SeshPendingStatus | null | undefined,
): { pose: SeshCharacterState; animate: false } {
  return { pose: characterForPendingStatus(status), animate: false };
}

export function isDoneOnlyOnDelivered(
  status: SeshPendingStatus,
): boolean {
  return characterForPendingStatus(status) === "done"
    ? status === "delivered"
    : true;
}
