// @vitest-environment jsdom
// Woz Path1 batch4: hardened device persistence (private mode / refresh), local export/import,
// clear-all confirm word, a11y (tabs, labels, focus on Back), GB screen round-trip smoke,
// Unlink↔Invite thin adapter, and invite-mirror re-render discipline.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { useStomp, type Screen } from "@/lib/stomp/store";
import { useWoz, setWozBacking, getWozBacking, WOZ_TABS, getOpenerTestId } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend, localStorageBackend, safeLocalStorage, onStorageError, WOZ_NS } from "@/lib/stomp/woz-bridge/persistence";
import { exportDump, importDump, DUMP_FORMAT, DUMP_MAX_BYTES, DUMP_KEYS, CLEAR_CONFIRM_WORD, IMPORT_MSG } from "@/lib/stomp/woz-bridge/dump";
import { createMirrorEventHub, createMirrorInviteUnlinkAdapter, createMirrorInvitePort } from "@/lib/stomp/woz-bridge/invite-adapter";
import { startInviteMirror, type InviteEvent } from "@/lib/stomp/woz-bridge/invite-mirror";
import { gbInviteAdapter, gbInviteHub, startGbInviteMirror } from "@/lib/stomp/woz-bridge/invite-mirror-gb";
import { GB_CREW_ID, sid, snapshotFromGb } from "@/lib/stomp/woz-bridge/crew";
import { STORAGE_MSG } from "@/lib/stomp/woz-bridge/copy";

const crew = [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }];
const T = "2026-10-29T12:00:00.000Z";
beforeEach(() => {
  localStorage.clear();
  setWozBacking(createWozStore(createMemoryBackend()));
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: structuredClone(crew), riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };

/** Storage stub whose methods can be made to throw (Safari private / quota / disabled). */
function flakyStorage(o: { get?: boolean; set?: boolean; del?: boolean; keys?: boolean } = {}): Storage {
  const m = new Map<string, string>();
  return {
    get length() { if (o.keys) throw new Error("SecurityError"); return m.size; },
    key: (i) => { if (o.keys) throw new Error("SecurityError"); return [...m.keys()][i] ?? null; },
    getItem: (k) => { if (o.get) throw new Error("SecurityError"); return m.get(k) ?? null; },
    setItem: (k, v) => { if (o.set) throw new DOMException("quota", "QuotaExceededError"); m.set(k, v); },
    removeItem: (k) => { if (o.del) throw new Error("SecurityError"); m.delete(k); },
    clear: () => m.clear(),
  };
}

describe("device persistence hardening", () => {
  it("safeLocalStorage returns storage in jsdom", () => { expect(safeLocalStorage()).toBe(window.localStorage); });
  it("safeLocalStorage returns undefined and reports when access throws", () => {
    const errs: string[] = []; const off = onStorageError((op) => errs.push(op));
    const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("SecurityError"); });
    expect(safeLocalStorage()).toBeUndefined(); expect(errs).toContain("open"); spy.mockRestore(); off();
  });
  it("blocked storage falls back to memory backend", () => {
    const spy = vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("blocked"); });
    const b = localStorageBackend(); b.set("x", "1"); expect(b.get("x")).toBe("1"); spy.mockRestore();
  });
  it("failed writes stay readable in-session via overlay", () => {
    const b = localStorageBackend(flakyStorage({ set: true })); b.set("k", "v"); expect(b.get("k")).toBe("v"); expect(b.keys()).toContain("k");
  });
  it("failed deletes are tombstoned in-session", () => {
    const ls = flakyStorage(); ls.setItem("k", "v"); const b = localStorageBackend(ls); ls.removeItem = () => { throw new Error("x"); };
    b.delete("k"); expect(b.get("k")).toBeUndefined(); expect(b.keys()).not.toContain("k");
  });
  it("throwing getItem reads as missing, never crashes", () => { const b = localStorageBackend(flakyStorage({ get: true })); expect(b.get("k")).toBeUndefined(); });
  it("throwing key enumeration yields overlay keys only", () => { const b = localStorageBackend(flakyStorage({ keys: true, set: true })); b.set("a", "1"); expect(b.keys()).toEqual(["a"]); });
  it("successful writes clear the overlay so real storage is source of truth", () => {
    const ls = flakyStorage(); const b = localStorageBackend(ls); b.set("k", "v"); ls.setItem("k", "w"); expect(b.get("k")).toBe("w");
  });
  it("private-mode quota error flags storageOk=false + banner, state kept", () => {
    setWozBacking(createWozStore(localStorageBackend(flakyStorage({ set: true }))));
    useWoz.getState().markUnlinked(sid("AAA111"));
    expect(useWoz.getState().storageOk).toBe(false); expect(useWoz.getState().lastError).toBe(STORAGE_MSG);
    expect(useWoz.getState().unlinked).toEqual([sid("AAA111")]);
    useWoz.getState().hydrate(); expect(useWoz.getState().unlinked).toEqual([sid("AAA111")]);
  });
  it("refresh round-trip through real localStorage keeps unlink + tab + privacy", () => {
    setWozBacking(createWozStore(localStorageBackend(window.localStorage)));
    const s = useWoz.getState(); s.markUnlinked(sid("BBB222")); s.setTab("ride"); s.setPrivacy({ ...s.privacy, showTrickStats: false });
    expect(Object.keys(localStorage).filter((k) => k.startsWith(`${WOZ_NS}:`)).sort()).toEqual([`${WOZ_NS}:crew.privacy`, `${WOZ_NS}:crew.unlinked`, `${WOZ_NS}:ui.tab`]);
    useWoz.setState({ unlinked: [], tab: "crew" }); setWozBacking(createWozStore(localStorageBackend(window.localStorage))); useWoz.getState().hydrate();
    expect(useWoz.getState().unlinked).toEqual([sid("BBB222")]); expect(useWoz.getState().tab).toBe("ride"); expect(useWoz.getState().privacy.showTrickStats).toBe(false);
  });
  it("hydrate sets hydrated flag; setWozBacking resets it", () => {
    useWoz.getState().hydrate(); expect(useWoz.getState().hydrated).toBe(true);
    setWozBacking(createWozStore(createMemoryBackend())); expect(useWoz.getState().hydrated).toBe(false);
  });
  it("garbage values in storage do not crash hydrate", () => {
    const b = createMemoryBackend(); for (const k of DUMP_KEYS) b.set(`${WOZ_NS}:${k}`, "{not json"); setWozBacking(createWozStore(b));
    expect(() => useWoz.getState().hydrate()).not.toThrow(); expect(useWoz.getState().unlinked).toEqual([]);
  });
});

