/**
 * Fiction / SAMPLE resort conditions fixtures (t1221u).
 * Numbers are illustrative only — never present as LIVE.
 * Covers ≥2 resorts to prove the model is reusable (not Beaver Creek–hardcoded).
 */
import type { ResortConditions } from "./types";
import { trailMapFor } from "@/lib/stomp/resort-trail-maps";

const FICTION_NOTE =
  "FICTION · SAMPLE data for UI rehearsal. Not live weather, snow, or lift status.";

function trailMapRef(resortId: string) {
  const map = trailMapFor(resortId);
  if (!map) {
    return {
      permission: "unclear" as const,
      officialMapPageUrl: null,
      attribution: null,
    };
  }
  return {
    permission: map.permission,
    officialMapPageUrl: map.officialMapPageUrl,
    attribution: map.attribution,
  };
}

/** Fixed sample clock so tests are stable. */
export const FICTION_UPDATED_AT = "2026-11-05T18:00:00.000Z";
export const FICTION_STALE_AFTER = "2026-11-05T18:15:00.000Z";

export const FICTION_CONDITIONS_BY_RESORT: Record<string, ResortConditions> = {
  vail: {
    resortId: "vail",
    resortName: "Vail",
    provenance: "fiction",
    fetchState: "ready",
    weather: {
      elevationFt: 11250,
      temp: 18,
      tempUnit: "F",
      windSpeed: 12,
      windUnit: "mph",
      windGust: 22,
      summary: "Clear and cold at mid-mountain",
      forecast: "Overnight lows teens · light wind through tomorrow AM",
    },
    snow: {
      snowfall24h: 3,
      snowfall48h: 6,
      baseDepth: 28,
      depthUnit: "in",
      surface: "Packed powder",
    },
    liftsTrails: {
      liftsOpen: 24,
      liftsTotal: 31,
      trailsOpen: 148,
      trailsTotal: 195,
      operatingStatus: "Open",
    },
    trailMap: trailMapRef("vail"),
    sources: [
      {
        id: "fiction-vail",
        label: "STOMP fiction fixture · Vail",
        url: null,
      },
    ],
    updatedAtIso: FICTION_UPDATED_AT,
    staleAfterIso: FICTION_STALE_AFTER,
    honestyNote: FICTION_NOTE,
  },
  "beaver-creek": {
    resortId: "beaver-creek",
    resortName: "Beaver Creek",
    provenance: "fiction",
    fetchState: "ready",
    weather: {
      elevationFt: 9860,
      temp: 22,
      tempUnit: "F",
      windSpeed: 8,
      windUnit: "mph",
      windGust: 14,
      summary: "Partly cloudy · soft afternoon light",
      forecast: "Clouds thicken tonight · flurries possible after dusk",
    },
    snow: {
      snowfall24h: 2,
      snowfall48h: 5,
      baseDepth: 32,
      depthUnit: "in",
      surface: "Machine groomed / packed powder",
    },
    liftsTrails: {
      liftsOpen: 18,
      liftsTotal: 25,
      trailsOpen: 112,
      trailsTotal: 150,
      operatingStatus: "Open",
    },
    trailMap: trailMapRef("beaver-creek"),
    sources: [
      {
        id: "fiction-beaver-creek",
        label: "STOMP fiction fixture · Beaver Creek",
        url: null,
      },
    ],
    updatedAtIso: FICTION_UPDATED_AT,
    staleAfterIso: FICTION_STALE_AFTER,
    honestyNote: FICTION_NOTE,
  },
  "park-city": {
    resortId: "park-city",
    resortName: "Park City",
    provenance: "fiction",
    fetchState: "ready",
    weather: {
      elevationFt: 9000,
      temp: 26,
      tempUnit: "F",
      windSpeed: 15,
      windUnit: "mph",
      windGust: 28,
      summary: "Breezy ridge · sun breaks mid-day",
      forecast: "Wind eases tomorrow · high near 30°F",
    },
    snow: {
      snowfall24h: 1,
      snowfall48h: 4,
      baseDepth: 24,
      depthUnit: "in",
      surface: "Packed powder",
    },
    liftsTrails: {
      liftsOpen: 32,
      liftsTotal: 41,
      trailsOpen: 220,
      trailsTotal: 330,
      operatingStatus: "Open",
    },
    trailMap: trailMapRef("park-city"),
    sources: [
      {
        id: "fiction-park-city",
        label: "STOMP fiction fixture · Park City",
        url: null,
      },
    ],
    updatedAtIso: FICTION_UPDATED_AT,
    staleAfterIso: FICTION_STALE_AFTER,
    honestyNote: FICTION_NOTE,
  },
  breckenridge: {
    resortId: "breckenridge",
    resortName: "Breckenridge",
    provenance: "fiction",
    fetchState: "ready",
    weather: {
      elevationFt: 12150,
      temp: 16,
      tempUnit: "F",
      windSpeed: 14,
      windUnit: "mph",
      windGust: 26,
      summary: "Cold alpine · high peaks in cloud",
      forecast: "Light snow overnight · windy above tree line",
    },
    snow: {
      snowfall24h: 4,
      snowfall48h: 7,
      baseDepth: 36,
      depthUnit: "in",
      surface: "Packed powder / variable",
    },
    liftsTrails: {
      liftsOpen: 28,
      liftsTotal: 35,
      trailsOpen: 155,
      trailsTotal: 187,
      operatingStatus: "Open",
    },
    trailMap: trailMapRef("breckenridge"),
    sources: [
      {
        id: "fiction-breckenridge",
        label: "STOMP fiction fixture · Breckenridge",
        url: null,
      },
    ],
    updatedAtIso: FICTION_UPDATED_AT,
    staleAfterIso: FICTION_STALE_AFTER,
    honestyNote: FICTION_NOTE,
  },
};

/** Minimal unavailable shell when no fiction fixture exists for a resort. */
export function unavailableFictionShell(resortId: string, resortName: string): ResortConditions {
  return {
    resortId,
    resortName,
    provenance: "fiction",
    fetchState: "unavailable",
    weather: null,
    snow: null,
    liftsTrails: null,
    trailMap: trailMapRef(resortId),
    sources: [
      {
        id: `fiction-unavailable-${resortId}`,
        label: "No fiction fixture for this resort",
        url: null,
      },
    ],
    updatedAtIso: null,
    staleAfterIso: null,
    honestyNote: "FICTION · SAMPLE unavailable for this mountain. Not LIVE.",
  };
}
