import { describe, it, expect } from "vitest";
import * as R from "../src/ride/ride";
import { LocalJsonStore, createMemoryBackend } from "../src/core/json-store";
const T0 = "2026-11-01T10:00:00Z", T1 = "2026-11-01T10:30:00Z", T2 = "2026-11-01T10:40:00Z", T3 = "2026-11-01T11:00:00Z";
const v = <T,>(x: { ok: boolean; value?: T }) => { if (!x.ok) throw new Error(JSON.stringify(x)); return x.value as T; };
const run = () => R.runFromTemplate(R.SESSION_TEMPLATES[1]!, "r1");
const active = () => v(R.startRide(R.newRideSession("s1", "Fictional Park", run()), T0));

describe("run builder", () => {
  it("create run trims", () => expect(v(R.createRun("r", "  Line ")).name).toBe("Line"));
  it("empty run name", () => expect(R.createRun("r", " ").ok).toBe(false));
  it("add/remove hit", () => { let r = v(R.createRun("r", "L")); r = v(R.addHit(r, { id: "h1", feature: "rail", label: "Rail" })); expect(r.hits).toHaveLength(1); r = v(R.removeHit(r, "h1")); expect(r.hits).toHaveLength(0); });
  it("duplicate hit", () => { const r = v(R.addHit(v(R.createRun("r", "L")), { id: "h", feature: "box", label: "b" })); expect((R.addHit(r, { id: "h", feature: "box", label: "b" }) as any).error).toBe("duplicate"); });
  it("remove missing", () => expect(R.removeHit(run(), "zz").ok).toBe(false));
  it("max hits", () => { let r = v(R.createRun("r", "L")); for (let i = 0; i < R.MAX_HITS; i++) r = v(R.addHit(r, { id: `h${i}`, feature: "jump", label: "j" })); expect((R.addHit(r, { id: "x", feature: "jump", label: "j" }) as any).error).toBe("too_many_hits"); });
  it("move hit reorders", () => expect(v(R.moveHit(run(), 0, 2)).hits.map((h) => h.label)).toEqual(["Flat rail", "Wall ride", "Down box"]));
  it.each([[-1, 0], [0, 3], [5, 0]])("move out of range %i->%i", (a, b) => expect(R.moveHit(run(), a, b).ok).toBe(false));
  it("nextHit", () => { expect(R.nextHit(run(), 0)?.label).toBe("Down box"); expect(R.nextHit(run(), 3)).toBeNull(); });
  it.each(R.SESSION_TEMPLATES.map((t) => [t.id, t] as const))("template %s builds unique hit ids", (_id, t) => { const r = R.runFromTemplate(t, "x"); expect(new Set(r.hits.map((h) => h.id)).size).toBe(t.hits.length); expect(r.name).toBe(t.name); });
});

describe("ride session state machine", () => {
  it("starts idle", () => expect(R.newRideSession("s", "P").phase).toBe("idle"));
  it.each([["idle", "active", true], ["idle", "ended", false], ["active", "paused", true], ["active", "ended", true], ["paused", "active", true], ["paused", "ended", true], ["ended", "active", false], ["active", "idle", false]] as const)("%s -> %s allowed=%s", (f, t, ok) => expect(R.RIDE_TRANSITIONS[f].includes(t)).toBe(ok));
  it("cannot start twice", () => expect(R.startRide(active(), T1).ok).toBe(false));
  it("cannot end idle", () => expect(R.endRide(R.newRideSession("s", "P"), T1).ok).toBe(false));
  it("resume only from paused", () => expect(R.resumeRide(active(), T1).ok).toBe(false));
  it("pause accumulates", () => { let s = v(R.pauseRide(active(), T1)); s = v(R.resumeRide(s, T2)); expect(s.pausedMs).toBe(600000); s = v(R.endRide(s, T3)); expect(R.rideSummary(s).activeMs).toBe(3600000 - 600000); });
  it("end while paused counts pause", () => { let s = v(R.pauseRide(active(), T1)); s = v(R.endRide(s, T3)); expect(s.pausedMs).toBe(1800000); expect(s.phase).toBe("ended"); });
  it("ended is terminal", () => { const s = v(R.endRide(active(), T3)); expect(R.pauseRide(s, T3).ok).toBe(false); expect(R.startRide(s, T3).ok).toBe(false); });
});

