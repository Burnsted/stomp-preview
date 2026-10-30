// @vitest-environment jsdom
// Woz Path1 batch6: More-screen polish (Airtime/Stash/Playlist/Line/Park/Tricks), coordinate-free
// saved data, profile privacy + reset hygiene, shared ConfirmBar (Esc cancels, Yes/Keep wording).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { ConfirmBar } from "@/components/stomp/confirm-bar";
import { useStomp, type Screen } from "@/lib/stomp/store";
import { useWoz, setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { exportDump } from "@/lib/stomp/woz-bridge/dump";
import {
  AIRTIME_EMPTY, STASH_EMPTY, STASH_COORDS_MSG, STASH_NAME_NEEDED, PLAYLIST_EMPTY, PARK_LOCKED, MORE_DEMO_LABEL,
  containsCoordinates, checkStash, findCoordinatePaths,
} from "@/lib/stomp/woz-bridge/more-copy";
import { tricksFor } from "@/lib/stomp/library";
import { DEMO_LABEL } from "@/lib/stomp/woz-bridge/copy";

let store = createWozStore(createMemoryBackend());
beforeEach(() => {
  localStorage.clear();
  store = createWozStore(createMemoryBackend());
  setWozBacking(store);
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: [{ code: "AAA111", name: "Ria" }], riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [], landings: [], callouts: [], stomped: [] });
});
afterEach(() => cleanup());
const show = async (s: Screen) => { render(<StompApp />); await act(async () => { await Promise.resolve(); }); act(() => useStomp.setState({ screen: s, stashes: useStomp.getState().stashes, landings: [], callouts: [], clips: [] })); };
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const btn = (name: string | RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("containsCoordinates", () => {
  const yes = ["44.2706, -71.3033", "44.2706,-71.3033", "lat: 44.27", "lng=-71.3", "geo:44.27,-71.30", "44° 16′ N", "latitude=12", "-33.8688 151.2093"];
  const no = ["", "North trees", "left of the cat-track, past the hit", "Lift 4 tower 12", "3.5 ft box", "Run 1, 2, 3", "12:30 meet", "1.5"];
  for (const t of yes) it(`flags ${JSON.stringify(t)}`, () => expect(containsCoordinates(t)).toBe(true));
  for (const t of no) it(`allows ${JSON.stringify(t)}`, () => expect(containsCoordinates(t)).toBe(false));
});

describe("checkStash", () => {
  it("needs a name", () => expect(checkStash("  ", "x")).toEqual({ ok: false, error: STASH_NAME_NEEDED }));
  it("rejects coordinates in name", () => expect(checkStash("44.2706, -71.3033", "")).toEqual({ ok: false, error: STASH_COORDS_MSG }));
  it("rejects coordinates in note", () => expect(checkStash("Trees", "geo:44.2,-71.3")).toEqual({ ok: false, error: STASH_COORDS_MSG }));
  it("trims good input", () => expect(checkStash("  Trees ", " left ")).toEqual({ ok: true, name: "Trees", note: "left" }));
  it("coords copy is plain language", () => expect(STASH_COORDS_MSG).toMatch(/describe the spot in words/));
});

describe("findCoordinatePaths", () => {
  it("clean object → []", () => expect(findCoordinatePaths({ a: "Trees", b: [1, { c: "x" }] })).toEqual([]));
  it("flags coord keys", () => expect(findCoordinatePaths({ spot: { lat: 1, lng: 2 } })).toEqual(["$.spot.lat", "$.spot.lng"]));
  it("flags coord strings in arrays", () => expect(findCoordinatePaths(["ok", "44.2706, -71.3033"])).toEqual(["$[1]"]));
  it("flags gps/location keys case-insensitively", () => expect(findCoordinatePaths({ GPS: true, Location: "x" }).length).toBe(2));
});

describe("GB store: stash pins never persist coordinates", () => {
  it("addStash rejects coordinate name", () => { useStomp.getState().addStash("44.2706, -71.3033", ""); expect(useStomp.getState().stashes).toHaveLength(0); });
  it("addStash rejects coordinate note", () => { useStomp.getState().addStash("Trees", "lat: 44.2"); expect(useStomp.getState().stashes).toHaveLength(0); });
  it("addStash keeps text pins", () => { useStomp.getState().addStash("Trees", "left of cat-track"); expect(useStomp.getState().stashes[0]).toMatchObject({ name: "Trees", note: "left of cat-track" }); });
  it("persisted GB state has no coordinate paths", () => { useStomp.getState().addStash("Trees", "left"); const raw = localStorage.getItem("stomp-line"); const st = raw ? JSON.parse(raw).state : useStomp.getState(); expect(findCoordinatePaths({ stashes: st.stashes })).toEqual([]); });
});

describe("Stash screen", () => {
  it("empty state + privacy note", async () => { await show("stash"); expect(screen.getByTestId("stash-empty").textContent).toBe(STASH_EMPTY); expect(screen.getByTestId("stash-privacy").textContent).toMatch(/no GPS/); });
  it("Drop the pin disabled until named", async () => { await show("stash"); expect(btn("Drop the pin").disabled).toBe(true); type("Stash name", "Trees"); expect(btn("Drop the pin").disabled).toBe(false); });
  it("coordinate input shows plain error, saves nothing", async () => { await show("stash"); type("Stash name", "44.2706, -71.3033"); fireEvent.click(btn("Drop the pin")); expect(screen.getByTestId("stash-error").textContent).toBe(STASH_COORDS_MSG); expect(useStomp.getState().stashes).toHaveLength(0); });
  it("error clears on edit", async () => { await show("stash"); type("Stash name", "lat: 4"); fireEvent.click(btn("Drop the pin")); type("Stash name", "Trees"); expect(screen.queryByTestId("stash-error")).toBeNull(); });
  it("valid pin saves and clears form", async () => { await show("stash"); type("Stash name", "Trees"); type("How to find it", "left"); fireEvent.click(btn("Drop the pin")); expect(useStomp.getState().stashes).toHaveLength(1); expect((screen.getByLabelText("Stash name") as HTMLInputElement).value).toBe(""); expect(screen.queryByTestId("stash-empty")).toBeNull(); });
  it("remove asks first; Keep pin keeps it", async () => { useStomp.getState().addStash("Trees", ""); await show("stash"); fireEvent.click(btn("Remove Trees")); expect(screen.getByTestId("stash-remove-confirm")).toBeTruthy(); fireEvent.click(btn("Keep pin")); expect(useStomp.getState().stashes).toHaveLength(1); expect(screen.queryByTestId("stash-remove-confirm")).toBeNull(); });
  it("remove Yes, remove deletes", async () => { useStomp.getState().addStash("Trees", ""); await show("stash"); fireEvent.click(btn("Remove Trees")); fireEvent.click(btn("Yes, remove")); expect(useStomp.getState().stashes).toHaveLength(0); });
  it("remove Esc keeps pin", async () => { useStomp.getState().addStash("Trees", ""); await show("stash"); fireEvent.click(btn("Remove Trees")); fireEvent.keyDown(screen.getByTestId("stash-remove-confirm"), { key: "Escape" }); expect(useStomp.getState().stashes).toHaveLength(1); expect(screen.queryByTestId("stash-remove-confirm")).toBeNull(); });
  it("remove confirm focuses Keep pin (safe default)", async () => { useStomp.getState().addStash("Trees", ""); await show("stash"); fireEvent.click(btn("Remove Trees")); expect(document.activeElement?.textContent).toBe("Keep pin"); });
});

describe("Airtime / Playlist / Line / Park / Tricks", () => {
  it("Airtime empty state", async () => { await show("log"); expect(screen.getByTestId("airtime-empty").textContent).toBe(AIRTIME_EMPTY); });
  it("Airtime with landings hides empty", async () => { await show("log"); act(() => useStomp.setState({ landings: [{ id: "l1", seconds: 1.2, at: Date.now(), label: "Kicker" }] as never })); expect(screen.queryByTestId("airtime-empty")).toBeNull(); });
  it("Playlist empty state", async () => { await show("playlist"); expect(screen.getByTestId("playlist-empty").textContent).toBe(PLAYLIST_EMPTY); });
  it("The line renders cues, no empty", async () => { await show("guide"); expect(screen.queryByTestId("line-empty")).toBeNull(); expect(btn("Ride it")).toBeTruthy(); });
  it("Park landed trick shows locked hint + disabled", async () => {
    await show("park"); act(() => useStomp.setState({ stomped: tricksFor(useStomp.getState().band).map((t) => t.id) }));
    expect(screen.getAllByTestId("park-locked")[0]!.textContent).toBe(PARK_LOCKED);
    expect((screen.getAllByRole("button", { name: "Landed" })[0] as HTMLButtonElement).disabled).toBe(true);
  });
  it("Park Mark landed moves trick out of the open list", async () => { await show("park"); const n = useStomp.getState().stomped.length; fireEvent.click(screen.getAllByRole("button", { name: "Mark landed" })[0]!); expect(useStomp.getState().stomped.length).toBe(n + 1); });
  it("Tricks screen has no empty state with library", async () => { await show("goals"); expect(screen.queryByTestId("tricks-empty")).toBeNull(); });
  it("More demo label matches Batch 5 convention", () => { expect(MORE_DEMO_LABEL).toBe(DEMO_LABEL.ride); expect(MORE_DEMO_LABEL.startsWith("Demo · ")).toBe(true); });
});

describe("ConfirmBar", () => {
  const mount = () => { const yes = vi.fn(); const keep = vi.fn(); render(<ConfirmBar label="Confirm x" message="Do x?" yesLabel="Yes, do" keepLabel="Keep it" onYes={yes} onKeep={keep} testId="cb" />); return { yes, keep }; };
  it("Yes calls onYes", () => { const { yes, keep } = mount(); fireEvent.click(btn("Yes, do")); expect(yes).toHaveBeenCalledOnce(); expect(keep).not.toHaveBeenCalled(); });
  it("Keep calls onKeep", () => { const { yes, keep } = mount(); fireEvent.click(btn("Keep it")); expect(keep).toHaveBeenCalledOnce(); expect(yes).not.toHaveBeenCalled(); });
  it("Esc calls onKeep", () => { const { keep } = mount(); fireEvent.keyDown(screen.getByTestId("cb"), { key: "Escape" }); expect(keep).toHaveBeenCalledOnce(); });
  it("other keys ignored", () => { const { keep, yes } = mount(); fireEvent.keyDown(screen.getByTestId("cb"), { key: "Enter" }); expect(keep).not.toHaveBeenCalled(); expect(yes).not.toHaveBeenCalled(); });
  it("labelled group + Keep focused", () => { mount(); expect(screen.getByRole("group", { name: "Confirm x" })).toBeTruthy(); expect(document.activeElement?.textContent).toBe("Keep it"); });
  it("default keep label is Keep", () => { render(<ConfirmBar label="c" message="m" yesLabel="Yes" onYes={() => {}} onKeep={() => {}} />); expect(btn("Keep")).toBeTruthy(); });
});

describe("Crew Tools confirms use shared pattern", () => {
  const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };
  it("Session clear: Esc keeps transcript", () => { openTab("session"); type("session command", "whats next"); fireEvent.click(btn("Send")); fireEvent.click(screen.getByTestId("transcript-clear")); fireEvent.keyDown(screen.getByTestId("transcript-clear-confirm"), { key: "Escape" }); expect(screen.queryByTestId("transcript-clear-confirm")).toBeNull(); expect(useWoz.getState().transcript.length).toBeGreaterThan(0); });
  it("Session clear focuses Keep", () => { openTab("session"); type("session command", "whats next"); fireEvent.click(btn("Send")); fireEvent.click(screen.getByTestId("transcript-clear")); expect(document.activeElement?.textContent).toBe("Keep"); });
  it("Smart ID revoke: Esc keeps tag", () => { openTab("smartid"); fireEvent.click(btn("Create demo tag")); fireEvent.click(screen.getByTestId("revoke-start")); fireEvent.keyDown(screen.getByTestId("revoke-confirm"), { key: "Escape" }); expect(screen.queryByTestId("revoke-confirm")).toBeNull(); expect(screen.queryByTestId("revoked-banner")).toBeNull(); });
  it("Unlink confirm: Esc cancels and keeps member", () => { openTab("crew"); const before = screen.getAllByTestId("crew-row").length; fireEvent.click(btn("Unlink Ria")); fireEvent.keyDown(screen.getByTestId("confirm-box"), { key: "Escape" }); expect(screen.queryByTestId("confirm-box")).toBeNull(); expect(screen.getAllByTestId("crew-row")).toHaveLength(before); });
  it("Clear-all word: Esc empties the word and keeps button disabled", () => { openTab("crew"); type("clear confirm word", "CLEAR"); fireEvent.keyDown(screen.getByLabelText("clear confirm word"), { key: "Escape" }); expect((screen.getByLabelText("clear confirm word") as HTMLInputElement).value).toBe(""); expect(btn("Clear all Crew Tools data").disabled).toBe(true); });
});

