/**
 * SESSION command parser (Batch 3) — text-in only.
 * Parses an utterance string the caller ALREADY has (e.g. typed or push-to-talk
 * transcript). Does NOT enable microphones or background listening.
 */
import {
  SESSION_ARCHITECTURE_GUARDS,
  SESSION_COMMANDS,
  type SessionCommandId,
} from "./command-registry.js";

export interface ParsedSessionCommand {
  commandId: SessionCommandId | null;
  normalized: string;
  matchedPhrase?: string;
}

/** Optional wake prefixes stripped before matching (longest first). */
export const WAKE_PREFIXES = ["hey session", "yo session", "session", "sesh"] as const;

/** Polite fillers stripped from the start of an utterance (repeatable). */
const LEADING_FILLERS = [
  "can you please",
  "could you please",
  "can you",
  "could you",
  "would you",
  "please",
  "ok",
  "okay",
  "go ahead and",
  "lets",
  "let's",
  "i want to",
  "i wanna",
];
const TRAILING_FILLERS = ["please", "now", "for me", "thanks", "thank you"];

/** Natural variants beyond registry phrases. Keys are normalized forms. */
export const NATURAL_VARIANTS: Readonly<Record<string, SessionCommandId>> = {
  "log that trick": "log_trick",
  "log that": "log_trick",
  "log it": "log_trick",
  "log the trick": "log_trick",
  "i stomped it": "log_trick",
  "stomped that": "log_trick",
  "i washed out": "log_trick",
  "start a park session": "start_park_session",
  "start the park session": "start_park_session",
  "start a session": "start_park_session",
  "begin park session": "start_park_session",
  "end the park session": "end_park_session",
  "end the session": "end_park_session",
  "stop park session": "end_park_session",
  "stop the session": "end_park_session",
  "were done": "end_park_session",
  "drop a pin": "mark_stash",
  "mark the stash": "mark_stash",
  "whats next": "next_hit",
  "whats the next hit": "next_hit",
  "next feature": "next_hit",
  "pause the music": "play_pause_sample",
  "play the music": "play_pause_sample",
  "whos on the hill": "crew_status",
  "whos on hill": "crew_status",
  "where is the crew": "crew_status",
  "crew check": "crew_status",
  "what can i say": "help",
  "commands": "help",
};

function basicNormalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPrefixes(s: string, list: readonly string[]): string {
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of [...list].sort((a, b) => b.length - a.length)) {
      const np = basicNormalize(p);
      if (s === np) return "";
      if (s.startsWith(np + " ")) {
        s = s.slice(np.length + 1);
        changed = true;
      }
    }
  }
  return s;
}

function stripSuffixes(s: string, list: readonly string[]): string {
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of list) {
      const np = basicNormalize(p);
      if (s.endsWith(" " + np)) {
        s = s.slice(0, -(np.length + 1));
        changed = true;
      }
    }
  }
  return s;
}

/** trim, lowercase, collapse whitespace, strip punctuation, wake prefix + fillers. */
export function normalizeForParse(utterance: string): string {
  let s = basicNormalize(utterance);
  s = stripPrefixes(s, WAKE_PREFIXES);
  s = stripPrefixes(s, LEADING_FILLERS);
  s = stripSuffixes(s, TRAILING_FILLERS);
  return s;
}

export function parseSessionCommand(utterance: string): ParsedSessionCommand {
  if (SESSION_ARCHITECTURE_GUARDS.backgroundListening !== false) {
    throw new Error("Background listening must stay disabled.");
  }
  const normalized = normalizeForParse(utterance);
  if (!normalized) return { commandId: null, normalized };
  for (const cmd of SESSION_COMMANDS) {
    for (const p of cmd.phrases) {
      if (basicNormalize(p) === normalized) {
        return { commandId: cmd.id, normalized, matchedPhrase: p };
      }
    }
  }
  const variant = NATURAL_VARIANTS[normalized];
  if (variant) return { commandId: variant, normalized, matchedPhrase: normalized };
  return { commandId: null, normalized };
}
