/**
 * t1238u — Sesh voice intents for Spot / Stash (via existing Sesh FAB).
 * Guarded SpeechRecognition prototype — OFF unless rider taps/holds FAB.
 * Sharing and deletion require explicit confirmation. Ambiguity asks to clarify.
 * Distinguish saved locally vs queued vs shared — no false success.
 */
import type { PinSaveState, PinVisibility } from "./types.js";

export type SpotVoiceIntent =
  | { kind: "stash_this_spot" }
  | { kind: "spot_this" }
  | { kind: "name_it"; name: string }
  | { kind: "share_with_crew"; crewName: string }
  | { kind: "show_stashes" }
  | { kind: "add_this_clip" }
  | { kind: "make_private" }
  | { kind: "confirm_share" }
  | { kind: "confirm_cancel" }
  | { kind: "ambiguous"; options: string[]; prompt: string }
  | { kind: "unknown"; text: string };

export type VoiceParseResult = {
  intent: SpotVoiceIntent;
  /** One-shot location capture requested by this intent (still explicit pin path). */
  needsLocationCapture: boolean;
  /** Must confirm before mutating share/delete. */
  requiresExplicitConfirm: boolean;
};

export type VoiceUiState =
  | "idle"
  | "listening"
  | "parsed"
  | "confirm_share"
  | "typed_fallback"
  | "speech_unavailable";

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WAKE = /^(?:hey|yo)\s+(?:sesh|session)\b[,.]?\s*/i;
const SESH = /^sesh\b[,.]?\s*/i;

export function stripWake(raw: string): string {
  let t = raw.trim().replace(/\s+/g, " ");
  t = t.replace(WAKE, "").trim();
  t = t.replace(SESH, "").trim();
  return t;
}

export function parseSpotVoice(raw: string): VoiceParseResult {
  const stripped = stripWake(raw);
  const n = normalize(stripped);

  if (!n) {
    return {
      intent: { kind: "unknown", text: raw },
      needsLocationCapture: false,
      requiresExplicitConfirm: false,
    };
  }

  // Confirm / cancel (share + delete gates)
  if (
    n === "yes" ||
    n === "yes share" ||
    n === "confirm" ||
    n === "yes confirm" ||
    n === "share it" ||
    n === "sesh approve it"
  ) {
    return {
      intent: { kind: "confirm_share" },
      needsLocationCapture: false,
      requiresExplicitConfirm: false,
    };
  }
  if (n === "cancel" || n === "no" || n === "no cancel" || n === "don't share") {
    return {
      intent: { kind: "confirm_cancel" },
      needsLocationCapture: false,
      requiresExplicitConfirm: false,
    };
  }

  // Ambiguity: "stash this" alone could mean Spot→Stash convert OR save stash
  if (n === "stash this" || n === "stash it") {
    return {
      intent: {
        kind: "ambiguous",
        options: ["stash_this_spot", "spot_this"],
        prompt: "Did you mean make a private Stash, or drop a public Spot?",
      },
      needsLocationCapture: false,
      requiresExplicitConfirm: true,
    };
  }

  if (
    n.includes("stash this spot") ||
    n === "make a stash" ||
    n.includes("save a stash")
  ) {
    return {
      intent: { kind: "stash_this_spot" },
      needsLocationCapture: true,
      requiresExplicitConfirm: false,
    };
  }

  if (
    n === "spot this" ||
    n.includes("spot this") ||
    n === "drop a spot" ||
    n.includes("make a spot")
  ) {
    return {
      intent: { kind: "spot_this" },
      needsLocationCapture: true,
      requiresExplicitConfirm: false,
    };
  }

  const nameMatch =
    n.match(/^name it (.+)$/) ||
    n.match(/^call it (.+)$/) ||
    n.match(/^name that (.+)$/);
  if (nameMatch) {
    const name = nameMatch[1]!.replace(/\bplease\b/g, "").trim();
    // Title-case lightly for display
    const display = name.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      intent: { kind: "name_it", name: display },
      needsLocationCapture: false,
      requiresExplicitConfirm: false,
    };
  }

  const shareMatch =
    n.match(/^share (?:it |this )?(?:with )?(.+)$/) ||
    n.match(/^share (?:to|with) (.+)$/);
  if (shareMatch) {
    const crewName = shareMatch[1]!
      .replace(/\bplease\b/g, "")
      .replace(/\bcrew\b$/i, "Crew")
      .trim();
    return {
      intent: { kind: "share_with_crew", crewName },
      needsLocationCapture: false,
      requiresExplicitConfirm: true,
    };
  }

  if (
    n.includes("show our stashes") ||
    n.includes("show my stashes") ||
    n.includes("show stashes") ||
    n === "our stashes"
  ) {
    return {
      intent: { kind: "show_stashes" },
      needsLocationCapture: false,
      requiresExplicitConfirm: false,
    };
  }

  if (n.includes("add this clip") || n === "add clip" || n.includes("attach this clip")) {
    return {
      intent: { kind: "add_this_clip" },
      needsLocationCapture: false,
      requiresExplicitConfirm: false,
    };
  }

  if (
    n.includes("make that spot private") ||
    n.includes("make this spot private") ||
    n.includes("make it private") ||
    n === "make private"
  ) {
    return {
      intent: { kind: "make_private" },
      needsLocationCapture: false,
      requiresExplicitConfirm: true,
    };
  }

  return {
    intent: { kind: "unknown", text: stripped },
    needsLocationCapture: false,
    requiresExplicitConfirm: false,
  };
}

