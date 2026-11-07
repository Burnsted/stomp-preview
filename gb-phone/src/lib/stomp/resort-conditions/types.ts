/**
 * Resort conditions data contract (t1221u).
 * Reusable across Home / Map / Trip Drop — keyed by shared selectedResortId.
 * Fiction vs live labeling is enforced in labels.ts; never present fiction as LIVE.
 */

export type ConditionsProvenance = "fiction" | "live";

/** UI / fetch lifecycle — orthogonal to provenance. */
export type ConditionsFetchState =
  | "idle"
  | "loading"
  | "ready"
  | "stale"
  | "unavailable"
  | "offline";

export type TemperatureUnit = "F" | "C";
export type SpeedUnit = "mph" | "kph";
export type DepthUnit = "in" | "cm";

export type MountainWeather = {
  elevationFt: number | null;
  temp: number | null;
  tempUnit: TemperatureUnit;
  windSpeed: number | null;
  windUnit: SpeedUnit;
  windGust: number | null;
  summary: string | null;
  /** Short forecast line (e.g. next 12–24h). */
  forecast: string | null;
};

export type SnowReport = {
  snowfall24h: number | null;
  snowfall48h: number | null;
  baseDepth: number | null;
  depthUnit: DepthUnit;
  surface: string | null;
};

export type LiftTrailStatus = {
  liftsOpen: number | null;
  liftsTotal: number | null;
  trailsOpen: number | null;
  trailsTotal: number | null;
  operatingStatus: string | null;
};

export type TrailMapRef = {
  permission: "embed-authorized" | "link-only" | "unclear";
  officialMapPageUrl: string | null;
  attribution: string | null;
};

export type ConditionsSource = {
  id: string;
  label: string;
  url: string | null;
};

/**
 * Canonical conditions payload for one resort.
 * Null numeric fields mean unavailable — never invent numbers.
 */
export type ResortConditions = {
  resortId: string;
  resortName: string;
  provenance: ConditionsProvenance;
  fetchState: ConditionsFetchState;
  weather: MountainWeather | null;
  snow: SnowReport | null;
  liftsTrails: LiftTrailStatus | null;
  trailMap: TrailMapRef | null;
  sources: ConditionsSource[];
  /** ISO timestamp when this payload was produced / last refreshed. */
  updatedAtIso: string | null;
  /** ISO timestamp when cache should be considered stale. */
  staleAfterIso: string | null;
  /** Human note for fiction / sample / offline — never empty when provenance=fiction. */
  honestyNote: string;
};

export type ResortConditionsSnapshot = {
  selectedResortId: string;
  conditions: ResortConditions;
  /** Wall-clock of last successful load attempt (ready or unavailable). */
  lastAttemptIso: string | null;
};

/** Default cache TTL for ready payloads (fiction or live). */
export const CONDITIONS_CACHE_TTL_MS = 15 * 60 * 1000;

/** Live API path is gated off until owner activation. */
export const LIVE_CONDITIONS_ENABLED = false;
