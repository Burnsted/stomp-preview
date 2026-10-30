/**
 * Woz bridge — Session voice (TEXT PATH ONLY). Wake listening is OFF by default,
 * no background wake, no headset/intercom integrations. Typed commands are routed
 * through batch1's tested router and mapped to GB store actions by the caller.
 */
import { routeUtterance, helpText, VOICE_GUARDS, DEFAULT_WAKE_CONFIG, type RouterState, type RouteOutcome, type VoiceIntent } from "@woz/session/voice-router.js";
import { parseSessionCommand } from "@woz/session/command-parser.js";

export const SESSION_BRIDGE_FLAGS = Object.freeze({ wakeListening: false, backgroundWake: false, headsetIntegrations: false, textPathOnly: true });
export { helpText, VOICE_GUARDS, DEFAULT_WAKE_CONFIG, parseSessionCommand };
export type { RouterState, RouteOutcome, VoiceIntent };

export type GbAction =
  | { kind: "startRun" } | { kind: "endRun" } | { kind: "logTrick"; outcome: "stomped" | "washed_out" } | { kind: "undoTrick" }
  | { kind: "pauseRide" } | { kind: "resumeRide" } | { kind: "nextHit" } | { kind: "markStash" } | { kind: "listStashes" }
  | { kind: "screen"; screen: "playlist" | "stompers" | "map" } | { kind: "campfire"; op: "open" | "close" | "react" }
  | { kind: "say"; text: string };

const MAP: Partial<Record<VoiceIntent, GbAction>> = {
  "session.start": { kind: "startRun" }, "session.end": { kind: "endRun" },
  "session.pause": { kind: "pauseRide" }, "session.resume": { kind: "resumeRide" }, "session.next_hit": { kind: "nextHit" },
  "trick.log_stomped": { kind: "logTrick", outcome: "stomped" }, "trick.log_washed": { kind: "logTrick", outcome: "washed_out" },
  "trick.undo_last": { kind: "undoTrick" }, "stash.mark": { kind: "markStash" }, "stash.list": { kind: "listStashes" },
  "music.play": { kind: "screen", screen: "playlist" }, "music.pause": { kind: "say", text: "Music control is a local demo stub." },
  "music.skip": { kind: "say", text: "Music control is a local demo stub." }, "music.duck": { kind: "say", text: "Music control is a local demo stub." },
  "crew.status": { kind: "screen", screen: "stompers" }, "crew.ping_regroup": { kind: "say", text: "Regroup note saved locally. Nothing was sent." },
  "campfire.open": { kind: "campfire", op: "open" }, "campfire.close": { kind: "campfire", op: "close" }, "campfire.react": { kind: "campfire", op: "react" },
  "system.help": { kind: "say", text: "Try: start session, stomped it, mark stash, open campfire." },
};
export function actionForIntent(i: VoiceIntent): GbAction | null { return MAP[i] ?? null; }

export interface TypedResult { state: RouterState; outcome: RouteOutcome; action: GbAction | null; reply: string }
/** Route one typed utterance. `requireWake` defaults to false because wake listening is off. */
export function routeTyped(state: RouterState, text: string, requireWake = false): TypedResult {
  const [next, outcome] = routeUtterance(state, text, { requireWake });
  switch (outcome.kind) {
    case "execute": return { state: next, outcome, action: actionForIntent(outcome.command.intent), reply: outcome.command.summary };
    case "needs_confirmation": return { state: next, outcome, action: null, reply: outcome.prompt };
    case "cancelled": return { state: next, outcome, action: null, reply: "Cancelled." };
    case "nothing_pending": return { state: next, outcome, action: null, reply: "Nothing to confirm." };
    case "unknown": return { state: next, outcome, action: null, reply: `Didn't catch "${outcome.normalized}". Say help.` };
    default: return { state: next, outcome, action: null, reply: outcome.reason === "no_wake" ? "Say hey session first." : "Say something." };
  }
}