export type SpotVoiceReply = {
  say: string;
  ui: VoiceUiState;
  /** Honest save-state label — never claim shared when local/queued. */
  saveStateHint?: PinSaveState;
  visibilityHint?: PinVisibility;
  openScreen?: "map" | "stash" | "spot-detail";
  pendingConfirm?: "share" | "make_private" | "delete";
  typedFallback?: boolean;
};

export function replyForIntent(
  parsed: VoiceParseResult,
  ctx?: {
    speechAvailable?: boolean;
    lastSaveState?: PinSaveState;
    pendingShareCrew?: string | null;
  },
): SpotVoiceReply {
  if (ctx?.speechAvailable === false) {
    return {
      say: "Mic unavailable — type the command instead.",
      ui: "typed_fallback",
      typedFallback: true,
    };
  }

  const { intent } = parsed;
  switch (intent.kind) {
    case "ambiguous":
      return { say: intent.prompt, ui: "parsed", pendingConfirm: "share" };
    case "stash_this_spot":
      return {
        say: "Private Stash draft — capturing pin once. Not shared yet.",
        ui: "parsed",
        saveStateHint: "draft_local",
        visibilityHint: "private_stash",
        openScreen: "map",
      };
    case "spot_this":
      return {
        say: "Public Spot draft — capturing pin once. Confirm before publish.",
        ui: "parsed",
        saveStateHint: "draft_local",
        visibilityHint: "public_spot",
        openScreen: "map",
      };
    case "name_it":
      return { say: `Named it ${intent.name}.`, ui: "parsed" };
    case "share_with_crew":
      return {
        say: `Share with ${intent.crewName}? Say yes to confirm — not shared yet.`,
        ui: "confirm_share",
        pendingConfirm: "share",
        saveStateHint: ctx?.lastSaveState ?? "saved_local",
      };
    case "show_stashes":
      return {
        say: "Showing your crew Stashes — private only.",
        ui: "parsed",
        openScreen: "stash",
        visibilityHint: "private_stash",
      };
    case "add_this_clip":
      return {
        say: "Clip attached locally — expires in 7 days. Not uploaded live.",
        ui: "parsed",
        saveStateHint: "saved_local",
      };
    case "make_private":
      return {
        say: "Make that Spot a private Stash? Confirm to continue.",
        ui: "confirm_share",
        pendingConfirm: "make_private",
      };
    case "confirm_share":
      if (!ctx?.pendingShareCrew && ctx?.lastSaveState !== "queued_offline") {
        // Only confirm when there was a pending share — otherwise honest miss
        return {
          say: "Nothing pending to share.",
          ui: "parsed",
          saveStateHint: ctx?.lastSaveState,
        };
      }
      return {
        say:
          ctx?.lastSaveState === "queued_offline"
            ? "Queued offline — will share when back online. Not shared yet."
            : `Shared with ${ctx?.pendingShareCrew ?? "crew"}.`,
        ui: "parsed",
        saveStateHint:
          ctx?.lastSaveState === "queued_offline" ? "queued_offline" : "shared",
      };
    case "confirm_cancel":
      return { say: "Cancelled — still local only.", ui: "parsed", saveStateHint: "saved_local" };
    case "unknown":
    default:
      return { say: "Say again? Try “Sesh, stash this spot.”", ui: "parsed" };
  }
}

/** Honest labels for UI — never show “Shared” for local/queued. */
export function saveStateLabel(state: PinSaveState): string {
  switch (state) {
    case "draft_local":
      return "Draft · on this phone";
    case "saved_local":
      return "Saved locally · not shared";
    case "queued_offline":
      return "Queued offline · not shared yet";
    case "shared":
      return "Shared with selected crew";
  }
}
