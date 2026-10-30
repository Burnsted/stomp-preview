import { describe, expect, it } from "vitest";
import { ride as R, saveRide, loadRide, saveRuns, loadRuns, runFromGbSession, RIDE_KEY, RUNS_KEY } from "@/lib/stomp/woz-bridge/ride";
import { createWozStore, createMemoryBackend, localStorageBackend, LocalJsonStore, WOZ_NS } from "@/lib/stomp/woz-bridge/persistence";
import { SESSIONS } from "@/lib/stomp/sessions";

const T = "2026-10-29T12:00:00.000Z";
const store = () => createWozStore(createMemoryBackend());
const must = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => { if (!r.ok) throw new Error(r.error); return r.value; };

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return { get length() { return m.size; }, clear: () => m.clear(), getItem: (k) => m.get(k) ?? null, key: (i) => [...m.keys()][i] ?? null, removeItem: (k) => void m.delete(k), setItem: (k, v) => void m.set(k, String(v)) };
}

describe("persistence backend", () => {
  it("memory fallback when no storage", () => { const b = localStorageBackend(undefined); b.set("a", "1"); expect(b.get("a")).toBe("1"); });
  it("localStorage backend round-trip", () => { const ls = fakeStorage(); const b = localStorageBackend(ls); b.set("k", "v"); expect(ls.getItem("k")).toBe("v"); expect(b.keys()).toEqual(["k"]); b.delete("k"); expect(b.get("k")).toBeUndefined(); });
  it("quota errors are swallowed", () => { const ls = fakeStorage(); ls.setItem = () => { throw new Error("QuotaExceeded"); }; expect(() => localStorageBackend(ls).set("a", "b")).not.toThrow(); });
  it("namespaced under stomp-woz", () => { const ls = fakeStorage(); createWozStore(localStorageBackend(ls)).save("x", 1, T); expect(ls.key(0)).toBe(`${WOZ_NS}:x`); });
  it("does not collide with GB persist key", () => { const ls = fakeStorage(); ls.setItem("stomp", "GB"); const s = createWozStore(localStorageBackend(ls)); s.save("x", 1, T); expect(ls.getItem("stomp")).toBe("GB"); expect(s.listKeys()).toEqual(["x"]); });
  it("corrupt JSON loads undefined", () => { const b = createMemoryBackend(); b.set(`${WOZ_NS}:x`, "{nope"); expect(new LocalJsonStore(b, WOZ_NS).load("x")).toBeUndefined(); });
  it("wrong schema version loads undefined", () => { const b = createMemoryBackend(); b.set(`${WOZ_NS}:x`, JSON.stringify({ v: 99, data: 1 })); expect(new LocalJsonStore(b, WOZ_NS).load("x")).toBeUndefined(); });
  it("export/import round-trip", () => { const a = store(); a.save("x", { n: 1 }, T); const b = store(); expect(b.importAll(a.exportAll())).toBe(1); expect(b.load("x")).toEqual({ n: 1 }); });
});

describe("ride persistence", () => {
  it("round-trips an active ride", () => { const s = store(); const r = must(R.startRide(R.newRideSession("r1", "Park"), T)); saveRide(s, r, T); expect(loadRide(s)).toEqual(r); });
  it("returns null when empty", () => expect(loadRide(store())).toBeNull());
  it("returns null on corrupt ride JSON", () => { const s = store(); s.save(RIDE_KEY, "{bad", T); expect(loadRide(s)).toBeNull(); });
  it("returns null on non-string payload", () => { const s = store(); s.save(RIDE_KEY, 42, T); expect(loadRide(s)).toBeNull(); });
  it("persists tricks + stashes", () => {
    const s = store(); let r = must(R.startRide(R.newRideSession("r1", "Park"), T));
    r = must(R.logTrick(r, { trick: "50-50", outcome: "stomped", nowIso: T })); r = must(R.markStash(r, { id: "s1", label: "Tree", zoneLabel: "Park", nowIso: T }));
    saveRide(s, r, T); const back = loadRide(s)!; expect(back.tricks).toHaveLength(1); expect(back.stashes[0]!.private).toBe(true);
  });
  it("stash has no coordinates", () => { const r = must(R.markStash(must(R.startRide(R.newRideSession("r", "P"), T)), { id: "s", label: "L", zoneLabel: "P", nowIso: T })); expect(Object.keys(r.stashes[0]!)).not.toContain("lat"); });
  it("runs round-trip", () => { const s = store(); const run = must(R.createRun("a", "Line")); saveRuns(s, [run], T); expect(loadRuns(s)).toEqual([run]); });
  it("loadRuns drops junk entries", () => { const s = store(); s.save(RUNS_KEY, [{ id: "a", name: "x", hits: [] }, null, { bad: 1 }, "x"], T); expect(loadRuns(s)).toHaveLength(1); });
  it("loadRuns non-array → []", () => { const s = store(); s.save(RUNS_KEY, { x: 1 }, T); expect(loadRuns(s)).toEqual([]); });
});

