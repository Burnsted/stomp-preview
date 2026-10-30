/**
 * Ride experience (Full-cycle C): Run Builder, park-session state machine, trick
 * logging, templates, stash markers. Offline-safe, JSON-serializable plain data.
 * Naming: "RideSession" = on-hill park session (distinct from SESSION voice, crew
 * ScheduledCrewSession, CampfireSession). See docs/fullcycle/NAMING.md.
 */
import { err, ok, type Result } from "../core/result.js";

export type FeatureKind = "jump" | "rail" | "box" | "jib" | "pipe" | "natural";
export interface RunHit { id: string; feature: FeatureKind; label: string; plannedTrick?: string }
export interface RunPlan { id: string; name: string; hits: RunHit[] }
export type RunError = "empty_name" | "not_found" | "duplicate" | "out_of_range" | "too_many_hits" | "invalid_transition" | "not_active" | "bad_json";
export const MAX_HITS = 20;

export const createRun = (id: string, name: string): Result<RunPlan, RunError> => (name.trim() ? ok({ id, name: name.trim(), hits: [] }) : err("empty_name"));
export function addHit(r: RunPlan, h: RunHit): Result<RunPlan, RunError> {
  if (r.hits.length >= MAX_HITS) return err("too_many_hits");
  if (r.hits.some((x) => x.id === h.id)) return err("duplicate");
  return ok({ ...r, hits: [...r.hits, h] });
}
export function removeHit(r: RunPlan, id: string): Result<RunPlan, RunError> {
  return r.hits.some((h) => h.id === id) ? ok({ ...r, hits: r.hits.filter((h) => h.id !== id) }) : err("not_found");
}
export function moveHit(r: RunPlan, from: number, to: number): Result<RunPlan, RunError> {
  if (from < 0 || to < 0 || from >= r.hits.length || to >= r.hits.length) return err("out_of_range");
  const hits = [...r.hits]; const [h] = hits.splice(from, 1); hits.splice(to, 0, h!); return ok({ ...r, hits });
}
export const nextHit = (r: RunPlan, completed: number): RunHit | null => r.hits[completed] ?? null;

// ---- Templates ----
export interface SessionTemplate { id: string; name: string; hits: Omit<RunHit, "id">[]; targetTricks: number }
export const SESSION_TEMPLATES: readonly SessionTemplate[] = [
  { id: "warmup", name: "Warm-up Laps", targetTricks: 5, hits: [{ feature: "box", label: "Flat box" }, { feature: "jump", label: "Small kicker" }] },
  { id: "jib_line", name: "Jib Line", targetTricks: 10, hits: [{ feature: "box", label: "Down box" }, { feature: "rail", label: "Flat rail" }, { feature: "jib", label: "Wall ride" }] },
  { id: "jump_line", name: "Jump Line", targetTricks: 8, hits: [{ feature: "jump", label: "Medium kicker" }, { feature: "jump", label: "Step-down" }] },
];
export function runFromTemplate(t: SessionTemplate, runId: string): RunPlan {
  return { id: runId, name: t.name, hits: t.hits.map((h, i) => ({ ...h, id: `${runId}-h${i + 1}` })) };
}

// ---- Ride session state machine ----
export type RidePhase = "idle" | "active" | "paused" | "ended";
export type Outcome = "stomped" | "washed_out";
export interface TrickEntry { seq: number; trick: string; outcome: Outcome; hitId?: string; atIso: string }
export interface StashMarker { id: string; label: string; /** Coarse, local-only label (no GPS coords stored). */ zoneLabel: string; atIso: string; private: true }
export interface RideSession { id: string; phase: RidePhase; parkLabel: string; run: RunPlan | null; completedHits: number; tricks: TrickEntry[]; stashes: StashMarker[]; startedAtIso?: string; endedAtIso?: string; pausedMs: number; pausedAtIso?: string }
export const RIDE_TRANSITIONS: Readonly<Record<RidePhase, readonly RidePhase[]>> = { idle: ["active"], active: ["paused", "ended"], paused: ["active", "ended"], ended: [] };

