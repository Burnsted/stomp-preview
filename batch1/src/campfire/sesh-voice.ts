/**
 * Sesh / voice boundaries for Campfire CF-2 + SV-0 confirm phrases.
 * May prepare share or navigate existing surfaces — never bypass confirm,
 * never execute removals / deletes of others' content.
 * Animation state machine (AF-CF-51) deferred — GB frozen.
 */
import type { DenyReason, PreparedVoiceAction, SquadId, StomperId } from "./cf2-types.js";
import { UNRESOLVED_GATES } from "./policy.js";
import {
  type PendingStore,
  type SeshClaimDeny,
  type SeshPendingAction,
} from "./sesh-pending.js";
import { err, ok, type Result } from "../core/result.js";

export type VoiceUtterance =
  | { kind: "post_to_all_squads" }
  | { kind: "share_to_squad"; squadId: SquadId }
  | { kind: "remove_member"; targetName: string }
  | { kind: "delete_others_message"; targetName: string }
  | { kind: "report_or_block"; targetName: string }
  | { kind: "confirm_approve" }
  | { kind: "confirm_cancel" }
  | { kind: "confirm_ambiguous" }
  | { kind: "unknown"; text: string };

/** Normalize for phrase match: lowercase, strip punctuation + trailing please. */
export function normalizeConfirmTranscript(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\bplease\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const APPROVE_PHRASES = new Set([
  "yes approve",
  "yes confirm",
  "sesh approve it",
]);

const CANCEL_PHRASES = new Set(["cancel", "no cancel"]);

export type ConfirmPhraseMatch =
  | "approve"
  | "cancel"
  | "ambiguous"
  | "reject";

/**
 * Exact GO phrases (punctuation-tolerant):
 * "Yes, approve" | "Yes, confirm" | "Sesh, approve it"
 * Cancel: "Cancel" | "No, cancel"
 * Alone yes/yeah/approve/sure → reject. Approve+cancel tokens → ambiguous.
 */
export function matchConfirmPhrase(text: string): ConfirmPhraseMatch {
  const n = normalizeConfirmTranscript(text);
  if (!n) return "reject";

  const hasApproveToken =
    /\bapprove\b/.test(n) || /\bconfirm\b/.test(n);
  const hasCancelToken = /\bcancel\b/.test(n);
  if (hasApproveToken && hasCancelToken) return "ambiguous";

  if (APPROVE_PHRASES.has(n)) return "approve";
  if (CANCEL_PHRASES.has(n)) return "cancel";

  // Standalone fragments are not approval
  if (
    n === "yes" ||
    n === "yeah" ||
    n === "yep" ||
    n === "sure" ||
    n === "approve" ||
    n === "confirm" ||
    n === "ok" ||
    n === "okay"
  ) {
    return "reject";
  }

  return "reject";
}

/** Command + approval in one utterance is NOT approval (AF-SV-13). */
export function utteranceEmbedsCommandAndApproval(text: string): boolean {
  const n = normalizeConfirmTranscript(text);
  const hasCommand =
    /\b(tell|share|post|send)\b/.test(n) ||
    /\ball my squads\b/.test(n) ||
    /\bevery squad\b/.test(n);
  const phrase = matchConfirmPhrase(text);
  const hasApproveAlone = APPROVE_PHRASES.has(n);
  // If the whole string is exactly an approve phrase, it's not embedded
  if (hasApproveAlone) return false;
  if (!hasCommand) return false;
  return (
    phrase === "approve" ||
    /\byes approve\b/.test(n) ||
    /\byes confirm\b/.test(n) ||
    /\bsesh approve it\b/.test(n)
  );
}

export function parseVoiceUtterance(text: string): VoiceUtterance {
  const raw = text.trim();
  const t = raw.toLowerCase();

  // Confirm phrases only when the utterance is confirm-shaped (not command+approve)
  if (!utteranceEmbedsCommandAndApproval(raw)) {
    const phrase = matchConfirmPhrase(raw);
    if (phrase === "approve") return { kind: "confirm_approve" };
    if (phrase === "cancel") return { kind: "confirm_cancel" };
    if (phrase === "ambiguous") return { kind: "confirm_ambiguous" };
  }

  if (
    t.includes("post to all") ||
    t.includes("all my squads") ||
    t.includes("every squad") ||
    t.includes("share to all")
  ) {
    return { kind: "post_to_all_squads" };
  }
  if (
    /\breport\b/.test(t) ||
    /\bblock\b/.test(t)
  ) {
    return { kind: "report_or_block", targetName: text };
  }
  if (t.startsWith("remove ") || t.includes("remove member")) {
    return { kind: "remove_member", targetName: text };
  }
  if (t.includes("delete") && (t.includes("message") || t.includes("'s"))) {
    return { kind: "delete_others_message", targetName: text };
  }
  if (t.includes("share") || t.includes("post to") || t.includes("tell ")) {
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
      // CONFLICT-1 / SV-0: deny — one Squad at a time
      return {
        kind: "denied",
        reason: "multi_recipient" satisfies DenyReason,
        message: "one Squad at a time",
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
    case "report_or_block":
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
    case "confirm_approve":
    case "confirm_cancel":
    case "confirm_ambiguous":
      // Confirm handled via PendingStore.claim — not a prepare action
      return {
        kind: "denied",
        reason: "needs_confirm",
        message: "No pending action to confirm",
      };
    default:
      return {
        kind: "denied",
        reason: "unresolved_policy",
        message: "Unrecognized voice command",
      };
  }
}

/**
 * Voice or tap confirm against the shared pendingId (CAS).
 * Duplicate confirm → already_handled, no second send.
 */
export function claimPendingConfirmation(
  store: PendingStore,
  args: {
    pendingId: string;
    actorId: StomperId;
    channel: "voice" | "tap";
    sessionUnlocked?: boolean;
  },
): Result<SeshPendingAction, SeshClaimDeny> {
  return store.claim(args.pendingId, args.channel, args.actorId, {
    sessionUnlocked: args.sessionUnlocked,
  });
}

/** Apply a spoken confirm/cancel against current pending. */
export function applyVoiceConfirm(
  store: PendingStore,
  args: {
    text: string;
    actorId: StomperId;
    sessionUnlocked?: boolean;
  },
): Result<
  SeshPendingAction,
  SeshClaimDeny | "reject_phrase" | "no_pending" | "ambiguous_phrase"
> {
  if (utteranceEmbedsCommandAndApproval(args.text)) {
    return err("reject_phrase", "Say 'Yes, approve' or 'Cancel'");
  }
  const phrase = matchConfirmPhrase(args.text);
  if (phrase === "ambiguous") return err("ambiguous_phrase");
  if (phrase === "reject") return err("reject_phrase", "Say 'Yes, approve' or 'Cancel'");

  const current = store.getCurrent();
  if (!current || current.status !== "prepared") {
    return err("no_pending");
  }

  if (phrase === "cancel") {
    return store.cancel(current.pendingId, args.actorId);
  }

  return claimPendingConfirmation(store, {
    pendingId: current.pendingId,
    actorId: args.actorId,
    channel: "voice",
    sessionUnlocked: args.sessionUnlocked,
  });
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