describe("export / import dump (local only)", () => {
  const seed = () => { const s = useWoz.getState(); s.markUnlinked(sid("AAA111")); s.setTab("smartid"); };
  it("export has format/version and only Woz allowlisted keys", () => {
    seed(); const d = JSON.parse(useWoz.getState().exportData());
    expect(d.format).toBe(DUMP_FORMAT); expect(d.version).toBe(1);
    expect(Object.keys(d.entries).sort()).toEqual(["crew.unlinked", "ui.tab"]);
  });
  it("export never includes GB stomp-line data", () => {
    localStorage.setItem("stomp-line", JSON.stringify({ state: { crew } })); seed();
    expect(useWoz.getState().exportData()).not.toContain("stomp-line");
  });
  it("export drops non-allowlisted keys stored in the namespace", () => {
    getWozBacking().save("evil.key", { x: 1 }, T); expect(useWoz.getState().exportData()).not.toContain("evil.key");
  });
  it("round trip: export → clear → import restores state", () => {
    seed(); const dump = useWoz.getState().exportData();
    expect(useWoz.getState().clearAllConfirmed(CLEAR_CONFIRM_WORD)).toBe(true); expect(useWoz.getState().unlinked).toEqual([]);
    const r = useWoz.getState().importData(dump); expect(r).toMatchObject({ ok: true, imported: 2 });
    expect(useWoz.getState().unlinked).toEqual([sid("AAA111")]); expect(useWoz.getState().tab).toBe("smartid");
  });
  it("import into a different phone (fresh backing)", () => {
    seed(); const dump = useWoz.getState().exportData(); setWozBacking(createWozStore(createMemoryBackend())); useWoz.getState().resetAll();
    useWoz.getState().importData(dump); expect(useWoz.getState().unlinked).toEqual([sid("AAA111")]);
  });
  for (const [label, text, err] of [["empty", "  ", "empty"], ["bad json", "{x", "bad_json"], ["wrong format", JSON.stringify({ format: "x", version: 1, entries: {} }), "bad_format"],
    ["array entries", JSON.stringify({ format: DUMP_FORMAT, version: 1, entries: [] }), "bad_format"], ["future version", JSON.stringify({ format: DUMP_FORMAT, version: 9, entries: {} }), "bad_version"],
    ["null", "null", "bad_format"]] as const) {
    it(`rejects ${label} without wiping existing data`, () => {
      seed(); const r = useWoz.getState().importData(text); expect(r).toEqual({ ok: false, error: err });
      expect(useWoz.getState().unlinked).toEqual([sid("AAA111")]); expect(useWoz.getState().lastError).toBe(IMPORT_MSG[err]);
    });
  }
  it("rejects oversized dump", () => { expect(importDump(getWozBacking(), "x".repeat(DUMP_MAX_BYTES + 1))).toEqual({ ok: false, error: "too_large" }); });
  it("skips unknown keys and bad envelopes", () => {
    const r = importDump(getWozBacking(), JSON.stringify({ format: DUMP_FORMAT, version: 1, entries: { "crew.unlinked": { v: 1, savedAtIso: T, data: ["stomper_X"] }, "gb.crew": { v: 1, data: [] }, "ui.tab": { v: 2, data: "ride" }, "ride.runs": "nope" } }));
    expect(r).toEqual({ ok: true, imported: 1, skipped: ["gb.crew", "ui.tab", "ride.runs"] });
  });
  it("import keeps the Back target", () => { useWoz.getState().openFrom("crew", "stompers"); seed(); const d = useWoz.getState().exportData(); useWoz.getState().importData(d); expect(useWoz.getState().returnTo).toBe("stompers"); });
  it("import with corrupt payload data is sanitized by hydrate", () => {
    const r = useWoz.getState().importData(JSON.stringify({ format: DUMP_FORMAT, version: 1, entries: { "crew.unlinked": { v: 1, savedAtIso: T, data: [1, "stomper_ok", null] }, "ui.tab": { v: 1, savedAtIso: T, data: "hack" } } }));
    expect(r.ok).toBe(true); expect(useWoz.getState().unlinked).toEqual(["stomper_ok"]); expect(useWoz.getState().tab).toBe("crew");
  });
  it("exportDump pure fn works on any store", () => { const s = createWozStore(createMemoryBackend()); s.save("ui.tab", "ride", T); expect(JSON.parse(exportDump(s, T)).exportedAtIso).toBe(T); });
});

