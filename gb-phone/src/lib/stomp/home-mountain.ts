/**
 * Home mountain — single default demo mountain (HARD LOCK Ted 2026-10-31 ~10:34 PM ET).
 * NEVER expose US → state → resort → trail crumb/pill drill or CO/UT/CA/VT region chips.
 * Demo/stub only — no live GPS.
 */
import { create } from "zustand";
import { createWozStore, type LocalJsonStore } from "@/lib/stomp/woz-bridge/persistence";

export type DemoState = { id: string; code: string; name: string };
export type DemoResort = { id: string; stateId: string; name: string };

/** Demo mountain metadata only — NOT a UI state picker. */
export const DEMO_STATES: DemoState[] = [
  { id: "co", code: "CO", name: "Colorado" },
  { id: "ut", code: "UT", name: "Utah" },
  { id: "ca", code: "CA", name: "California" },
  { id: "vt", code: "VT", name: "Vermont" },
];

export const DEMO_RESORTS: DemoResort[] = [
  { id: "beaver-creek", stateId: "co", name: "Beaver Creek" },
  { id: "vail", stateId: "co", name: "Vail" },
  { id: "breckenridge", stateId: "co", name: "Breckenridge" },
  { id: "keystone", stateId: "co", name: "Keystone" },
  { id: "park-city", stateId: "ut", name: "Park City" },
  { id: "snowbird", stateId: "ut", name: "Snowbird" },
  { id: "mammoth", stateId: "ca", name: "Mammoth" },
  { id: "palisades", stateId: "ca", name: "Palisades Tahoe" },
  { id: "stowe", stateId: "vt", name: "Stowe" },
  { id: "killington", stateId: "vt", name: "Killington" },
];

/** Single locked demo mountain on home map card. */
export const DEFAULT_RESORT_ID = "vail";

const RESORT_KEY = "home.resort";

let backing: LocalJsonStore = createWozStore();

export function setHomeMountainBacking(store: LocalJsonStore) {
  backing = store;
}

export function getHomeMountainBacking() {
  return backing;
}

function readResortId(): string {
  const raw = backing.load<unknown>(RESORT_KEY);
  if (typeof raw === "string" && DEMO_RESORTS.some((r) => r.id === raw)) return raw;
  return DEFAULT_RESORT_ID;
}

type HomeMountainState = {
  resortId: string;
  hydrate: () => void;
  selectResort: (resortId: string) => void;
  resetToDefault: () => void;
};

function persist(resortId: string) {
  backing.save(RESORT_KEY, resortId, new Date().toISOString());
}

export const useHomeMountain = create<HomeMountainState>((set) => ({
  resortId: DEFAULT_RESORT_ID,
  hydrate: () => {
    const resortId = readResortId();
    set({ resortId });
  },
  selectResort: (resortId) => {
    if (!DEMO_RESORTS.some((r) => r.id === resortId)) return;
    set({ resortId });
    persist(resortId);
  },
  resetToDefault: () => {
    set({ resortId: DEFAULT_RESORT_ID });
    persist(DEFAULT_RESORT_ID);
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

export function locationLineFor(resortId: string | null | undefined): string {
  const resort = resortById(resortId) ?? resortById(DEFAULT_RESORT_ID)!;
  const state = stateById(resort.stateId);
  return state ? `${resort.name} · ${state.code}` : resort.name;
}
