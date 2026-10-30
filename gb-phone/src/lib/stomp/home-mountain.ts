/**
 * Concept B — demo mountain hierarchy for the home map card.
 * Four US ski regions (CO / UT / CA / VT). Stub only — no live GPS/auth.
 * Selected resort + map level persist under stomp-woz:*.
 */
import { create } from "zustand";
import { createWozStore, type LocalJsonStore } from "@/lib/stomp/woz-bridge/persistence";

export type MapLevel = "us" | "state" | "resort" | "trail";

export type DemoState = { id: string; code: string; name: string };
export type DemoResort = { id: string; stateId: string; name: string };

/** All four first-class demo regions (Ted). */
export const DEMO_STATES: DemoState[] = [
  { id: "co", code: "CO", name: "Colorado" },
  { id: "ut", code: "UT", name: "Utah" },
  { id: "ca", code: "CA", name: "California" },
  { id: "vt", code: "VT", name: "Vermont" },
];

export const DEMO_RESORTS: DemoResort[] = [
  // Colorado
  { id: "beaver-creek", stateId: "co", name: "Beaver Creek" },
  { id: "vail", stateId: "co", name: "Vail" },
  { id: "keystone", stateId: "co", name: "Keystone" },
  // Utah
  { id: "park-city", stateId: "ut", name: "Park City" },
  { id: "snowbird", stateId: "ut", name: "Snowbird" },
  // California
  { id: "mammoth", stateId: "ca", name: "Mammoth" },
  { id: "palisades", stateId: "ca", name: "Palisades Tahoe" },
  // Vermont
  { id: "stowe", stateId: "vt", name: "Stowe" },
  { id: "killington", stateId: "vt", name: "Killington" },
];

const RESORT_KEY = "home.resort";
const LEVEL_KEY = "home.mapLevel";
const STATE_KEY = "home.state";

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

function readStateId(): string | null {
  const raw = backing.load<unknown>(STATE_KEY);
  if (typeof raw !== "string") return null;
  return DEMO_STATES.some((s) => s.id === raw) ? raw : null;
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

function persist(level: MapLevel, stateId: string | null, resortId: string | null) {
  const now = new Date().toISOString();
  if (resortId) backing.save(RESORT_KEY, resortId, now);
  else backing.remove(RESORT_KEY);
  if (stateId) backing.save(STATE_KEY, stateId, now);
  else backing.remove(STATE_KEY);
  backing.save(LEVEL_KEY, level, now);
}

export const useHomeMountain = create<HomeMountainState>((set, get) => ({
  level: "us",
  stateId: null,
  resortId: null,
  hydrate: () => {
    const resortId = readResortId();
    const level = readLevel(resortId);
    const fromResort = stateForResort(resortId);
    const savedState = readStateId();
    let stateId: string | null = null;
    if (level === "us") stateId = null;
    else stateId = fromResort ?? savedState;
    set({ resortId, stateId, level });
  },
  goUs: () => {
    set({ level: "us", stateId: null });
    persist("us", null, get().resortId);
  },
  goState: (stateId) => {
    if (!DEMO_STATES.some((s) => s.id === stateId)) return;
    const keepResort = get().resortId;
    const same = keepResort && stateForResort(keepResort) === stateId ? keepResort : null;
    set({ level: "state", stateId, resortId: same ?? get().resortId });
    // Keep prior resort selection if still in another state; changeMountain clears via pick.
    persist("state", stateId, get().resortId);
  },
  goResortList: () => {
    const stateId = get().stateId ?? readStateId() ?? DEMO_STATES[0]!.id;
    set({ level: "resort", stateId });
    persist("resort", stateId, get().resortId);
  },
  selectResort: (resortId) => {
    const resort = DEMO_RESORTS.find((r) => r.id === resortId);
    if (!resort) return;
    set({ level: "trail", stateId: resort.stateId, resortId });
    persist("trail", resort.stateId, resortId);
  },
  showTrail: () => {
    const { resortId, stateId } = get();
    if (!resortId) return;
    const nextState = stateId ?? stateForResort(resortId);
    set({ level: "trail", stateId: nextState });
    persist("trail", nextState, resortId);
  },
  changeMountain: () => {
    const stateId = get().stateId ?? stateForResort(get().resortId) ?? DEMO_STATES[0]!.id;
    set({ level: "resort", stateId, resortId: get().resortId });
    persist("resort", stateId, get().resortId);
  },
  clearResort: () => {
    set({ level: "us", stateId: null, resortId: null });
    persist("us", null, null);
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