describe("clear-all with confirm word", () => {
  it("wrong / lowercase word does nothing", () => {
    useWoz.getState().markUnlinked(sid("AAA111"));
    for (const w of ["", "clear", "CLEAR ", "DELETE"]) expect(useWoz.getState().clearAllConfirmed(w)).toBe(false);
    expect(useWoz.getState().unlinked.length).toBe(1);
  });
  it("CLEAR wipes Woz keys only, GB crew untouched", () => {
    localStorage.setItem("stomp-line", "gb"); useWoz.getState().markUnlinked(sid("AAA111"));
    expect(useWoz.getState().clearAllConfirmed("CLEAR")).toBe(true);
    expect(getWozBacking().listKeys()).toEqual([]); expect(useStomp.getState().crew).toEqual(crew); expect(localStorage.getItem("stomp-line")).toBe("gb");
  });
  it("UI: Clear all disabled until CLEAR typed, then clears", () => {
    useWoz.getState().markUnlinked(sid("AAA111")); openTab("crew");
    const btn = screen.getByRole("button", { name: "Clear all Crew Tools data" }) as HTMLButtonElement; expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("clear confirm word"), { target: { value: "clear" } }); expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("clear confirm word"), { target: { value: "CLEAR" } }); expect(btn.disabled).toBe(false);
    fireEvent.click(btn); expect(useWoz.getState().unlinked).toEqual([]); expect(screen.getByTestId("data-msg").textContent).toMatch(/cleared/);
    expect(screen.getAllByTestId("crew-row").length).toBe(3);
  });
  it("UI: export then import round trip", () => {
    useWoz.getState().markUnlinked(sid("AAA111")); openTab("crew");
    fireEvent.click(screen.getByRole("button", { name: "Export Crew Tools data" }));
    const dump = (screen.getByLabelText("exported data") as HTMLTextAreaElement).value; expect(dump).toContain(DUMP_FORMAT);
    act(() => { useWoz.getState().clearAllConfirmed("CLEAR"); });
    fireEvent.change(screen.getByLabelText("import data"), { target: { value: dump } });
    fireEvent.click(screen.getByRole("button", { name: "Import Crew Tools data" }));
    expect(screen.getByTestId("data-msg").textContent).toMatch(/Imported \d+ item/); expect(screen.getAllByTestId("crew-row").length).toBe(2);
  });
  it("UI: bad import shows friendly alert", () => {
    openTab("crew"); fireEvent.change(screen.getByLabelText("import data"), { target: { value: "garbage" } });
    fireEvent.click(screen.getByRole("button", { name: "Import Crew Tools data" })); expect(screen.getByRole("alert").textContent).toContain(IMPORT_MSG.bad_json);
  });
  it("UI: storage warning visible when storage failing", () => { openTab("crew"); act(() => useWoz.setState({ storageOk: false })); expect(screen.getByTestId("storage-warn")).toBeTruthy(); });
});

