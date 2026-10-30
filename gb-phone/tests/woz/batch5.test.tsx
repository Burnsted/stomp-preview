// @vitest-environment jsdom
// Woz Path1 batch5: Session empty/clear/undo/confirm UX, Ride/Run empty + live banners,
// Smart ID safer claim + revoke confirm, consistent demo badges, Home Crew tools card.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import { useWoz, setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { SESSION_BRIDGE_FLAGS } from "@/lib/stomp/woz-bridge/session";
import { DEMO_LABEL, SESSION_EMPTY, RUNS_EMPTY, HITS_EMPTY, rideBanner, normalizeClaimCode, REVOKE_CONFIRM } from "@/lib/stomp/woz-bridge/copy";

beforeEach(() => {
  localStorage.clear();
  setWozBacking(createWozStore(createMemoryBackend()));
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: [{ code: "AAA111", name: "Ria" }], riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [] });
});
afterEach(() => cleanup());
const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const send = (v: string) => { type("session command", v); click("Send"); };
const btn = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

describe("copy helpers", () => {
  it("demo labels all start with Demo ·", () => { for (const v of Object.values(DEMO_LABEL)) expect(v.startsWith("Demo · ")).toBe(true); });
  it("rideBanner idle/ended → null", () => { expect(rideBanner("idle")).toBeNull(); expect(rideBanner("ended")).toBeNull(); });
  it("rideBanner active mentions run, next hit and no GPS", () => { const t = rideBanner("active", "Line", "Kicker")!; expect(t).toMatch(/Line/); expect(t).toMatch(/next: Kicker/); expect(t).toMatch(/no GPS/); });
  it("rideBanner paused tells how to continue", () => expect(rideBanner("paused")).toMatch(/Resume/));
  it("normalizeClaimCode trims/uppercases/strips spaces", () => { expect(normalizeClaimCode("  claim-0001 ")).toBe("CLAIM-0001"); expect(normalizeClaimCode("   ")).toBe(""); });
  it("revoke confirm copy is explicit", () => expect(REVOKE_CONFIRM).toMatch(/can’t be undone/));
});

describe("session polish", () => {
  it("empty transcript shows guidance, no clear button", () => { openTab("session"); expect(screen.getByTestId("transcript-empty").textContent).toBe(SESSION_EMPTY); expect(screen.queryByTestId("transcript-clear")).toBeNull(); });
  it("wake + background listening stay off", () => { openTab("session"); expect(SESSION_BRIDGE_FLAGS.wakeListening).toBe(false); expect(screen.getByTestId("wake-status").textContent).toMatch(/Wake word: off · Background listening: off/); });
  it("badge uses consistent demo label", () => { openTab("session"); expect(screen.getByText(DEMO_LABEL.session)).toBeTruthy(); });
  it("clear asks before wiping, Keep cancels", () => { openTab("session"); send("start session"); click("Clear transcript"); expect(screen.getByTestId("transcript-clear-confirm").textContent).toMatch(/Clear 2 lines/); click("Keep"); expect(useWoz.getState().transcript.length).toBe(2); });
  it("confirmed clear wipes transcript but keeps ride", () => { openTab("session"); send("start session"); send("stomped it"); click("Clear transcript"); click("Yes, clear"); expect(useWoz.getState().transcript).toEqual([]); expect(useWoz.getState().ride.tricks.length).toBe(1); expect(screen.getByTestId("transcript-empty")).toBeTruthy(); });
  it("pending confirm is a labelled group with guidance", () => { openTab("session"); send("start session"); send("im done"); const g = screen.getByRole("group", { name: "Confirm command" }); expect(g.textContent).toMatch(/Nothing happens until you confirm/); });
  it("Esc cancels a pending confirm", () => { openTab("session"); send("start session"); send("im done"); fireEvent.keyDown(screen.getByLabelText("session command"), { key: "Escape" }); expect(useWoz.getState().router.pending).toBeNull(); expect(useWoz.getState().ride.phase).toBe("active"); });
  it("undo confirm says what was removed and count left", () => { openTab("session"); send("start session"); send("stomped it"); send("stomped it"); send("undo"); click("Yes"); const t = useWoz.getState().transcript.at(-1)!.text; expect(t).toMatch(/Undid last trick \(stomped\)\. 1 left/); expect(useWoz.getState().ride.tricks.length).toBe(1); });
  it("ride banner shows on Session when live", () => { openTab("session"); expect(screen.queryByTestId("ride-banner")).toBeNull(); send("start session"); expect(screen.getByTestId("ride-banner").textContent).toMatch(/Ride in progress/); });
  it("clear transcript never touches GB stomp-line", () => { openTab("session"); const before = JSON.stringify(useStomp.getState().crew); send("start session"); click("Clear transcript"); click("Yes, clear"); expect(JSON.stringify(useStomp.getState().crew)).toBe(before); });
});