describe("trick logging", () => {
  it("log requires active", () => { expect((R.logTrick(R.newRideSession("s", "P"), { trick: "50-50", outcome: "stomped", nowIso: T0 }) as any).error).toBe("not_active"); const p = v(R.pauseRide(active(), T1)); expect(R.logTrick(p, { trick: "x", outcome: "stomped", nowIso: T1 }).ok).toBe(false); });
  it("empty trick rejected", () => expect(R.logTrick(active(), { trick: " ", outcome: "stomped", nowIso: T0 }).ok).toBe(false));
  it("stomp advances hit, wash does not", () => { let s = v(R.logTrick(active(), { trick: "50-50", outcome: "washed_out", nowIso: T0 })); expect(s.completedHits).toBe(0); s = v(R.logTrick(s, { trick: "50-50", outcome: "stomped", nowIso: T0 })); expect(s.completedHits).toBe(1); expect(s.tricks[1]!.hitId).toBe("r1-h1"); });
  it("advanceHit false keeps hit", () => expect(v(R.logTrick(active(), { trick: "x", outcome: "stomped", nowIso: T0, advanceHit: false })).completedHits).toBe(0));
  it("seq increments", () => { let s = active(); for (let i = 0; i < 4; i++) s = v(R.logTrick(s, { trick: "t", outcome: "stomped", nowIso: T0 })); expect(s.tricks.map((t) => t.seq)).toEqual([1, 2, 3, 4]); });
  it("past run end has no hitId", () => { let s = active(); for (let i = 0; i < 4; i++) s = v(R.logTrick(s, { trick: "t", outcome: "stomped", nowIso: T0 })); expect(s.tricks[3]!.hitId).toBeUndefined(); expect(s.completedHits).toBe(3); });
  it("undo reverts hit", () => { let s = v(R.logTrick(active(), { trick: "t", outcome: "stomped", nowIso: T0 })); s = v(R.undoLastTrick(s)); expect(s.tricks).toHaveLength(0); expect(s.completedHits).toBe(0); });
  it("undo empty", () => expect(R.undoLastTrick(active()).ok).toBe(false));
  it("summary", () => { let s = v(R.logTrick(active(), { trick: "a", outcome: "stomped", nowIso: T0 })); s = v(R.logTrick(s, { trick: "b", outcome: "washed_out", nowIso: T0 })); const m = R.rideSummary(s); expect(m).toMatchObject({ total: 2, stomped: 1, washedOut: 1, landRate: 0.5, hitsPlanned: 3 }); });
  it("summary empty", () => expect(R.rideSummary(R.newRideSession("s", "P")).landRate).toBe(0));
});

describe("stash markers", () => {
  it("marks private stash", () => expect(v(R.markStash(active(), { id: "st", label: "Snack", zoneLabel: "Lift 2 base", nowIso: T0 })).stashes[0]!.private).toBe(true));
  it("rejects raw coordinates", () => expect(R.markStash(active(), { id: "st", label: "x", zoneLabel: "40.71234, -74.00601", nowIso: T0 }).ok).toBe(false));
  it("duplicate stash", () => { const s = v(R.markStash(active(), { id: "st", label: "x", zoneLabel: "z", nowIso: T0 })); expect(R.markStash(s, { id: "st", label: "x", zoneLabel: "z", nowIso: T0 }).ok).toBe(false); });
  it("allowed when paused, not idle/ended", () => { expect(R.markStash(v(R.pauseRide(active(), T1)), { id: "a", label: "x", zoneLabel: "z", nowIso: T1 }).ok).toBe(true); expect(R.markStash(R.newRideSession("s", "P"), { id: "a", label: "x", zoneLabel: "z", nowIso: T1 }).ok).toBe(false); });
});

describe("persistence", () => {
  it("serialize roundtrip", () => { const s = v(R.logTrick(active(), { trick: "a", outcome: "stomped", nowIso: T0 })); expect(v(R.deserializeRide(R.serializeRide(s)))).toEqual(s); });
  it.each(["not json", "{}", '{"id":"x","tricks":[],"phase":"flying"}', "null"])("bad json %s", (j) => expect(R.deserializeRide(j).ok).toBe(false));
  it("json store save/load", () => { const st = new LocalJsonStore(); st.save("ride:s1", active(), T0); expect(st.load<R.RideSession>("ride:s1")?.phase).toBe("active"); });
  it("missing key undefined", () => expect(new LocalJsonStore().load("nope")).toBeUndefined());
  it("corrupt value undefined", () => { const b = createMemoryBackend(); b.set("stomp:k", "{{"); expect(new LocalJsonStore(b).load("k")).toBeUndefined(); });
  it("schema mismatch undefined", () => { const b = createMemoryBackend(); b.set("stomp:k", JSON.stringify({ v: 99, data: 1 })); expect(new LocalJsonStore(b).load("k")).toBeUndefined(); });
  it("namespaces isolated", () => { const b = createMemoryBackend(); new LocalJsonStore(b, "a").save("k", 1, T0); expect(new LocalJsonStore(b, "b").load("k")).toBeUndefined(); expect(new LocalJsonStore(b, "a").listKeys()).toEqual(["k"]); });
  it("remove", () => { const s = new LocalJsonStore(); s.save("k", 1, T0); s.remove("k"); expect(s.load("k")).toBeUndefined(); });
  it("export/import offline backup", () => { const a = new LocalJsonStore(); a.save("x", { n: 1 }, T0); a.save("y", [2], T0); const b = new LocalJsonStore(); expect(b.importAll(a.exportAll())).toBe(2); expect(b.load("x")).toEqual({ n: 1 }); });
  it("import skips bad versions", () => expect(new LocalJsonStore().importAll(JSON.stringify({ a: { v: 2, data: 1 } }))).toBe(0));
});
