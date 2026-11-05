/**
 * Resort conditions store — follows shared selectedResortId from useHomeMountain.
 */
import { create } from "zustand";
import { DEFAULT_RESORT_ID, useHomeMountain } from "@/lib/stomp/home-mountain";
import { loadFictionConditions, type FictionLoadOptions } from "./fiction-adapter";
import { liveConditionsActivation } from "./live-gate";
import type { ConditionsFetchState, ResortConditions } from "./types";
import { CONDITIONS_CACHE_TTL_MS } from "./types";

type ResortConditionsState = {
  selectedResortId: string;
  conditions: ResortConditions;
  lastAttemptIso: string | null;
  expanded: boolean;
  /** Demo force-state for loading/offline UI rehearsal (tests / lab). */
  forceState: ConditionsFetchState | null;
  hydrateFromMountain: () => void;
  refresh: (opts?: FictionLoadOptions) => void;
  setExpanded: (expanded: boolean) => void;
  setForceState: (state: ConditionsFetchState | null) => void;
  /** Bind Trip Drop / other surfaces to the same resort ID. */
  syncSelectedResortId: (resortId: string) => void;
};

function loadFor(resortId: string, forceState: ConditionsFetchState | null): ResortConditions {
  // Live gate: refuse paid path; fiction only.
  void liveConditionsActivation();
  return loadFictionConditions(resortId, forceState ? { forceState } : undefined);
}

function initialConditions(): ResortConditions {
  return loadFor(DEFAULT_RESORT_ID, null);
}

export const useResortConditions = create<ResortConditionsState>((set, get) => ({
  selectedResortId: DEFAULT_RESORT_ID,
  conditions: initialConditions(),
  lastAttemptIso: null,
  expanded: false,
  forceState: null,

  hydrateFromMountain: () => {
    const resortId = useHomeMountain.getState().resortId || DEFAULT_RESORT_ID;
    const { forceState, selectedResortId, conditions, lastAttemptIso } = get();
    const cachedFresh =
      selectedResortId === resortId &&
      conditions.fetchState === "ready" &&
      lastAttemptIso &&
      Date.now() - Date.parse(lastAttemptIso) < CONDITIONS_CACHE_TTL_MS;

    if (cachedFresh && !forceState) {
      set({ selectedResortId: resortId });
      return;
    }

    const next = loadFor(resortId, forceState);
    set({
      selectedResortId: resortId,
      conditions: next,
      lastAttemptIso: new Date().toISOString(),
    });
  },

  refresh: (opts) => {
    const resortId = get().selectedResortId || useHomeMountain.getState().resortId || DEFAULT_RESORT_ID;
    const forceState = opts?.forceState ?? get().forceState;
    const next = loadFictionConditions(resortId, {
      ...opts,
      forceState: forceState ?? undefined,
    });
    set({
      selectedResortId: resortId,
      conditions: next,
      lastAttemptIso: new Date().toISOString(),
    });
  },

  setExpanded: (expanded) => set({ expanded }),

  setForceState: (forceState) => {
    set({ forceState });
    get().refresh(forceState ? { forceState } : undefined);
  },

  syncSelectedResortId: (resortId) => {
    useHomeMountain.getState().selectResort(resortId);
    const next = loadFor(resortId, get().forceState);
    set({
      selectedResortId: resortId,
      conditions: next,
      lastAttemptIso: new Date().toISOString(),
    });
  },
}));

/** Shared selected resort ID — Home, Map, Trip Drop must all read this. */
export function getSelectedResortId(): string {
  return useHomeMountain.getState().resortId || useResortConditions.getState().selectedResortId;
}

/** Dev / screenshot hook — never used for LIVE fabrication. */
if (typeof window !== "undefined" && import.meta.env?.DEV) {
  (window as unknown as { __stompResortConditions?: typeof useResortConditions }).__stompResortConditions =
    useResortConditions;
}