describe("profile privacy + reset hygiene", () => {
  it("setPrivacy never stores a public profile", () => { useWoz.getState().setPrivacy({ ...useWoz.getState().privacy, publicProfile: true } as never); expect((useWoz.getState().privacy as { publicProfile: boolean }).publicProfile).toBe(false); });
  it("hydrate coerces a tampered public profile back to private", () => { store.save("crew.privacy", { publicProfile: true, profileVisibility: "crew" }, new Date().toISOString()); useWoz.getState().hydrate(); expect((useWoz.getState().privacy as { publicProfile: boolean }).publicProfile).toBe(false); });
  it("visibility options exclude public", () => { useWoz.setState({ tab: "crew" }); useStomp.setState({ screen: "woz" }); render(<StompApp />); const opts = [...(screen.getByLabelText("profile visibility") as HTMLSelectElement).options].map((o) => o.value); expect(opts).toEqual(["only_me", "crew"]); });
  it("export dump has no coordinate paths after a ride + tag", () => { useStomp.setState({ screen: "woz" }); useWoz.setState({ tab: "smartid" }); render(<StompApp />); fireEvent.click(btn("Create demo tag")); expect(findCoordinatePaths(JSON.parse(exportDump(store, new Date().toISOString())))).toEqual([]); });
  it("resetAll wipes Woz keys but leaves GB crew untouched", () => { useWoz.getState().setPrivacy({ ...useWoz.getState().privacy }); expect(store.listKeys().length).toBeGreaterThan(0); useWoz.getState().resetAll(); expect(store.listKeys()).toEqual([]); expect(useStomp.getState().crew).toEqual([{ code: "AAA111", name: "Ria" }]); });
  it("resetAll restores private defaults", () => { useWoz.getState().setPrivacy({ ...useWoz.getState().privacy, profileVisibility: "crew" }); useWoz.getState().resetAll(); expect(useWoz.getState().privacy.profileVisibility).toBe("only_me"); });
});

describe("greet.tsx pinned + floating Crew tools from greet", () => {
  it("greet.tsx sha256 unchanged", () => { const h = createHash("sha256").update(readFileSync("src/components/stomp/greet.tsx")).digest("hex"); expect(h.startsWith("0811babf")).toBe(true); expect(h.endsWith("996fc2")).toBe(true); });
  it("pill opens Crew tools, Back returns to greet", async () => { render(<StompApp />); await act(async () => { await Promise.resolve(); }); act(() => useStomp.setState({ screen: "greet" })); fireEvent.click(screen.getByTestId("greet-crew-tools")); expect(screen.getByTestId("woz-lab")).toBeTruthy(); fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("greet"); expect(screen.getByTestId("greet-crew-tools")).toBeTruthy(); });
  it("pill not shown on More screens", async () => { await show("stash"); expect(screen.queryByTestId("greet-crew-tools")).toBeNull(); });
});
