/**
 * Sesh / voice boundaries for Campfire CF-2.
 * May prepare share or navigate existing surfaces — never bypass confirm,
 * never execute removals / deletes of others' content.
 * Animation state machine (AF-CF-51) deferred — GB frozen.
 */
import type { DenyReason, PreparedVoiceAction, SquadId, StomperId } from "./cf2-types.js";
import { UNRESOLVED_GATES } from "./policy.js";

export type VoiceUtterance =
  | { kind: "post_to_all_squads" }
  | { kind: "share_to_squad"; squadId: SquadId }
  | { kind: "remove_member"; targetName: string }
  | { kind: "delete_others_message"; targetName: string }
  | { kind: "unknown"; text: string };

export function parseVoiceUtterance(text: string): VoiceUtterance {
  const t = text.trim().toLowerCase();
  if (
    t.includes("post to all") ||
    t.includes("all my squads") ||
    t.includes("every squad")
  ) {
    return { kind: "post_to_all_squads" };
  }
  if (t.startsWith("remove ") || t.includes("remove member")) {
    return { kind: "remove_member", targetName: text };
  }
  if (t.includes("delete") && (t.includes("message") || t.includes("'s"))) {
    return { kind: "delete_others_message", targetName: text };
  }
  if (t.includes("share") || t.includes("post to")) {
    return { kind: "share_to_squad", squadId: "unspecified" as SquadId };
  }
  return { kind: "unknown", text };
}

export function seshMayExecute(
  action: PreparedVoiceAction,
): action is Extract<
  PreparedVoiceAction,
  { kind: "share_prepare" } | { kind: "navigate_existing" }
> {
  return action.kind === "share_prepare" || action.kind === "navigate_existing";
}

export function prepareFromVoice(
  utterance: VoiceUtterance,
  _actorId: StomperId,
): PreparedVoiceAction {
  switch (utterance.kind) {
    case "post_to_all_squads":
      return {
        kind: "share_prepare",
        needsConfirm: true,
        multiRecipient: true,
      };
    case "share_to_squad":
      return {
        kind: "share_prepare",
        squadId: utterance.squadId,
        needsConfirm: true,
        multiRecipient: false,
      };
    case "remove_member":
      return {
        kind: "navigate_existing",
        target: "squad_screen",
      };
    case "delete_others_message":
      return {
        kind: "denied",
        reason: "not_author" satisfies DenyReason,
        message: "Voice cannot delete another STOMPER's message",
      };
    default:
      return {
        kind: "denied",
        reason: "unresolved_policy",
        message: "Unrecognized voice command",
      };
  }
}

/** Mic denied → fall back to text compose. */
export function micDeniedFallback(): { mode: "text"; voice: false } {
  return { mode: "text", voice: false };
}

export function reducedMotionSeshPref(prefersReducedMotion: boolean): {
  animate: boolean;
  reason?: string;
} {
  if (prefersReducedMotion) {
    return { animate: false, reason: "prefers-reduced-motion" };
  }
  return { animate: true };
}

/** AF-CF-51 deferred — animation state machine needs GB. */
export function seshAnimationStateMachine(): {
  enabled: false;
  gate: typeof UNRESOLVED_GATES.sesh_animation_gb;
} {
  return { enabled: false, gate: UNRESOLVED_GATES.sesh_animation_gb };
}

export const OUT_OF_SCOPE_ROUTES = [
  "capture_studio",
  "other_sports",
  "kiosk",
  "payments",
  "live_moderation_console",
] as const;

export function isOutOfScopeRoute(route: string): boolean {
  return (OUT_OF_SCOPE_ROUTES as readonly string[]).includes(route);
}
