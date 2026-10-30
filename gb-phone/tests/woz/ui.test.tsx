// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import { useWoz, setWozBacking, getWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { CREWLINK_SHA, crewLinkSha } from "./greet-invite-sha";

const crew = [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }];

beforeEach(() => {
  localStorage.clear();
  setWozBacking(createWozStore(createMemoryBackend()));
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: structuredClone(crew), riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [] });
});
afterEach(cleanup);

const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });

describe("Invite preservation", () => {
  it("CrewLink export sha256 unchanged", () => expect(crewLinkSha()).toBe(CREWLINK_SHA));
  it("Invite button routes to GB crew screen (CrewLink)", () => { openTab("crew"); fireEvent.click(screen.getByTestId("open-gb-invite")); expect(useStomp.getState().screen).toBe("crew"); });
  it("unlinking does not touch GB crew list", () => {
    openTab("crew"); const row = screen.getAllByTestId("crew-row")[1]!; fireEvent.click(within(row).getByRole("button", { name: /^Unlink / }));
    type("confirm phrase", "UNLINK"); click("Confirm"); expect(useStomp.getState().crew).toEqual(crew);
  });
});

describe("navigation", () => {
  it("stompers → crew tools", () => { useStomp.setState({ screen: "stompers" }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-crew")); expect(useStomp.getState().screen).toBe("woz"); expect(useWoz.getState().tab).toBe("crew"); });
  it("stompers → campfire", () => { useStomp.setState({ screen: "stompers" }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-campfire")); expect(useWoz.getState().tab).toBe("campfire"); });
  it("stompers → smart id", () => { useStomp.setState({ screen: "stompers" }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-smartid")); expect(useWoz.getState().tab).toBe("smartid"); });
  it("session → type to session", () => { useStomp.setState({ screen: "session" }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-session")); expect(useWoz.getState().tab).toBe("session"); });
  it("run → run builder", () => { useStomp.setState({ screen: "run", running: true, runStartedAt: Date.now() }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-ride")); expect(useWoz.getState().tab).toBe("ride"); });
  it("tabs switch panels", () => { openTab("crew"); fireEvent.click(screen.getByRole("tab", { name: "Ride" })); expect(screen.getByTestId("run-builder")).toBeTruthy(); fireEvent.click(screen.getByRole("tab", { name: "Smart ID" })); expect(screen.getByTestId("smartid")).toBeTruthy(); });
  it("demo badge always visible", () => { openTab("crew"); expect(screen.getAllByTestId("demo-badge").length).toBeGreaterThan(0); });
  it("home still renders", () => { useStomp.setState({ screen: "home" }); render(<StompApp />); expect(document.body.textContent!.length).toBeGreaterThan(0); });
});

describe("crew panel", () => {
  it("lists rider + mates", () => { openTab("crew"); expect(screen.getAllByTestId("crew-row")).toHaveLength(3); });
  it("empty state when no crew", () => { useStomp.setState({ crew: [] }); openTab("crew"); expect(screen.getByTestId("crew-empty")).toBeTruthy(); });
  it("unlink with wrong phrase keeps member", () => {
    openTab("crew"); fireEvent.click(within(screen.getAllByTestId("crew-row")[1]!).getByRole("button", { name: /^Unlink / }));
    type("confirm phrase", "unlink"); click("Confirm"); expect(screen.getAllByTestId("crew-row")).toHaveLength(3); expect(useWoz.getState().unlinked).toEqual([]);
  });
  it("unlink with UNLINK removes member", () => {
    openTab("crew"); fireEvent.click(within(screen.getAllByTestId("crew-row")[1]!).getByRole("button", { name: /^Unlink / }));
    type("confirm phrase", "UNLINK"); click("Confirm"); expect(screen.getAllByTestId("crew-row")).toHaveLength(2); expect(useWoz.getState().unlinked).toHaveLength(1);
  });
  it("restore unlinked brings member back", () => {
    getWozBacking().save("crew.unlinked", ["stomper_AAA111"], "2026-10-29T00:00:00.000Z"); openTab("crew"); // hydrated on mount
    expect(screen.getAllByTestId("crew-row")).toHaveLength(2); click(/Restore unlinked/); expect(screen.getAllByTestId("crew-row")).toHaveLength(3);
  });
  it("cancel closes confirm", () => { openTab("crew"); fireEvent.click(within(screen.getAllByTestId("crew-row")[1]!).getByRole("button", { name: /^Unlink / })); click("Cancel"); expect(screen.queryByTestId("confirm-box")).toBeNull(); });
  it("owner transfer with TRANSFER", () => {
    openTab("crew"); fireEvent.click(within(screen.getAllByTestId("crew-row")[1]!).getByRole("button", { name: /^Make .* owner$/ }));
    type("confirm phrase", "TRANSFER"); click("Confirm"); expect(screen.getAllByTestId("crew-row")[1]!.textContent).toContain("(owner)");
  });
  it("privacy defaults to only me", () => { openTab("crew"); expect((screen.getByLabelText("profile visibility") as HTMLSelectElement).value).toBe("only_me"); });
  it("privacy toggle persists to store", () => { openTab("crew"); fireEvent.click(screen.getByLabelText("shareClipsWithCrew")); expect(useWoz.getState().privacy.shareClipsWithCrew).toBe(true); });
  it("no public option offered", () => { openTab("crew"); expect(screen.queryByRole("option", { name: /public/i })).toBeNull(); });
});

describe("session panel", () => {
  const send = (t: string) => { type("session command", t); click("Send"); };
  it("shows wake off", () => { openTab("session"); expect(screen.getByTestId("wake-status").textContent).toMatch(/Wake word: off/); });
  it("start session starts ride and GB run", () => { openTab("session"); send("start session"); expect(useWoz.getState().ride.phase).toBe("active"); expect(useStomp.getState().running).toBe(true); expect(useStomp.getState().screen).toBe("woz"); });
  it("stomped it logs trick", () => { openTab("session"); send("start session"); send("stomped it"); expect(useWoz.getState().ride.tricks).toHaveLength(1); });
  it("logging before start explains error", () => { openTab("session"); send("stomped it"); expect(screen.getByTestId("transcript").textContent).toMatch(/Start \(or resume\) the ride first/); });
  it("end session asks for confirmation", () => { openTab("session"); send("start session"); send("end session"); expect(screen.getByTestId("pending")).toBeTruthy(); send("yes"); expect(useWoz.getState().ride.phase).toBe("ended"); });
  it("mark stash adds GB stash", () => { openTab("session"); send("start session"); send("mark stash"); expect(useStomp.getState().stashes).toHaveLength(1); expect(useWoz.getState().ride.stashes).toHaveLength(1); });
  it("unknown phrase replies", () => { openTab("session"); send("make me a sandwich"); expect(screen.getByTestId("transcript").textContent).toMatch(/help/); });
  it("crew status navigates to stompers", () => { openTab("session"); send("crew status"); expect(useStomp.getState().screen).toBe("stompers"); });
  it("open campfire toggles state", () => { openTab("session"); send("open campfire"); expect(useWoz.getState().campfireOpen).toBe(true); });
  it("blank input ignored", () => { openTab("session"); send("  "); expect(useWoz.getState().transcript).toHaveLength(0); });
});

describe("ride panel", () => {
  it("create run + add hit + reorder", () => {
    openTab("ride"); type("run name", "Park line"); click("Create");
    type("hit label", "Kicker"); click("Add hit"); type("hit label", "Rail"); click("Add hit");
    fireEvent.click(screen.getByRole("button", { name: "up Rail" }));
    expect(useWoz.getState().runs[0]!.hits.map((h) => h.label)).toEqual(["Rail", "Kicker"]);
  });
  it("empty run name shows error", () => { openTab("ride"); click("Create"); expect(screen.getByRole("alert").textContent).toMatch(/Give it a name first/); });
  it("empty hit label shows error", () => { openTab("ride"); type("run name", "L"); click("Create"); click("Add hit"); expect(screen.getByRole("alert")).toBeTruthy(); });
  it("from GB session template", () => { openTab("ride"); fireEvent.click(screen.getAllByRole("button", { name: /^From/ })[0]!); expect(useWoz.getState().runs[0]!.hits.length).toBeGreaterThan(0); });
  it("ride lifecycle buttons", () => { openTab("ride"); click("Start"); click("Stomped"); click("Washed"); click("Mark stash"); expect(screen.getByTestId("ride-summary").textContent).toBe("Stomped 1 · Washed 1 · Stashes 1"); });
  it("pause before start is disabled (batch5)", () => { openTab("ride"); expect((screen.getByRole("button", { name: "Pause" }) as HTMLButtonElement).disabled).toBe(true); });
  it("remove hit", () => { openTab("ride"); type("run name", "L"); click("Create"); type("hit label", "Box"); click("Add hit"); fireEvent.click(screen.getByRole("button", { name: "remove Box" })); expect(useWoz.getState().runs[0]!.hits).toHaveLength(0); });
  it("use for ride attaches run", () => { openTab("ride"); type("run name", "L"); click("Create"); type("hit label", "Box"); click("Add hit"); click("Use for ride"); expect(useWoz.getState().ride.run?.name).toBe("L"); });
});

describe("campfire panel", () => {
  beforeEach(() => useStomp.setState({ clips: [{ id: "c1", title: "Boardslide", place: "Park", seconds: 3, image: "", at: 1 }] }));
  it("empty state", () => { openTab("campfire"); expect(screen.getByTestId("campfire-empty")).toBeTruthy(); });
  it("loads GB clips privately", () => { openTab("campfire"); click(/Load my clips/); expect(screen.getByTestId("clip-row").textContent).toMatch(/Only me/); });
  it("react disabled while closed", () => { openTab("campfire"); click(/Load my clips/); expect((screen.getByRole("button", { name: "🔥" }) as HTMLButtonElement).disabled).toBe(true); });
  it("open + react", () => { openTab("campfire"); click(/Load my clips/); click("Open Campfire"); click("🔥"); expect(useWoz.getState().media.reactions).toHaveLength(1); });
  it("share to crew toggles", () => { openTab("campfire"); click(/Load my clips/); click("Share to crew"); expect(useWoz.getState().media.clips[0]!.share).toBe("crew"); });
  it("comment", () => { openTab("campfire"); click("Open Campfire"); click(/Load my clips/); type("comment", "send it"); click("Comment"); expect(screen.getByTestId("comment-count").textContent).toBe("1 comment"); });
  it("empty comment rejected with error", () => { openTab("campfire"); click(/Load my clips/); click("Comment"); expect(screen.getByRole("alert")).toBeTruthy(); });
});

describe("smart id panel", () => {
  it("labels NFC unavailable", () => { openTab("smartid"); expect(screen.getByTestId("smartid").textContent).toMatch(/NFC: not supported/); });
  it("create → claim → activate → scan", () => {
    openTab("smartid"); click("Create demo tag"); type("claim code", "CLAIM-0001"); click("Claim"); click("Activate");
    expect(screen.getByTestId("tag-state").textContent).toMatch(/active/);
    type("scan payload", "stomp://id/demo-tag-01"); click("Simulate scan"); expect(screen.getByTestId("scan-view").textContent).toBe("Rider: Ted");
  });
  it("bad claim code errors", () => { openTab("smartid"); click("Create demo tag"); type("claim code", "WRONG"); click("Claim"); expect(screen.getByRole("alert").textContent).toMatch(/claim code doesn't match/); });
  it("activate before claim errors", () => { openTab("smartid"); click("Create demo tag"); click("Activate"); expect(screen.getByRole("alert").textContent).toMatch(/Only the tag's owner/); });
  it("scan bad payload → unknown_tag", () => { openTab("smartid"); type("scan payload", "https://x"); click("Simulate scan"); expect(screen.getByTestId("scan-view").textContent).toMatch(/Unknown tag/); });
  it("Write NFC rejects (stub)", async () => { openTab("smartid"); click("Create demo tag"); click(/Write NFC/); expect((await screen.findByRole("alert")).textContent).toMatch(/nothing was written/); });
});

describe("Invite mirror (UI)", () => {
  const settle = () => new Promise((r) => setTimeout(r, 20));
  it("home chip opens crew tools", async () => { render(<StompApp />); await new Promise((r) => setTimeout(r, 20)); act(() => useStomp.setState({ screen: "home" })); fireEvent.click(screen.getByTestId("home-crew-tools-card")); expect(useStomp.getState().screen).toBe("woz"); expect(useWoz.getState().tab).toBe("crew"); });
  it("GB accept/revoke shows in Invite activity and re-accept re-links", async () => {
    openTab("crew"); await settle();
    expect(screen.getByTestId("invite-empty")).toBeTruthy();
    useWoz.getState().markUnlinked("stomper_AAA111");
    useStomp.setState({ crew: [crew[1]!] }); await settle();
    useStomp.setState({ crew: [crew[1]!, crew[0]!, { code: "CCC333", name: "Mo" }] }); await settle();
    const ev = screen.getAllByTestId("invite-event").map((e) => e.textContent);
    expect(ev).toContain("Left · Ria (AAA111)");
    expect(ev).toContain("Joined · Mo (CCC333)");
    expect(useWoz.getState().unlinked).not.toContain("stomper_AAA111");
    expect(screen.getAllByTestId("crew-row")).toHaveLength(4);
  });
  it("storage error is shown and dismissible", () => {
    openTab("crew"); act(() => useWoz.getState().setError("Couldn’t save on this phone")); 
    expect(screen.getByRole("alert").textContent).toContain("Couldn’t save");
    fireEvent.click(screen.getByLabelText("dismiss error")); expect(screen.queryByRole("alert")).toBeNull();
  });
});
