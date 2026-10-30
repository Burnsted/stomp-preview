/**
 * SESSION voice — centralized command router (Full-cycle B). TEXT PATH ONLY.
 * Input is a transcript the caller already has (typed / push-to-talk).
 * - NO background wake-word listening.
 * - NO Cardo/Sena/Aleck compatibility claims (untested hardware).
 * - "Sesh" wake is optional and DISABLED by default.
 */
import { basicNormalizeUtterance } from "./voice-normalize.js";

export type VoiceDomain = "trick" | "session" | "music" | "stash" | "crew" | "campfire" | "system";
export type VoiceIntent =
  | "trick.log_stomped" | "trick.log_washed" | "trick.undo_last"
  | "session.start" | "session.end" | "session.pause" | "session.resume" | "session.next_hit"
  | "music.play" | "music.pause" | "music.skip" | "music.duck"
  | "stash.mark" | "stash.list"
  | "crew.status" | "crew.ping_regroup"
  | "campfire.open" | "campfire.close" | "campfire.react"
  | "system.help" | "system.confirm" | "system.cancel";

export interface VoiceCommandDef { intent: VoiceIntent; domain: VoiceDomain; phrases: readonly string[]; requiresConfirmation: boolean; summary: string }
const d = (intent: VoiceIntent, phrases: string[], summary: string, requiresConfirmation = false): VoiceCommandDef => ({ intent, domain: intent.split(".")[0] as VoiceDomain, phrases, requiresConfirmation, summary });

export const VOICE_COMMANDS: readonly VoiceCommandDef[] = [
  d("trick.log_stomped", ["stomped it", "log trick", "log that trick", "landed it", "i stomped it", "log it", "nailed it"], "Log last trick as stomped"),
  d("trick.log_washed", ["washed out", "i washed out", "bailed", "i fell", "log a bail"], "Log last trick as washed out"),
  d("trick.undo_last", ["undo last trick", "undo that", "scratch that"], "Remove last trick entry", true),
  d("session.start", ["start session", "start park session", "start a session", "drop in", "lets ride"], "Start local park session"),
  d("session.end", ["end session", "end park session", "stop the session", "were done", "wrap it up"], "End park session", true),
  d("session.pause", ["pause session", "take a break", "hold up"], "Pause park session"),
  d("session.resume", ["resume session", "back at it", "keep going"], "Resume park session"),
  d("session.next_hit", ["whats next", "next hit", "next feature", "whats the next hit"], "Read next planned hit"),
  d("music.play", ["play music", "play the music", "hit play"], "Local playback stub: play"),
  d("music.pause", ["pause music", "pause the music", "stop music", "kill the music"], "Local playback stub: pause"),
  d("music.skip", ["skip song", "next song", "skip track"], "Local playback stub: skip"),
  d("music.duck", ["duck music", "turn it down", "quieter"], "Local playback stub: duck"),
  d("stash.mark", ["mark stash", "drop a pin", "drop a stash pin", "mark the stash", "pin this spot"], "Local stash marker (no public location)"),
  d("stash.list", ["list stashes", "where are my stashes", "show stashes"], "List local stash markers"),
  d("crew.status", ["crew status", "whos on the hill", "whos here", "where is the crew"], "Local crew membership status (no live tracking)"),
  d("crew.ping_regroup", ["regroup", "call the crew", "crew regroup"], "Queue a LOCAL regroup note (no send)", true),
  d("campfire.open", ["open campfire", "start campfire", "campfire time"], "Open local Campfire session"),
  d("campfire.close", ["close campfire", "end campfire"], "Close local Campfire", true),
  d("campfire.react", ["fire emoji", "send fire", "thats fire"], "Local Campfire reaction"),
  d("system.help", ["help", "what can you do", "commands"], "List commands"),
  d("system.confirm", ["yes", "confirm", "do it", "yep", "yeah"], "Confirm pending command"),
  d("system.cancel", ["no", "cancel", "never mind", "nope", "nevermind"], "Cancel pending command"),
];

export interface WakeConfig { heySession: true; yoSession: true; seshEnabled: boolean }
export const DEFAULT_WAKE_CONFIG: Readonly<WakeConfig> = Object.freeze({ heySession: true, yoSession: true, seshEnabled: false });
export const VOICE_GUARDS = { backgroundWakeWord: false, hardwareCompatVerified: false, textPathOnly: true } as const;

