/**
 * Woz bridge — JSON persistence via batch1 LocalJsonStore over localStorage (memory on SSR).
 * Hardened for refresh + private mode: every Storage call is guarded (Safari private /
 * disabled storage can throw on access, get, set or key enumeration), and a write-through
 * in-memory overlay keeps state readable for the rest of the session when writes fail.
 */
import { LocalJsonStore, createMemoryBackend, type KeyValueBackend } from "@woz/core/json-store.js";
export { LocalJsonStore, createMemoryBackend };
export type { KeyValueBackend };
export const WOZ_NS = "stomp-woz";

export type StorageOp = "set" | "delete" | "get" | "open";
/** Storage-health listeners (quota / private mode). Woz UI shows a non-blocking banner. */
const errorListeners = new Set<(op: StorageOp, err: unknown) => void>();
export function onStorageError(fn: (op: StorageOp, err: unknown) => void): () => void { errorListeners.add(fn); return () => void errorListeners.delete(fn); }
const reportStorageError = (op: StorageOp, err: unknown) => { for (const fn of errorListeners) fn(op, err); };

/** Safely resolve window.localStorage; `undefined` if absent or access throws (private mode / blocked). */
export function safeLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try { const ls = window.localStorage; const probe = "__stomp_woz_probe__"; ls.setItem(probe, "1"); ls.removeItem(probe); return ls; }
  catch (e) { reportStorageError("open", e); return undefined; }
}

export function localStorageBackend(ls: Storage | undefined = safeLocalStorage()): KeyValueBackend {
  if (!ls) return createMemoryBackend();
  // Overlay: value written this session (string) or tombstone (null). Survives failed writes.
  const overlay = new Map<string, string | null>();
  const lsKeys = (): string[] => { try { return Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => !!k); } catch (e) { reportStorageError("get", e); return []; } };
  return {
    get: (k) => {
      if (overlay.has(k)) return overlay.get(k) ?? undefined;
      try { return ls.getItem(k) ?? undefined; } catch (e) { reportStorageError("get", e); return undefined; }
    },
    set: (k, v) => { overlay.set(k, v); try { ls.setItem(k, v); overlay.delete(k); } catch (e) { reportStorageError("set", e); /* keep in-memory state only */ } },
    delete: (k) => { overlay.set(k, null); try { ls.removeItem(k); overlay.delete(k); } catch (e) { reportStorageError("delete", e); } },
    keys: () => {
      const s = new Set(lsKeys());
      for (const [k, v] of overlay) { if (v === null) s.delete(k); else s.add(k); }
      return [...s];
    },
  };
}
export const createWozStore = (b: KeyValueBackend = localStorageBackend()) => new LocalJsonStore(b, WOZ_NS);
