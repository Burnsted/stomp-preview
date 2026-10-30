/** Woz bridge — JSON persistence via batch1 LocalJsonStore over localStorage (memory on SSR). */
import { LocalJsonStore, createMemoryBackend, type KeyValueBackend } from "@woz/core/json-store.js";
export { LocalJsonStore, createMemoryBackend };
export type { KeyValueBackend };
export const WOZ_NS = "stomp-woz";

export function localStorageBackend(ls: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage): KeyValueBackend {
  if (!ls) return createMemoryBackend();
  return {
    get: (k) => ls.getItem(k) ?? undefined,
    set: (k, v) => { try { ls.setItem(k, v); } catch { /* quota: keep in-memory state only */ } },
    delete: (k) => ls.removeItem(k),
    keys: () => Array.from({ length: ls.length }, (_, i) => ls.key(i)).filter((k): k is string => !!k),
  };
}
export const createWozStore = (b: KeyValueBackend = localStorageBackend()) => new LocalJsonStore(b, WOZ_NS);
