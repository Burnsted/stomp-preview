/** Woz bridge — JSON persistence via batch1 LocalJsonStore over localStorage (memory on SSR). */
import { LocalJsonStore, createMemoryBackend, type KeyValueBackend } from "@woz/core/json-store.js";
export { LocalJsonStore, createMemoryBackend };
export type { KeyValueBackend };
export const WOZ_NS = "stomp-woz";

/** Storage-health listeners (quota / private mode). Woz UI shows a non-blocking banner. */
const errorListeners = new Set<(op: "set" | "delete", err: unknown) => void>();
export function onStorageError(fn: (op: "set" | "delete", err: unknown) => void): () => void { errorListeners.add(fn); return () => void errorListeners.delete(fn); }
const reportStorageError = (op: "set" | "delete", err: unknown) => { for (const fn of errorListeners) fn(op, err); };

export function localStorageBackend(ls: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): KeyValueBackend {
  if (!ls) return createMemoryBackend();
  return {
    get: (k) => ls.getItem(k) ?? undefined,
    set: (k, v) => { try { ls.setItem(k, v); } catch (e) { reportStorageError("set", e); /* keep in-memory state only */ } },
    delete: (k) => { try { ls.removeItem(k); } catch (e) { reportStorageError("delete", e); } },
    keys: () => Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => !!k),
  };
}
export const createWozStore = (b: KeyValueBackend = localStorageBackend()) => new LocalJsonStore(b, WOZ_NS);