describe("ride/run polish", () => {
  it("empty runs copy", () => { openTab("ride"); expect(screen.getByTestId("runs-empty").textContent).toBe(RUNS_EMPTY); });
  it("empty hits copy", () => { openTab("ride"); type("run name", "Line"); click("Create"); expect(screen.getByTestId("hits-empty").textContent).toBe(HITS_EMPTY); });
  it("idle hint offers free ride or run", () => { openTab("ride"); expect(screen.getByTestId("ride-idle").textContent).toMatch(/free ride/); });
  it("controls gated by phase: idle", () => { openTab("ride"); expect(btn("Start").disabled).toBe(false); for (const n of ["Pause", "Resume", "End", "Undo"]) expect(btn(n).disabled).toBe(true); });
  it("active → banner + pause enabled, resume disabled", () => { openTab("ride"); click("Start"); expect(screen.getByTestId("ride-banner").getAttribute("data-phase")).toBe("active"); expect(btn("Pause").disabled).toBe(false); expect(btn("Resume").disabled).toBe(true); });
  it("paused → banner says paused, resume enabled", () => { openTab("ride"); click("Start"); click("Pause"); expect(screen.getByTestId("ride-banner").textContent).toMatch(/Ride paused/); expect(btn("Resume").disabled).toBe(false); expect(btn("Pause").disabled).toBe(true); });
  it("undo enabled after a trick, then back to disabled", () => { openTab("ride"); click("Start"); click("Stomped"); expect(btn("Undo").disabled).toBe(false); click("Undo"); expect(btn("Undo").disabled).toBe(true); expect(screen.getByTestId("ride-note").textContent).toMatch(/removed/); });
  it("end summarizes and clears banner", () => { openTab("ride"); click("Start"); click("Stomped"); click("End"); expect(screen.getByTestId("ride-note").textContent).toMatch(/stomped 1, washed 0/); expect(screen.queryByTestId("ride-banner")).toBeNull(); expect(screen.getByTestId("ride-idle").textContent).toMatch(/Ride ended/); });
  it("banner includes run + next hit", () => { openTab("ride"); type("run name", "Line"); click("Create"); type("hit label", "Kicker"); click("Add hit"); click("Use for ride"); click("Start"); expect(screen.getByTestId("ride-banner").textContent).toMatch(/Line · next: Kicker/); });
  it("ready hint once a run is chosen", () => { openTab("ride"); type("run name", "Line"); click("Create"); type("hit label", "Kicker"); click("Add hit"); click("Use for ride"); expect(screen.getByTestId("ride-idle").textContent).toMatch(/Ready/); });
  it("no geolocation is ever requested", () => { const g = (navigator as { geolocation?: unknown }).geolocation; openTab("ride"); click("Start"); click("Mark stash"); expect((navigator as { geolocation?: unknown }).geolocation).toBe(g); expect(JSON.stringify(useWoz.getState().ride.stashes)).not.toMatch(/lat|lng|coord/i); });
});

