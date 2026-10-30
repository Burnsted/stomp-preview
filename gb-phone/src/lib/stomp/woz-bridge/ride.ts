/** Woz bridge — Ride / Run Builder / stash, persisted as JSON. Stash = coarse label only (no GPS). */
import * as R from "@woz/ride/ride.js";
import type { LocalJsonStore } from "@woz/core/json-store.js";
export const ride = R;
export type { RideSession, RunPlan, RunHit, FeatureKind, Outcome, RunError, SessionTemplate } from "@woz/ride/ride.js";
export const RIDE_KEY = "ride.current";
export const RUNS_KEY = "ride.runs";

export function saveRide(store: LocalJsonStore, s: R.RideSession, nowIso: string) { store.save(RIDE_KEY, R.serializeRide(s), nowIso); }
export function loadRide(store: LocalJsonStore): R.RideSession | null {
  const raw = store.load<string>(RIDE_KEY); if (typeof raw !== "string") return null;
  const r = R.deserializeRide(raw); return r.ok ? r.value : null;
}
export function saveRuns(store: LocalJsonStore, runs: R.RunPlan[], nowIso: string) { store.save(RUNS_KEY, runs, nowIso); }
export function loadRuns(store: LocalJsonStore): R.RunPlan[] {
  const v = store.load<unknown>(RUNS_KEY);
  return Array.isArray(v) ? v.filter((x): x is R.RunPlan => !!x && typeof x === "object" && typeof (x as R.RunPlan).id === "string" && Array.isArray((x as R.RunPlan).hits)) : [];
}
/** Convert a GB session template (sessions.ts) into a batch1 run plan. */
export function runFromGbSession(t: { id: string; title?: string; name?: string; steps?: { id: string; label?: string; title?: string }[] }): R.RunPlan {
  const hits = (t.steps ?? []).slice(0, R.MAX_HITS).map((s, i) => ({ id: `${t.id}-${s.id ?? i}`, feature: "natural" as const, label: s.label ?? s.title ?? `Step ${i + 1}` }));
  return { id: `run-${t.id}`, name: t.title ?? t.name ?? t.id, hits };
}