describe("accessibility", () => {
  it("tablist is labelled and tabs control the panel", () => {
    openTab("crew"); const list = screen.getByRole("tablist", { name: "Crew Tools sections" });
    const tabs = within(list).getAllByRole("tab"); expect(tabs.length).toBe(WOZ_TABS.length);
    for (const t of tabs) expect(t.getAttribute("aria-controls")).toBe("woz-panel");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("woz-tab-crew");
  });
  it("roving tabindex: only selected tab is in tab order", () => {
    openTab("ride"); const tabs = screen.getAllByRole("tab");
    expect(tabs.filter((t) => t.tabIndex === 0).map((t) => t.textContent)).toEqual(["Ride"]);
  });
  it("ArrowRight/ArrowLeft/Home/End move between tabs and focus", () => {
    openTab("crew"); const first = screen.getByRole("tab", { name: "Crew" });
    fireEvent.keyDown(first, { key: "ArrowRight" }); expect(useWoz.getState().tab).toBe("session"); expect(document.activeElement?.id).toBe("woz-tab-session");
    fireEvent.keyDown(document.activeElement!, { key: "End" }); expect(useWoz.getState().tab).toBe("smartid");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" }); expect(useWoz.getState().tab).toBe("crew");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" }); expect(useWoz.getState().tab).toBe("smartid");
    fireEvent.keyDown(document.activeElement!, { key: "Home" }); expect(useWoz.getState().tab).toBe("crew");
    fireEvent.keyDown(document.activeElement!, { key: "a" }); expect(useWoz.getState().tab).toBe("crew");
  });
  it("heading receives focus on open", () => { openTab("crew"); expect(document.activeElement?.id).toBe("woz-title"); });
  it("crew row actions have per-member accessible names", () => {
    openTab("crew"); expect(screen.getByRole("button", { name: "Unlink Ria" })).toBeTruthy(); expect(screen.getByRole("button", { name: "Make Jax owner" })).toBeTruthy();
  });
  it("Back button has accessible name", () => { useWoz.getState().openFrom("crew", "log"); useStomp.setState({ screen: "woz" }); render(<StompApp />); expect(screen.getByRole("button", { name: "Back to previous screen" })).toBeTruthy(); });
  it("quick phrase chips are a labelled group of keyboard-reachable buttons", () => {
    openTab("session"); const g = screen.getByRole("group", { name: "quick phrases" });
    const chips = within(g).getAllByRole("button"); expect(chips.length).toBeGreaterThan(3);
    for (const c of chips) { expect(c.tagName).toBe("BUTTON"); expect(c.tabIndex).toBe(0); expect((c as HTMLButtonElement).disabled).toBe(false); }
  });
  it("Back restores focus to the opener entry", async () => {
    vi.useFakeTimers();
    useStomp.setState({ screen: "stompers" }); render(<StompApp />);
    const entry = screen.getByTestId("woz-entry-campfire"); entry.focus(); fireEvent.click(entry);
    expect(getOpenerTestId()).toBe("woz-entry-campfire");
    fireEvent.click(screen.getByTestId("woz-back")); act(() => { vi.runAllTimers(); });
    expect((document.activeElement as HTMLElement).dataset.testid).toBe("woz-entry-campfire"); vi.useRealTimers();
  });
  it("Back falls back to chrome Crew tools link when opener absent", () => {
    vi.useFakeTimers(); useStomp.setState({ screen: "log" }); render(<StompApp />);
    fireEvent.click(screen.getByTestId("chrome-crew-tools")); fireEvent.click(screen.getByTestId("woz-back")); act(() => { vi.runAllTimers(); });
    expect((document.activeElement as HTMLElement).dataset.testid).toBe("chrome-crew-tools"); vi.useRealTimers();
  });
  it("data panel controls all have accessible names", () => {
    openTab("crew"); for (const n of ["Export Crew Tools data", "Import Crew Tools data", "Clear all Crew Tools data"]) expect(screen.getByRole("button", { name: n })).toBeTruthy();
    expect(screen.getByLabelText("import data")).toBeTruthy(); expect(screen.getByLabelText("clear confirm word")).toBeTruthy();
  });
});

