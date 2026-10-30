/** Demo playlist order (local only). Persists under stomp-woz:music.order. */
import { createWozStore, type LocalJsonStore } from "@/lib/stomp/woz-bridge/persistence";

const KEY = "music.order";
let backing: LocalJsonStore = createWozStore();

export function setMusicOrderBacking(store: LocalJsonStore) {
  backing = store;
}

export function loadTrackOrder(): string[] {
  const raw = backing.load<unknown>(KEY);
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string") : [];
}

export function saveTrackOrder(ids: string[]) {
  backing.save(KEY, ids, new Date().toISOString());
}

/** Merge saved order with current track ids (unknown ids appended). */
export function orderedIds(current: string[], saved: string[] = loadTrackOrder()): string[] {
  const set = new Set(current);
  const head = saved.filter((id) => set.has(id));
  const rest = current.filter((id) => !head.includes(id));
  return [...head, ...rest];
}

export function moveTrack(ids: string[], id: string, dir: -1 | 1): string[] {
  const i = ids.indexOf(id);
  if (i < 0) return ids;
  const j = i + dir;
  if (j < 0 || j >= ids.length) return ids;
  const next = ids.slice();
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}
