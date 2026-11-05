/**
 * Fiction conditions adapter (t1221u).
 * Always provenance=fiction; never emits LIVE labeling.
 */
import { resortById } from "@/lib/stomp/home-mountain";
import {
  FICTION_CONDITIONS_BY_RESORT,
  unavailableFictionShell,
} from "./fiction-fixtures";
import { conditionsBadge, assertHonestLabel } from "./labels";
import type { ConditionsFetchState, ResortConditions } from "./types";
import { CONDITIONS_CACHE_TTL_MS } from "./types";

export type FictionLoadOptions = {
  /** Force a lifecycle state for UI rehearsal (loading / offline / stale). */
  forceState?: ConditionsFetchState;
  /** Override now for stale checks / timestamps. */
  nowIso?: string;
};

function withFetchState(base: ResortConditions, fetchState: ConditionsFetchState, nowIso: string): ResortConditions {
  if (fetchState === "loading") {
    return {
      ...base,
      fetchState: "loading",
      weather: null,
      snow: null,
      liftsTrails: null,
      updatedAtIso: null,
      honestyNote: "Loading sample mountain conditions…",
    };
  }
  if (fetchState === "offline") {
    return {
      ...base,
      fetchState: "offline",
      weather: null,
      snow: null,
      liftsTrails: null,
      updatedAtIso: null,
      honestyNote: "Offline · FICTION sample unavailable. Not LIVE.",
    };
  }
  if (fetchState === "unavailable") {
    return unavailableFictionShell(base.resortId, base.resortName);
  }
  if (fetchState === "stale") {
    const staleAt = new Date(new Date(nowIso).getTime() - CONDITIONS_CACHE_TTL_MS - 60_000).toISOString();
    return {
      ...base,
      fetchState: "stale",
      updatedAtIso: staleAt,
      staleAfterIso: nowIso,
      honestyNote: `${base.honestyNote} · cache past TTL (still FICTION · SAMPLE).`,
    };
  }
  return { ...base, fetchState: "ready" };
}

/** Load fiction conditions for a resort ID. Synchronous — local fixtures only. */
export function loadFictionConditions(
  resortId: string,
  options: FictionLoadOptions = {},
): ResortConditions {
  const resort = resortById(resortId);
  const name = resort?.name ?? resortId;
  const nowIso = options.nowIso ?? new Date().toISOString();
  const fixture = FICTION_CONDITIONS_BY_RESORT[resortId];
  const base = fixture
    ? { ...fixture, resortName: fixture.resortName || name }
    : unavailableFictionShell(resortId, name);

  const next = options.forceState ? withFetchState(base, options.forceState, nowIso) : { ...base, fetchState: base.fetchState };

  const badge = conditionsBadge(next);
  if (!assertHonestLabel(next.provenance, badge)) {
    throw new Error(`Fiction adapter produced LIVE label for ${resortId}`);
  }
  if (next.provenance !== "fiction") {
    throw new Error(`Fiction adapter must return provenance=fiction for ${resortId}`);
  }
  return next;
}

export function listFictionFixtureResortIds(): string[] {
  return Object.keys(FICTION_CONDITIONS_BY_RESORT);
}