describe("GB screen regression round trip", () => {
  const ROUTE: Screen[] = ["home", "run", "park", "session", "stompers", "log", "guide", "stash", "playlist", "goals"];
  it("Home→Run→Park→Session→Stompers→More (log/guide/stash/playlist)→Crew Tools renders each without errors", () => {
    const errs: unknown[] = []; vi.spyOn(console, "error").mockImplementation((e) => { errs.push(e); });
    render(<StompApp />);
    for (const s of ROUTE) { act(() => useStomp.setState({ screen: s })); expect(document.body.textContent!.length).toBeGreaterThan(20); expect(screen.queryByTestId("woz-lab")).toBeNull(); }
    act(() => { useWoz.getState().openFrom("crew", "goals"); useStomp.setState({ screen: "woz" }); });
    expect(screen.getByTestId("woz-lab")).toBeTruthy();
    fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("goals");
    expect(errs).toEqual([]);
  });
  for (const [from, entry] of [["run", "woz-entry-ride"], ["session", "woz-entry-session"], ["stompers", "woz-entry-crew"], ["park", "chrome-crew-tools"], ["log", "chrome-crew-tools"], ["playlist", "chrome-crew-tools"]] as const) {
    it(`${from} → Crew Tools (${entry}) → Back returns intact`, () => {
      useStomp.setState({ screen: from }); render(<StompApp />); const before = document.body.textContent;
      fireEvent.click(screen.getByTestId(entry)); expect(useStomp.getState().screen).toBe("woz");
      fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe(from); expect(document.body.textContent).toBe(before);
    });
  }
  it("full loop through every Crew Tools tab and back leaves GB crew + rider unchanged", () => {
    useStomp.setState({ screen: "stompers" }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-crew"));
    for (const t of WOZ_TABS) fireEvent.click(screen.getByRole("tab", { name: t.label }));
    fireEvent.click(screen.getByTestId("woz-back"));
    expect(useStomp.getState().crew).toEqual(crew); expect(useStomp.getState().riderName).toBe("Ted");
  });
  it("greet.tsx Invite source unchanged (sha256 pin)", () => {
    const h = createHash("sha256").update(readFileSync(`${process.cwd()}/src/components/stomp/greet.tsx`)).digest("hex");
    expect(h).toBe("0811babf8c7139a86738e2bd677db8544f09672b83a8fad345075f8bfb996fc2");
  });
});

describe("Unlink ↔ Invite thin adapter", () => {
  const ev = (kind: "accepted" | "revoked", code: string): InviteEvent => ({ kind, code, name: code, atIso: T });
  it("port is GB-owned, read-only and has no pending invites", () => {
    const p = createMirrorInvitePort(createMirrorEventHub()); expect(p.source).toBe("src/components/stomp/greet.tsx"); expect(p.listInvitations(GB_CREW_ID)).toEqual([]);
  });
  it("onMembershipAccepted fires only for accepts, with GB crew id + stomper id", () => {
    const hub = createMirrorEventHub(); const got: string[] = [];
    const off = createMirrorInvitePort(hub).onMembershipAccepted!((c, s) => got.push(`${c}/${s}`));
    hub.publish([ev("accepted", "CCC333"), ev("revoked", "AAA111")]); off(); hub.publish([ev("accepted", "DDD444")]);
    expect(got).toEqual([`${GB_CREW_ID}/stomper_CCC333`]);
  });
  it("hub ignores empty publishes", () => { const hub = createMirrorEventHub(); const fn = vi.fn(); hub.subscribe(fn); hub.publish([]); expect(fn).not.toHaveBeenCalled(); });
  it("adapter records unlink + transfer intents (capped at 50)", () => {
    const a = createMirrorInviteUnlinkAdapter(createMirrorEventHub()); expect(a.inviteOwner).toBe("Grok Build"); expect(a.invitePresent).toBe(true);
    for (let i = 0; i < 55; i++) a.local.onMemberUnlinked(GB_CREW_ID, sid(`X${i}`));
    a.local.onOwnerTransferred(GB_CREW_ID, sid("ME"), sid("X1")); expect(a.intents().length).toBe(50); expect(a.intents().at(-1)!.kind).toBe("owner_transferred");
  });
  it("pendingInvitesFor filters pending for crew", () => {
    const a = createMirrorInviteUnlinkAdapter(createMirrorEventHub());
    const snap = { ...snapshotFromGb({ riderCode: "ME", riderName: "Ted", crew, nowIso: T }), invitations: [{ id: "i1", crewId: GB_CREW_ID, fromStomperId: sid("ME"), toDisplayLabel: "x", status: "pending", createdAtIso: T }, { id: "i2", crewId: GB_CREW_ID, fromStomperId: sid("ME"), toDisplayLabel: "y", status: "accepted", createdAtIso: T }] } as never;
    expect(a.pendingInvitesFor(snap, GB_CREW_ID).map((i) => i.id)).toEqual(["i1"]);
  });
  it("UI unlink confirm notifies the shared GB adapter", () => {
    const n = gbInviteAdapter.intents().length; openTab("crew");
    fireEvent.click(screen.getByRole("button", { name: "Unlink Ria" })); fireEvent.change(screen.getByLabelText("confirm phrase"), { target: { value: "UNLINK" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(gbInviteAdapter.intents().length).toBe(n + 1); expect(gbInviteAdapter.intents().at(-1)).toEqual({ kind: "unlinked", crewId: GB_CREW_ID, stomperId: sid("AAA111") });
  });
  it("GB accept via real store publishes to hub after mirror start", () => {
    const got: InviteEvent[][] = []; const off = gbInviteHub.subscribe((e) => got.push([...e])); const stop = startGbInviteMirror();
    act(() => useStomp.setState({ crew: [...useStomp.getState().crew, { code: "ZZZ999", name: "Zed" }] }));
    stop(); off(); expect(got.flat().map((e) => e.code)).toContain("ZZZ999");
  });
});

describe("invite mirror re-render discipline", () => {
  it("unrelated GB store updates do not emit events or touch Woz state", () => {
    const sink = vi.fn(); const stop = startInviteMirror(useStomp, { onInviteEvents: sink }, undefined);
    const before = useWoz.getState();
    for (let i = 0; i < 20; i++) useStomp.setState({ running: i % 2 === 0 });
    stop(); expect(sink).not.toHaveBeenCalled(); expect(useWoz.getState()).toBe(before);
  });
  it("same-content crew reassign emits nothing", () => {
    const sink = vi.fn(); const stop = startInviteMirror(useStomp, { onInviteEvents: sink }, undefined);
    useStomp.setState({ crew: structuredClone(useStomp.getState().crew) }); stop(); expect(sink).not.toHaveBeenCalled();
  });
  it("onInviteEvents with no events is a no-op (no state change)", () => { const s = useWoz.getState(); s.onInviteEvents([], crew); expect(useWoz.getState()).toBe(s); });
  it("InviteActivity/Crew panel do not re-render on unrelated Woz updates", () => {
    openTab("crew"); let renders = 0;
    const unsub = useWoz.subscribe((s, p) => { if (s.inviteLog !== p.inviteLog || s.unlinked !== p.unlinked) renders++; });
    act(() => { useWoz.getState().say("you", "hi"); useWoz.getState().setRouter({ pending: null }); useWoz.getState().setCampfireOpen(true); });
    unsub(); expect(renders).toBe(0); expect(screen.getAllByTestId("crew-row").length).toBe(3);
  });
  it("WozLab mount does not re-hydrate when already hydrated", () => {
    useWoz.getState().hydrate(); const spy = vi.spyOn(getWozBacking(), "load"); openTab("crew"); expect(spy).not.toHaveBeenCalled();
  });
  it("mirror start skips hydrate when already hydrated", () => {
    useWoz.getState().hydrate(); const spy = vi.spyOn(getWozBacking(), "load"); const stop = startGbInviteMirror(); stop(); expect(spy).not.toHaveBeenCalled();
  });
});