export const newRideSession = (id: string, parkLabel: string, run: RunPlan | null = null): RideSession => ({ id, phase: "idle", parkLabel, run, completedHits: 0, tricks: [], stashes: [], pausedMs: 0 });
function go(s: RideSession, to: RidePhase): Result<RideSession, RunError> { return RIDE_TRANSITIONS[s.phase].includes(to) ? ok({ ...s, phase: to }) : err("invalid_transition"); }
export const startRide = (s: RideSession, nowIso: string): Result<RideSession, RunError> => { const r = go(s, "active"); return r.ok ? ok({ ...r.value, startedAtIso: nowIso }) : r; };
export const pauseRide = (s: RideSession, nowIso: string): Result<RideSession, RunError> => { const r = go(s, "paused"); return r.ok ? ok({ ...r.value, pausedAtIso: nowIso }) : r; };
export function resumeRide(s: RideSession, nowIso: string): Result<RideSession, RunError> {
  if (s.phase !== "paused") return err("invalid_transition");
  const add = Date.parse(nowIso) - Date.parse(s.pausedAtIso!);
  return ok({ ...s, phase: "active", pausedMs: s.pausedMs + Math.max(0, add), pausedAtIso: undefined });
}
export function endRide(s: RideSession, nowIso: string): Result<RideSession, RunError> {
  const base = s.phase === "paused" ? { ...s, pausedMs: s.pausedMs + Math.max(0, Date.parse(nowIso) - Date.parse(s.pausedAtIso!)), pausedAtIso: undefined } : s;
  const r = go(base, "ended"); return r.ok ? ok({ ...r.value, endedAtIso: nowIso }) : r;
}
export function logTrick(s: RideSession, t: { trick: string; outcome: Outcome; nowIso: string; advanceHit?: boolean }): Result<RideSession, RunError> {
  if (s.phase !== "active") return err("not_active");
  if (!t.trick.trim()) return err("empty_name");
  const hit = s.run ? nextHit(s.run, s.completedHits) : null;
  const entry: TrickEntry = { seq: s.tricks.length + 1, trick: t.trick.trim(), outcome: t.outcome, hitId: hit?.id, atIso: t.nowIso };
  const adv = t.advanceHit !== false && hit && t.outcome === "stomped" ? 1 : 0;
  return ok({ ...s, tricks: [...s.tricks, entry], completedHits: s.completedHits + adv });
}
export function undoLastTrick(s: RideSession): Result<RideSession, RunError> {
  const last = s.tricks.at(-1); if (!last) return err("not_found");
  const back = last.hitId && last.outcome === "stomped" ? 1 : 0;
  return ok({ ...s, tricks: s.tricks.slice(0, -1), completedHits: Math.max(0, s.completedHits - back) });
}
export function markStash(s: RideSession, m: { id: string; label: string; zoneLabel: string; nowIso: string }): Result<RideSession, RunError> {
  if (s.phase === "ended" || s.phase === "idle") return err("not_active");
  if (s.stashes.some((x) => x.id === m.id)) return err("duplicate");
  if (/-?\d{1,3}\.\d{3,}/.test(m.zoneLabel)) return err("bad_json"); // reject raw coordinates
  return ok({ ...s, stashes: [...s.stashes, { id: m.id, label: m.label, zoneLabel: m.zoneLabel, atIso: m.nowIso, private: true }] });
}
export function rideSummary(s: RideSession) {
  const stomped = s.tricks.filter((t) => t.outcome === "stomped").length;
  const total = s.tricks.length;
  const durMs = s.startedAtIso && s.endedAtIso ? Date.parse(s.endedAtIso) - Date.parse(s.startedAtIso) - s.pausedMs : 0;
  return { total, stomped, washedOut: total - stomped, landRate: total ? stomped / total : 0, hitsCompleted: s.completedHits, hitsPlanned: s.run?.hits.length ?? 0, stashCount: s.stashes.length, activeMs: Math.max(0, durMs) };
}
export const serializeRide = (s: RideSession) => JSON.stringify(s);
export function deserializeRide(json: string): Result<RideSession, RunError> {
  try { const o = JSON.parse(json); if (!o || typeof o.id !== "string" || !Array.isArray(o.tricks) || !(o.phase in RIDE_TRANSITIONS)) return err("bad_json"); return ok(o as RideSession); } catch { return err("bad_json"); }
}
