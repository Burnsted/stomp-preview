/**
 * Woz bridge — local-only export/import of Crew Tools demo state (no cloud, no network).
 * The dump is a plain JSON string the rider can copy/paste on the same or another phone.
 * Only Woz namespace keys on an allowlist are accepted; GB's `stomp-line` (incl. the
 * Invite crew list owned by greet.tsx) is never read or written here.
 */
import type { LocalJsonStore } from "./persistence";

export const DUMP_FORMAT = "stomp-woz-dump" as const;
export const DUMP_VERSION = 1;
export const DUMP_MAX_BYTES = 256 * 1024;
export const CLEAR_CONFIRM_WORD = "CLEAR";
/** Keys Woz is allowed to persist / import (exact match). */
export const DUMP_KEYS = ["ui.tab", "crew.inviteLog", "crew.baseline", "crew.unlinked", "crew.privacy", "smartid.tags", "smartid.creds", "campfire.media", "ride.current", "ride.runs"] as const;
const allowed = (k: string) => (DUMP_KEYS as readonly string[]).includes(k);

export interface WozDump { format: typeof DUMP_FORMAT; version: number; exportedAtIso: string; entries: Record<string, unknown> }
export type ImportResult = { ok: true; imported: number; skipped: string[] } | { ok: false; error: "too_large" | "bad_json" | "bad_format" | "bad_version" | "empty" };

export function exportDump(store: LocalJsonStore, nowIso: string): string {
  const entries = JSON.parse(store.exportAll()) as Record<string, unknown>;
  for (const k of Object.keys(entries)) if (!allowed(k)) delete entries[k];
  const d: WozDump = { format: DUMP_FORMAT, version: DUMP_VERSION, exportedAtIso: nowIso, entries };
  return JSON.stringify(d);
}

/** Validates then replaces Woz keys. Existing Woz data is only cleared after validation passes. */
export function importDump(store: LocalJsonStore, text: string): ImportResult {
  const raw = text.trim();
  if (!raw) return { ok: false, error: "empty" };
  if (new TextEncoder().encode(raw).length > DUMP_MAX_BYTES) return { ok: false, error: "too_large" };
  let d: unknown; try { d = JSON.parse(raw); } catch { return { ok: false, error: "bad_json" }; }
  if (!d || typeof d !== "object" || (d as WozDump).format !== DUMP_FORMAT || !(d as WozDump).entries || typeof (d as WozDump).entries !== "object" || Array.isArray((d as WozDump).entries)) return { ok: false, error: "bad_format" };
  if ((d as WozDump).version !== DUMP_VERSION) return { ok: false, error: "bad_version" };
  const good: Record<string, unknown> = {}; const skipped: string[] = [];
  for (const [k, env] of Object.entries((d as WozDump).entries)) {
    if (allowed(k) && env && typeof env === "object" && (env as { v?: unknown }).v === 1 && "data" in (env as object)) good[k] = env; else skipped.push(k);
  }
  for (const k of store.listKeys()) store.remove(k);
  const imported = store.importAll(JSON.stringify(good));
  return { ok: true, imported, skipped };
}

export const IMPORT_MSG: Record<Exclude<ImportResult, { ok: true }>["error"], string> = {
  empty: "Paste a Crew Tools export first.",
  too_large: "That export is too big for this demo (256 KB max).",
  bad_json: "That doesn't look like a Crew Tools export.",
  bad_format: "That doesn't look like a Crew Tools export.",
  bad_version: "That export is from a different Crew Tools version.",
};