export function detectWake(normalized: string, cfg: WakeConfig = DEFAULT_WAKE_CONFIG): { wake: "hey_session" | "yo_session" | "sesh" | null; rest: string } {
  const opts: [string, "hey_session" | "yo_session" | "sesh", boolean][] = [["hey session", "hey_session", true], ["yo session", "yo_session", true], ["sesh", "sesh", cfg.seshEnabled]];
  for (const [p, id, on] of opts) if (on && (normalized === p || normalized.startsWith(p + " "))) return { wake: id, rest: normalized.slice(p.length).trim() };
  return { wake: null, rest: normalized };
}
const FILLERS = ["can you please", "could you please", "can you", "could you", "please", "ok", "okay", "go ahead and", "i want to", "yo"];
const TRAIL = ["please", "now", "for me", "thanks", "thank you"];
export function stripFillers(s: string): string {
  let changed = true;
  while (changed) { changed = false;
    for (const f of FILLERS) if (s.startsWith(f + " ")) { s = s.slice(f.length + 1).trim(); changed = true; }
    for (const f of TRAIL) if (s.endsWith(" " + f)) { s = s.slice(0, -f.length - 1).trim(); changed = true; } }
  return s;
}
export function matchIntent(phrase: string): VoiceCommandDef | undefined {
  return VOICE_COMMANDS.find((c) => c.phrases.some((p) => basicNormalizeUtterance(p) === phrase));
}

export type RouterState = { pending: VoiceCommandDef | null };
export type RouteOutcome =
  | { kind: "ignored"; reason: "no_wake" | "empty" }
  | { kind: "unknown"; normalized: string }
  | { kind: "needs_confirmation"; command: VoiceCommandDef; prompt: string }
  | { kind: "execute"; command: VoiceCommandDef }
  | { kind: "cancelled"; command: VoiceCommandDef | null }
  | { kind: "nothing_pending" };

export interface RouteOptions { requireWake?: boolean; wake?: WakeConfig }
/** Pure router: (state, utterance) -> [state, outcome]. */
export function routeUtterance(state: RouterState, utterance: string, opt: RouteOptions = {}): [RouterState, RouteOutcome] {
  const n = basicNormalizeUtterance(utterance);
  if (!n) return [state, { kind: "ignored", reason: "empty" }];
  const { wake, rest } = detectWake(n, opt.wake ?? DEFAULT_WAKE_CONFIG);
  if (opt.requireWake && !wake && !state.pending) return [state, { kind: "ignored", reason: "no_wake" }];
  const body = stripFillers(rest);
  if (!body) return [state, { kind: "ignored", reason: "empty" }];
  const cmd = matchIntent(body);
  if (!cmd) return [state, { kind: "unknown", normalized: body }];
  if (cmd.intent === "system.confirm") {
    if (!state.pending) return [state, { kind: "nothing_pending" }];
    return [{ pending: null }, { kind: "execute", command: state.pending }];
  }
  if (cmd.intent === "system.cancel") return [{ pending: null }, { kind: "cancelled", command: state.pending }];
  if (cmd.requiresConfirmation) return [{ pending: cmd }, { kind: "needs_confirmation", command: cmd, prompt: `Confirm: ${cmd.summary}? Say yes or cancel.` }];
  return [{ pending: null }, { kind: "execute", command: cmd }];
}
export const helpText = () => VOICE_COMMANDS.filter((c) => c.domain !== "system").map((c) => `${c.phrases[0]} — ${c.summary}`);

// ---- Device-independent audio abstraction ----
export type AudioRoute = "phone_speaker" | "wired" | "bluetooth_generic";
export interface AudioInputPort { readonly available: boolean; readonly route: AudioRoute | null; startPushToTalk(): Promise<string> }
export interface AudioOutputPort { speak(text: string): void; readonly spoken: readonly string[] }
export function createMockInput(transcripts: string[], available = true, route: AudioRoute = "phone_speaker"): AudioInputPort {
  const q = [...transcripts];
  return { available, route: available ? route : null, startPushToTalk: () => (available ? Promise.resolve(q.shift() ?? "") : Promise.reject(new Error("mic_unavailable"))) };
}
export function createMockOutput(): AudioOutputPort { const spoken: string[] = []; return { spoken, speak: (t) => void spoken.push(t) }; }
export type InputMode = "push_to_talk" | "text_fallback";
/** Mic-unavailable fallback: choose text input when no mic. */
export function chooseInputMode(input: AudioInputPort | null): InputMode { return input && input.available ? "push_to_talk" : "text_fallback"; }
export async function captureUtterance(input: AudioInputPort | null, typedFallback: () => string): Promise<{ mode: InputMode; text: string }> {
  const mode = chooseInputMode(input);
  if (mode === "text_fallback") return { mode, text: typedFallback() };
  try { return { mode, text: await input!.startPushToTalk() }; } catch { return { mode: "text_fallback", text: typedFallback() }; }
}
