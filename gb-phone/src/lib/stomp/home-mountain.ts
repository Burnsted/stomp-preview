/**
 * Concept B — demo mountain hierarchy for the home map card.
 * Stub/demo only: no live GPS, Mapbox, or auth. Selected resort persists under stomp-woz:*.
 */
import { create } from "zustand";
import { createWozStore, type LocalJsonStore } from "@/lib/stomp/woz-bridge/persistence";

export type MapLevel = "us" | "state" | "resort" | "trail";

export type DemoState = { id: string; code: string; name: string };
export type DemoResort = { id: string; stateId: string; name: string };

export const DEMO_STATES: DemoState[] = [{ id: "co", code: "CO", name: "Colorado" }];

export const DEMO_RESORTS: DemoResort[] = [
  { id: "beaver-creek", stateId: "co", name: "Beaver Creek" },
  { id: "vail", stateId: "co", name: "Vail" },
  { id: "keystone", stateId: "co", name: "Keystone" },
];

const RESORT_KEY = "home.resort";
const LEVEL_KEY = "home.mapLevel";

let backing: LocalJsonStore = createWozStore();

export function setHomeMountainBacking(store: LocalJsonStore) {
  backing = store;
}

export function getHomeMountainBacking() {
  return backing;
}

function readResortId(): string | null {
  const raw = backing.load<unknown>(RESORT_KEY);
  if (typeof raw !== "string") return null;
  return DEMO_RESORTS.some((r) => r.id === raw) ? raw : null;
}

function readLevel(resortId: string | null): MapLevel {
  const raw = backing.load<unknown>(LEVEL_KEY);
  if (raw === "us" || raw === "state" || raw === "resort" || raw === "trail") {
    if ((raw === "trail" || raw === "resort") && !resortId) return "us";
    return raw;
  }
  return resortId ? "trail" : "us";
}

function stateForResort(resortId: string | null): string | null {
  return DEMO_RESORTS.find((r) => r.id === resortId)?.stateId ?? null;
}

type HomeMountainState = {
  level: MapLevel;
  stateId: string | null;
  resortId: string | null;
  hydrate: () => void;
  goUs: () => void;
  goState: (stateId: string) => void;
  goResortList: () => void;
  selectResort: (resortId: string) => void;
  showTrail: () => void;
  changeMountain: () => void;
  clearResort: () => void;
};

function persist(level: MapLevel, resortId: string | null) {
  const now = new Date().toISOString();
  if (resortId) backing.save(RESORT_KEY, resortId, now);
  else backing.remove(RESORT_KEY);
  backing.save(LEVEL_KEY, level, now);
}

export const useHomeMountain = create<HomeMountainState>((set, get) => ({
  level: "us",
  stateId: null,
  resortId: null,
  hydrate: () => {
    const resortId = readResortId();
    const stateId = stateForResort(resortId);
    const level = readLevel(resortId);
    set({
      resortId,
      stateId: level === "us" ? null : stateId ?? (level === "state" || level === "resort" || level === "trail" ? "co" : null),
      level,
    });
  },
  goUs: () => {
    set({ level: "us", stateId: null });
    persist("us", get().resortId);
  },
  goState: (stateId) => {
    if (!DEMO_STATES.some((s) => s.id === stateId)) return;
    set({ level: "state", stateId });
    persist("state", get().resortId);
  },
  goResortList: () => {
    const stateId = get().stateId ?? "co";
    set({ level: "resort", stateId });
    persist("resort", get().resortId);
  },
  selectResort: (resortId) => {
    const resort = DEMO_RESORTS.find((r) => r.id === resortId);
    if (!resort) return;
    set({ level: "trail", stateId: resort.stateId, resortId });
    persist("trail", resortId);
  },
  showTrail: () => {
    const { resortId, stateId } = get();
    if (!resortId) return;
    set({ level: "trail", stateId: stateId ?? stateForResort(resortId) });
    persist("trail", resortId);
  },
  changeMountain: () => {
    const stateId = get().stateId ?? stateForResort(get().resortId) ?? "co";
    set({ level: "resort", stateId, resortId: get().resortId });
    persist("resort", get().resortId);
  },
  clearResort: () => {
    set({ level: "us", stateId: null, resortId: null });
    persist("us", null);
  },
}));

export function resortById(id: string | null | undefined) {
  return DEMO_RESORTS.find((r) => r.id === id) ?? null;
}

export function stateById(id: string | null | undefined) {
  return DEMO_STATES.find((s) => s.id === id) ?? null;
}

export function resortsForState(stateId: string) {
  return DEMO_RESORTS.filter((r) => r.stateId === stateId);
}
