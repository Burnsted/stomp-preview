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

/**
 * Extra natural phrases riders actually say, mapped onto canonical batch1
 * phrases. Applied only when the router doesn't already understand the text,
 * so batch1 behaviour (incl. confirmations for end / undo / close) is unchanged.
 */
export const PHRASE_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  "start": "start session", "lets go": "start session", "lets ride": "start session", "lets drop in": "start session", "dropping in": "start session", "begin session": "start session",
  "undo": "undo that", "undo last": "undo that", "oops": "undo that", "delete last trick": "undo that",
  "pause": "pause session", "hold up": "pause session", "break time": "pause session",
  "resume": "resume session", "unpause": "resume session", "keep going": "resume session", "lets keep going": "resume session",
  "im done": "end session", "done": "end session", "end": "end session", "stop session": "end session", "done for today": "end session", "call it": "end session",
  "save this spot": "mark stash", "stash this": "mark stash", "pin this": "mark stash", "save spot": "mark stash",
  "show stashes": "list stashes", "my stashes": "list stashes",
  "light the campfire": "open campfire", "campfire": "open campfire", "start campfire": "open campfire",
  "put out the campfire": "close campfire", "end campfire": "close campfire",
  "react": "send fire", "react fire": "send fire", "fire": "send fire", "campfire react": "send fire",
  "whos on hill": "crew status", "whos on the hill": "crew status", "where is my crew": "crew status", "wheres my crew": "crew status", "wheres the crew": "crew status",
  "what next": "whats next", "next": "next hit", "next feature": "next hit",
  "commands": "help", "what can i say": "help",
});
export const MAX_UTTERANCE = 120;
const norm = (t: string) => t.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
/** Resolve an alias (also after an optional "hey session" prefix). Returns null if none. */
export function resolveAlias(text: string): string | null {
  const n = norm(text);
  const m = /^(hey session )(.*)$/.exec(n);
  const body = m ? m[2]! : n;
  const a = PHRASE_ALIASES[body];
  return a ? (m ? m[1] + a : a) : null;
}

export interface TypedResult { state: RouterState; outcome: RouteOutcome; action: GbAction | null; reply: string }
/** Route one typed utterance. `requireWake` defaults to false because wake listening is off. */
export function routeTyped(state: RouterState, text: string, requireWake = false): TypedResult {
  const clipped = String(text ?? "").slice(0, MAX_UTTERANCE);
  let next: RouterState, outcome: RouteOutcome;
  try {
    [next, outcome] = routeUtterance(state, clipped, { requireWake });
    if (outcome.kind === "unknown") { const alias = resolveAlias(clipped); if (alias) [next, outcome] = routeUtterance(state, alias, { requireWake }); }
  } catch {
    return { state: { pending: null }, outcome: { kind: "ignored", reason: "empty" } as RouteOutcome, action: null, reply: "Session hit a snag — try again." };
  }
  switch (outcome.kind) {
    case "execute": return { state: next, outcome, action: actionForIntent(outcome.command.intent), reply: outcome.command.summary };
    case "needs_confirmation": return { state: next, outcome, action: null, reply: outcome.prompt };
    case "cancelled": return { state: next, outcome, action: null, reply: "Cancelled." };
    case "nothing_pending": return { state: next, outcome, action: null, reply: "Nothing to confirm." };
    case "unknown": return { state: next, outcome, action: null, reply: `Didn't catch "${outcome.normalized}". Say help.` };
    default: return { state: next, outcome, action: null, reply: outcome.reason === "no_wake" ? "Say hey session first." : "Say something." };
  }
}
