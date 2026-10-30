/**
 * SESSION voice command registry — device-independent prep.
 *
 * Intended same command set for: phone audio / Cardo / Sena / Aleck / BT headsets.
 * This file is registry + docs companion only:
 * - NO unrestricted background listening
 * - NO proprietary radio integrations (Cardo/Sena/Aleck SDKs)
 * - NO unverified device-compatibility claims
 *
 * Naming note (Master HQ): "Session" also names Terrain Park Session, TourSession,
 * PhotoSessionStore, AudioDuckingSession — labels to resolve later; wake = SESSION voice.
 */

export type SessionCommandId =
  | "log_trick"
  | "start_park_session"
  | "end_park_session"
  | "mark_stash"
  | "next_hit"
  | "play_pause_sample"
  | "crew_status"
  | "help";

export type SessionTransportHint =
  | "phone_audio"
  | "bt_headset"
  | "cardo"
  | "sena"
  | "aleck";

export interface SessionCommand {
  id: SessionCommandId;
  /** Example phrases; matching is exact-normalized for prep tests only. */
  phrases: readonly string[];
  summary: string;
  /** All transports share the same command set; hints are documentation only. */
  transportHints: readonly SessionTransportHint[];
  requiresConfirmation?: boolean;
}

export const SESSION_COMMANDS: readonly SessionCommand[] = [
  {
    id: "log_trick",
    phrases: ["log trick", "stomped it", "washed out"],
    summary: "Append a local trick log entry (no AI coaching).",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
  {
    id: "start_park_session",
    phrases: ["start park session", "start session"],
    summary: "Start a local park session timer/log context.",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
  {
    id: "end_park_session",
    phrases: ["end park session", "end session"],
    summary: "End the active local park session.",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
    requiresConfirmation: true,
  },
  {
    id: "mark_stash",
    phrases: ["mark stash", "drop a stash pin"],
    summary: "Mark a local stash pin (no public location sharing).",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
  {
    id: "next_hit",
    phrases: ["what's next", "next hit"],
    summary: "Read next planned hit from local run plan (when present).",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
  {
    id: "play_pause_sample",
    phrases: ["pause music", "play music", "duck music"],
    summary: "Local sample playback control stub (no cloud catalog).",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
  {
    id: "crew_status",
    phrases: ["crew status", "who's on hill"],
    summary: "Local crew membership status only — no live tracking.",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
  {
    id: "help",
    phrases: ["help", "what can you do"],
    summary: "List registered SESSION commands.",
    transportHints: ["phone_audio", "bt_headset", "cardo", "sena", "aleck"],
  },
] as const;

export function normalizeCommandUtterance(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveSessionCommand(
  utterance: string,
): SessionCommand | undefined {
  const n = normalizeCommandUtterance(utterance);
  return SESSION_COMMANDS.find((cmd) =>
    cmd.phrases.some((p) => normalizeCommandUtterance(p) === n),
  );
}

export function listCommandsForTransport(
  hint: SessionTransportHint,
): SessionCommand[] {
  // Same command set for every transport — intentional; no per-device forks yet.
  return SESSION_COMMANDS.filter((c) => c.transportHints.includes(hint));
}

export const SESSION_ARCHITECTURE_GUARDS = {
  backgroundListening: false,
  proprietaryRadioIntegrations: false,
  deviceCompatClaimsWithoutTests: false,
  sameCommandSetAcrossTransports: true,
} as const;
