/**
 * Family playtest feedback — local only. Copy / share summary.
 * No database. No personal-info collection.
 */

import {
  createSafeJSONStorage,
  safeGetItem,
  safeParseJson,
  safeRemoveItem,
  safeSetItem,
} from "@/lib/stomp/playtest/safe-storage";

export const FEEDBACK_STORAGE_KEY = "stomp.playtest.feedback";

export const FEEDBACK_KINDS = ["liked", "confused", "crashed", "wishlist"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export type FeedbackEntry = {
  id: string;
  kind: FeedbackKind;
  note: string;
  atIso: string;
  screen?: string;
};

export type FeedbackState = {
  entries: FeedbackEntry[];
};

const EMPTY: FeedbackState = { entries: [] };

export function readFeedback(): FeedbackState {
  const raw = safeGetItem(FEEDBACK_STORAGE_KEY);
  const parsed = safeParseJson<FeedbackState>(raw, EMPTY);
  if (!Array.isArray(parsed.entries)) return EMPTY;
  return {
    entries: parsed.entries
      .filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          FEEDBACK_KINDS.includes(e.kind) &&
          typeof e.note === "string",
      )
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        note: String(e.note).slice(0, 280),
        atIso: typeof e.atIso === "string" ? e.atIso : new Date().toISOString(),
        screen: typeof e.screen === "string" ? e.screen.slice(0, 40) : undefined,
      }))
      .slice(0, 40),
  };
}

export function writeFeedback(state: FeedbackState): void {
  safeSetItem(FEEDBACK_STORAGE_KEY, JSON.stringify({ entries: state.entries.slice(0, 40) }));
}

export function addFeedback(input: {
  kind: FeedbackKind;
  note: string;
  screen?: string;
}): FeedbackEntry {
  const entry: FeedbackEntry = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    note: input.note.trim().slice(0, 280),
    atIso: new Date().toISOString(),
    screen: input.screen?.slice(0, 40),
  };
  // Strip accidental PII-ish patterns (emails / phone-shaped) from notes
  entry.note = entry.note
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[redacted]");
  const next = readFeedback();
  next.entries = [entry, ...next.entries].slice(0, 40);
  writeFeedback(next);
  return entry;
}

export function clearFeedback(): void {
  safeRemoveItem(FEEDBACK_STORAGE_KEY);
}

export function formatFeedbackSummary(state: FeedbackState = readFeedback()): string {
  const lines = [
    "STOMP family playtest feedback (local only)",
    `Entries: ${state.entries.length}`,
    "No personal info intended. Simulated preview.",
    "",
  ];
  for (const e of state.entries) {
    lines.push(`- [${e.kind}] ${e.note || "(no note)"} · ${e.atIso}${e.screen ? ` · ${e.screen}` : ""}`);
  }
  if (!state.entries.length) lines.push("(none yet)");
  return lines.join("\n");
}

export async function copyFeedbackSummary(): Promise<{ ok: boolean; text: string }> {
  const text = formatFeedbackSummary();
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true, text };
    }
  } catch {
    /* fall through */
  }
  return { ok: false, text };
}

export async function shareFeedbackSummary(): Promise<{ ok: boolean; method: "share" | "copy" | "none"; text: string }> {
  const text = formatFeedbackSummary();
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: "STOMP playtest feedback", text });
      return { ok: true, method: "share", text };
    }
  } catch {
    /* user cancel or unsupported */
  }
  const copied = await copyFeedbackSummary();
  return { ok: copied.ok, method: copied.ok ? "copy" : "none", text };
}

export { createSafeJSONStorage };