describe("run builder", () => {
  it("rejects empty name", () => expect(R.createRun("a", "  ").ok).toBe(false));
  it("adds hits in order", () => { let r = must(R.createRun("a", "L")); r = must(R.addHit(r, { id: "h1", feature: "jump", label: "Kicker" })); r = must(R.addHit(r, { id: "h2", feature: "rail", label: "Rail" })); expect(r.hits.map((h) => h.id)).toEqual(["h1", "h2"]); });
  it("rejects duplicate hit ids", () => { const r = must(R.addHit(must(R.createRun("a", "L")), { id: "h", feature: "jump", label: "K" })); expect(R.addHit(r, { id: "h", feature: "box", label: "B" }).ok).toBe(false); });
  it("caps hits at MAX_HITS", () => { let r = must(R.createRun("a", "L")); for (let i = 0; i < R.MAX_HITS; i++) r = must(R.addHit(r, { id: `h${i}`, feature: "jib", label: "J" })); expect(R.addHit(r, { id: "x", feature: "jib", label: "J" }).ok).toBe(false); });
  it("moveHit out of range errors", () => expect(R.moveHit(must(R.createRun("a", "L")), 0, 3).ok).toBe(false));
  it("removeHit unknown errors", () => expect(R.removeHit(must(R.createRun("a", "L")), "zz").ok).toBe(false));
  it("runFromGbSession maps every GB template", () => { for (const t of SESSIONS) { const r = runFromGbSession(t); expect(r.name).toBe(t.name); expect(r.hits.length).toBe(Math.min(t.steps.length, R.MAX_HITS)); } });
  it("runFromGbSession labels from step titles", () => expect(runFromGbSession(SESSIONS[0]!).hits[0]!.label).toBe(SESSIONS[0]!.steps[0]!.title));
  it("runFromGbSession handles missing steps", () => expect(runFromGbSession({ id: "x", name: "X" }).hits).toEqual([]));
  it("runFromGbSession caps long templates", () => expect(runFromGbSession({ id: "x", name: "X", steps: Array.from({ length: 30 }, (_, i) => ({ id: `${i}`, title: "t" })) }).hits).toHaveLength(R.MAX_HITS));
});

describe("ride state machine", () => {
  const fresh = () => R.newRideSession("r", "P");
  it("idle cannot pause", () => expect(R.pauseRide(fresh(), T).ok).toBe(false));
  it("idle cannot log trick", () => expect(R.logTrick(fresh(), { trick: "t", outcome: "stomped", nowIso: T }).ok).toBe(false));
  it("active → paused → active → ended", () => { let r = must(R.startRide(fresh(), T)); r = must(R.pauseRide(r, T)); r = must(R.resumeRide(r, T)); r = must(R.endRide(r, T)); expect(r.phase).toBe("ended"); });
  it("ended cannot restart", () => expect(R.startRide(must(R.endRide(must(R.startRide(fresh(), T)), T)), T).ok).toBe(false));
  it("undo with no tricks errors", () => expect(R.undoLastTrick(must(R.startRide(fresh(), T))).ok).toBe(false));
  it("advanceHit moves through run", () => { const run = must(R.addHit(must(R.createRun("a", "L")), { id: "h", feature: "jump", label: "K" })); let r = must(R.startRide(R.newRideSession("r", "P", run), T)); r = must(R.logTrick(r, { trick: "t", outcome: "stomped", nowIso: T, advanceHit: true })); expect(R.nextHit(run, r.completedHits)).toBeNull(); });
  it("summary counts", () => { let r = must(R.startRide(fresh(), T)); r = must(R.logTrick(r, { trick: "a", outcome: "stomped", nowIso: T })); r = must(R.logTrick(r, { trick: "b", outcome: "washed_out", nowIso: T })); const s = R.rideSummary(r); expect([s.stomped, s.washedOut, s.landRate]).toEqual([1, 1, 0.5]); });
});