describe("smart id polish", () => {
  const mk = () => { openTab("smartid"); click("Create demo tag"); };
  it("claim disabled while empty/whitespace", () => { mk(); expect(btn("Claim").disabled).toBe(true); type("claim code", "   "); expect(btn("Claim").disabled).toBe(true); });
  it("claim hint shows demo code format", () => { mk(); expect(screen.getByTestId("claim-hint").textContent).toMatch(/CLAIM-0001/); });
  it("lower-case code with spaces is normalized and claims", () => { mk(); type("claim code", " claim-0001 "); click("Claim"); expect(useWoz.getState().tags[0]!.state).not.toBe("unclaimed"); });
  it("wrong code explains, tag stays unclaimed", () => { mk(); type("claim code", "nope"); click("Claim"); expect(screen.getByRole("alert").textContent).toMatch(/doesn't match/); expect(useWoz.getState().tags[0]!.state).toBe("unclaimed"); });
  it("revoke asks first; Keep tag cancels", () => { mk(); click("Revoke"); expect(screen.getByTestId("revoke-confirm")).toBeTruthy(); click("Keep tag"); expect(screen.queryByTestId("revoke-confirm")).toBeNull(); expect(useWoz.getState().tags[0]!.state).not.toBe("revoked"); });
  it("confirmed revoke shows banner and hides state actions", () => { mk(); type("claim code", "CLAIM-0001"); click("Claim"); click("Activate"); click("Revoke"); click("Yes, revoke"); expect(useWoz.getState().tags[0]!.state).toBe("revoked"); expect(screen.getByTestId("revoked-banner")).toBeTruthy(); expect(screen.queryByRole("button", { name: "Activate" })).toBeNull(); expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull(); });
  it("remove after revoke clears scan view", () => { mk(); type("scan payload", "stomp://id/demo-tag-01"); click("Simulate scan"); click("Revoke"); click("Yes, revoke"); click("Remove tag"); expect(screen.queryByTestId("scan-view")).toBeNull(); expect(useWoz.getState().tags).toEqual([]); });
  it("NFC write still unavailable", () => { mk(); click("Write NFC (unavailable)"); return new Promise<void>((r) => setTimeout(() => { expect(screen.getByRole("alert").textContent).toMatch(/nothing was written/); r(); }, 0)); });
});

describe("demo banners + home discoverability", () => {
  for (const [tab, label] of [["ride", DEMO_LABEL.ride], ["campfire", DEMO_LABEL.campfire], ["smartid", DEMO_LABEL.smartid], ["crew", DEMO_LABEL.lab]] as const)
    it(`${tab} shows "${label}"`, () => { openTab(tab); expect(screen.getAllByText(label).length).toBeGreaterThan(0); });
  const renderHome = async () => { render(<StompApp />); await act(async () => { await Promise.resolve(); }); act(() => useStomp.setState({ screen: "home" })); };
  it("Home card opens Crew Tools with Back to home", async () => { await renderHome(); fireEvent.click(screen.getByTestId("home-crew-tools-card")); expect(screen.getByTestId("woz-lab")).toBeTruthy(); expect(useWoz.getState().returnTo).toBe("home"); fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("home"); });
  it("Home card copy says demo, stays on phone", async () => { await renderHome(); expect(screen.getByTestId("home-crew-tools-card").textContent).toMatch(/stays on this phone/); });
  const renderGreet = async () => { render(<StompApp />); await act(async () => { await Promise.resolve(); }); act(() => useStomp.setState({ screen: "greet" })); };
  it("Greet landing shows a Crew tools pill (rendered outside greet.tsx)", async () => { await renderGreet(); expect(screen.getByTestId("greet-crew-tools").getAttribute("aria-label")).toMatch(/stays on this phone/); expect(readFileSync(`${process.cwd()}/src/components/stomp/greet.tsx`, "utf8")).not.toMatch(/greet-crew-tools|woz/i); });
  it("Greet pill opens Crew tab, Back returns to greet", async () => { await renderGreet(); fireEvent.click(screen.getByTestId("greet-crew-tools")); expect(useWoz.getState().tab).toBe("crew"); expect(useWoz.getState().returnTo).toBe("greet"); fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("greet"); });
  it("pill hidden on non-greet screens", () => { openTab("crew"); expect(screen.queryByTestId("greet-crew-tools")).toBeNull(); });
  it("CrewLink Invite export unchanged (sha256 pin)", async () => {
    const { CREWLINK_SHA, crewLinkSha } = await import("./greet-invite-sha");
    expect(crewLinkSha()).toBe(CREWLINK_SHA);
  });
});
