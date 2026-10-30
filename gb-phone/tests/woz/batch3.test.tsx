// @vitest-environment jsdom
// Woz Path1 batch3: chrome/nav back stack, natural Session phrases, Ride edge cases,
// Campfire/Smart ID copy, persistence round-trips across tabs + privacy regressions.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import { useWoz, setWozBacking, getWozBacking, WOZ_TABS } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { routeTyped, resolveAlias, PHRASE_ALIASES, MAX_UTTERANCE, SESSION_BRIDGE_FLAGS } from "@/lib/stomp/woz-bridge/session";
import { friendlyError, scanLabel, NFC_WRITE_MSG, RECOVERED_MSG } from "@/lib/stomp/woz-bridge/copy";
import { ride as R } from "@/lib/stomp/woz-bridge/ride";

const crew = [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }];
const T = "2026-10-29T12:00:00.000Z";
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
const send = (t: string) => { type("session command", t); click("Send"); };
const lastReply = () => { const li = screen.getByTestId("transcript").querySelectorAll("li"); return li[li.length - 1]!.textContent ?? ""; };
/** Simulate an app reload: drop React tree + in-memory Woz state, keep backing store. */
const reload = () => { cleanup(); const b = getWozBacking(); useWoz.setState({ ...useWoz.getInitialState?.() }); setWozBacking(b); useWoz.getState().hydrate(); };

describe("chrome / nav back stack", () => {
  for (const [from, title] of [["log", "Airtime"], ["guide", "The line"], ["stash", "Stash"], ["playlist", "Playlist"], ["goals", "Tricks"], ["park", "Park"]] as const) {
    it(`More screen ${from} has Crew tools chrome link and Back returns`, () => {
      useStomp.setState({ screen: from }); render(<StompApp />);
      expect(screen.getByText(title)).toBeTruthy();
      fireEvent.click(screen.getByTestId("chrome-crew-tools"));
      expect(useStomp.getState().screen).toBe("woz");
      expect(useWoz.getState().returnTo).toBe(from);
      fireEvent.click(screen.getByTestId("woz-back"));
      expect(useStomp.getState().screen).toBe(from);
    });
  }
  for (const [from, tab] of [["stompers", "crew"], ["stompers", "campfire"], ["stompers", "smartid"], ["session", "session"]] as const) {
    it(`deep link ${from} → ${tab} keeps back to ${from}`, () => {
      useStomp.setState({ screen: from }); render(<StompApp />);
      fireEvent.click(screen.getByTestId(`woz-entry-${tab}`));
      expect(useWoz.getState().tab).toBe(tab);
      fireEvent.click(screen.getByTestId("woz-back"));
      expect(useStomp.getState().screen).toBe(from);
    });
  }
  it("run → ride deep link returns to run", () => {
    useStomp.setState({ screen: "run", running: true, runStartedAt: Date.now() }); render(<StompApp />);
    fireEvent.click(screen.getByTestId("woz-entry-ride")); expect(useWoz.getState().tab).toBe("ride");
    fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("run");
  });
  it("home chip opens crew tab with back to home", async () => {
    render(<StompApp />); await act(async () => { await Promise.resolve(); }); act(() => useStomp.setState({ screen: "home" })); click("Crew tools");
    expect(useWoz.getState().tab).toBe("crew"); expect(useWoz.getState().returnTo).toBe("home");
  });
  it("greet More links (Airtime/Guide/Stash) reach Crew tools via chrome", async () => {
    useStomp.setState({ screen: "greet" }); render(<StompApp />); await act(async () => { await Promise.resolve(); });
    click("Airtime"); fireEvent.click(screen.getByTestId("chrome-crew-tools")); expect(useStomp.getState().screen).toBe("woz");
    fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("log");
  });
  it("chrome link keeps last-used tab", () => {
    useWoz.getState().setTab("ride"); useStomp.setState({ screen: "log" }); render(<StompApp />);
    fireEvent.click(screen.getByTestId("chrome-crew-tools")); expect(screen.getByTestId("run-builder")).toBeTruthy();
  });
  it("no returnTo shows Home button instead of Back", () => { openTab("crew"); expect(screen.queryByTestId("woz-back")).toBeNull(); expect(screen.getByRole("button", { name: /Home/ })).toBeTruthy(); });
  it("openFrom never records woz as origin (no self-loop)", () => { useWoz.getState().openFrom("crew", "woz"); expect(useWoz.getState().returnTo).toBeNull(); });
  it("openFrom ignores invalid tab", () => { useWoz.getState().openFrom("nope" as never, "log"); expect(useWoz.getState().tab).toBe("crew"); });
  it("switching tabs keeps back target", () => {
    useStomp.setState({ screen: "stompers" }); render(<StompApp />); fireEvent.click(screen.getByTestId("woz-entry-crew"));
    fireEvent.click(screen.getByRole("tab", { name: "Ride" })); fireEvent.click(screen.getByRole("tab", { name: "Session" }));
    fireEvent.click(screen.getByTestId("woz-back")); expect(useStomp.getState().screen).toBe("stompers");
  });
  it("Invite (Crew Link) from Crew Tools still lands on GB crew screen", () => { openTab("crew"); fireEvent.click(screen.getByTestId("open-gb-invite")); expect(useStomp.getState().screen).toBe("crew"); });
});

describe("session natural phrases (bridge)", () => {
  const exec: [string, string][] = [
    ["lets drop in", "session.start"], ["start", "session.start"], ["lets go", "session.start"], ["lets ride", "session.start"],
    ["pause", "session.pause"], ["hold up", "session.pause"], ["resume", "session.resume"], ["unpause", "session.resume"], ["keep going", "session.resume"],
    ["save this spot", "stash.mark"], ["stash this", "stash.mark"], ["pin this", "stash.mark"], ["show stashes", "stash.list"],
    ["light the campfire", "campfire.open"], ["react", "campfire.react"], ["fire", "campfire.react"],
    ["whos on the hill", "crew.status"], ["where is my crew", "crew.status"], ["next", "session.next_hit"], ["what can i say", "system.help"],
    ["Hey Session, let's drop in!", "session.start"], ["LANDED IT", "trick.log_stomped"], ["nailed it", "trick.log_stomped"], ["bailed", "trick.log_washed"],
  ];
  for (const [p, intent] of exec) it(`"${p}" → ${intent}`, () => { const r = routeTyped({ pending: null }, p); expect(r.outcome.kind).toBe("execute"); expect(r.outcome.kind === "execute" && r.outcome.command.intent).toBe(intent); });
  const confirm: [string, string][] = [["im done", "session.end"], ["done for today", "session.end"], ["call it", "session.end"], ["undo", "trick.undo_last"], ["oops", "trick.undo_last"], ["end campfire", "campfire.close"]];
  for (const [p, intent] of confirm) it(`"${p}" still needs confirmation (${intent})`, () => { const r = routeTyped({ pending: null }, p); expect(r.outcome.kind).toBe("needs_confirmation"); expect(r.state.pending?.intent).toBe(intent); });
  it("alias table never overrides a native phrase", () => { for (const k of Object.keys(PHRASE_ALIASES)) expect(routeTyped({ pending: null }, PHRASE_ALIASES[k]!).outcome.kind).not.toBe("unknown"); });
  it("resolveAlias keeps hey-session prefix", () => expect(resolveAlias("hey session save this spot")).toBe("hey session mark stash"));
  it("resolveAlias null for gibberish", () => expect(resolveAlias("blorp")).toBeNull());
  it("very long input is clipped, not crashing", () => { const r = routeTyped({ pending: null }, "x".repeat(5000)); expect(r.outcome.kind).toBe("unknown"); expect(MAX_UTTERANCE).toBe(120); });
  it("non-string input is safe", () => expect(routeTyped({ pending: null }, undefined as never).outcome.kind).toBe("ignored"));
  it("wake listening, background wake, headsets all OFF", () => expect(SESSION_BRIDGE_FLAGS).toEqual({ wakeListening: false, backgroundWake: false, headsetIntegrations: false, textPathOnly: true }));
  it("no wake required by default (typed path)", () => expect(routeTyped({ pending: null }, "stomped it").outcome.kind).toBe("execute"));
  it("wake required mode still rejects bare phrases", () => expect(routeTyped({ pending: null }, "save this spot", true).reply).toMatch(/hey session/));
});

describe("session panel UI", () => {
  it("empty submit shows hint and adds nothing", () => { openTab("session"); click("Send"); expect(screen.getByTestId("session-hint").textContent).toMatch(/Type a command/); expect(screen.getByTestId("transcript").children).toHaveLength(0); });
  it("quick phrases render", () => { openTab("session"); expect(screen.getAllByTestId("quick-phrase").length).toBeGreaterThanOrEqual(6); });
  it("quick phrase start → landed it logs a trick", () => { openTab("session"); click("start session"); click("landed it"); expect(useWoz.getState().ride.tricks).toHaveLength(1); expect(lastReply()).toMatch(/Stomped — logged/); });
  it("double start explains ride already going", () => { openTab("session"); send("start session"); send("lets go"); expect(lastReply()).toMatch(/already going/); });
  it("im done → confirm Yes ends ride", () => { openTab("session"); send("start session"); click("im done"); expect(screen.getByTestId("pending")).toBeTruthy(); click("Yes"); expect(useWoz.getState().ride.phase).toBe("ended"); });
  it("undo → Cancel keeps trick", () => { openTab("session"); send("start"); send("nailed it"); send("undo"); click("Cancel"); expect(useWoz.getState().ride.tricks).toHaveLength(1); });
  it("save this spot saves a no-GPS stash", () => { openTab("session"); send("start"); send("save this spot"); expect(lastReply()).toMatch(/no GPS/); expect(useWoz.getState().ride.stashes[0]!.zoneLabel).not.toMatch(/\d+\.\d{3,}/); });
  it("pause when idle explains", () => { openTab("session"); send("pause"); expect(lastReply()).toMatch(/Only a running ride/); });
  it("light the campfire then react", () => { openTab("session"); send("light the campfire"); expect(useWoz.getState().campfireOpen).toBe(true); send("react"); expect(lastReply()).toMatch(/sent \(local\)/); });
  it("input has maxLength", () => { openTab("session"); expect((screen.getByLabelText("session command") as HTMLInputElement).maxLength).toBe(MAX_UTTERANCE); });
  it("wake status text says off", () => { openTab("session"); expect(screen.getByTestId("wake-status").textContent).toMatch(/Wake word: off · Background listening: off/); });
});

describe("ride edge cases", () => {
  it("empty runs state", () => { openTab("ride"); expect(screen.getByTestId("runs-empty")).toBeTruthy(); });
  it("empty run cannot be used for ride", () => { openTab("ride"); type("run name", "Line"); click("Create"); expect(screen.getByTestId("hits-empty")).toBeTruthy(); expect((screen.getByTestId("use-for-ride") as HTMLButtonElement).disabled).toBe(true); });
  it("blank hit label explains", () => { openTab("ride"); type("run name", "Line"); click("Create"); click("Add hit"); expect(screen.getByRole("alert").textContent).toMatch(/Name the hit/); });
  it("use for ride sets run and note", () => { openTab("ride"); type("run name", "Line"); click("Create"); type("hit label", "Kicker"); click("Add hit"); fireEvent.click(screen.getByTestId("use-for-ride")); expect(useWoz.getState().ride.run?.name).toBe("Line"); expect(screen.getByTestId("ride-note").textContent).toMatch(/ready/); });
  it("start disabled while live (no double-start)", () => { openTab("ride"); click("Start"); expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(true); expect(useWoz.getState().ride.phase).toBe("active"); });
  it("use for ride disabled while live", () => { openTab("ride"); type("run name", "L"); click("Create"); type("hit label", "K"); click("Add hit"); click("Start"); expect((screen.getByTestId("use-for-ride") as HTMLButtonElement).disabled).toBe(true); });
  it("resume when not paused is disabled (batch5)", () => { openTab("ride"); expect((screen.getByRole("button", { name: "Resume" }) as HTMLButtonElement).disabled).toBe(true); });
  it("end when idle is disabled (batch5)", () => { openTab("ride"); expect((screen.getByRole("button", { name: "End" }) as HTMLButtonElement).disabled).toBe(true); });
  it("undo with no tricks is disabled with hint (batch5)", () => { openTab("ride"); click("Start"); const u = screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement; expect(u.disabled).toBe(true); expect(u.title).toMatch(/Nothing to undo/); });
  it("start after end begins a fresh ride", () => { openTab("ride"); click("Start"); click("Stomped"); click("End"); click("Start"); expect(useWoz.getState().ride.tricks).toHaveLength(0); expect(useWoz.getState().ride.phase).toBe("active"); });
  it("mark stash shows no-GPS note", () => { openTab("ride"); click("Start"); click("Mark stash"); expect(screen.getByTestId("ride-note").textContent).toMatch(/park label only/); });
  it("corrupt ride JSON → fresh ride + recovered banner", () => { getWozBacking().save("ride.current", "{not json", T); useWoz.getState().hydrate(); expect(useWoz.getState().ride.phase).toBe("idle"); expect(useWoz.getState().lastError).toBe(RECOVERED_MSG); });
  it("corrupt stash entries dropped on reload (incl. coordinates)", () => {
    const s = { ...R.newRideSession("r1", "Park"), phase: "active", stashes: [{ id: "a", label: "ok", zoneLabel: "Park", atIso: T, private: true }, { id: "b", label: "gps", zoneLabel: "40.712776,-74.005974", atIso: T, private: true }, null, { label: "noid" }] };
    getWozBacking().save("ride.current", JSON.stringify(s), T); useWoz.getState().hydrate();
    expect(useWoz.getState().ride.stashes.map((x) => x.id)).toEqual(["a"]); expect(useWoz.getState().lastError).toBe(RECOVERED_MSG);
  });
  it("completedHits clamped on reload", () => { const s = { ...R.newRideSession("r1", "Park", { id: "x", name: "x", hits: [{ id: "h", feature: "jump", label: "J" }] }), completedHits: 99 }; getWozBacking().save("ride.current", JSON.stringify(s), T); useWoz.getState().hydrate(); expect(useWoz.getState().ride.completedHits).toBe(1); });
  it("clean ride reload sets no error", () => { useWoz.getState().setRide(R.newRideSession("r", "P")); useWoz.getState().hydrate(); expect(useWoz.getState().lastError).toBeNull(); });
  it("friendlyError ride map", () => { expect(friendlyError("ride", "too_many_hits")).toMatch(/20/); expect(friendlyError("ride", "invalid_transition", "start")).toMatch(/already going/); expect(friendlyError("ride", "zzz")).toMatch(/nothing was sent/); });
});

describe("campfire / smart id copy", () => {
  it("campfire guards copy says upload off + crew only", () => { openTab("campfire"); expect(screen.getByTestId("campfire-guards").textContent).toMatch(/Uploading is off/); expect(screen.getByText("Demo · crew-only")).toBeTruthy(); });
  it("load clips disabled with none", () => { openTab("campfire"); expect((screen.getByRole("button", { name: /Load my clips \(0\)/ }) as HTMLButtonElement).disabled).toBe(true); });
  it("comment while closed explains", () => { useStomp.setState({ clips: [{ id: "c1", title: "Ollie", at: 1 }] as never }); openTab("campfire"); click(/Load my clips/); type("comment", "yo"); click("Comment"); expect(screen.getByRole("alert").textContent).toMatch(/Open Campfire/); });
  it("public share copy", () => expect(friendlyError("campfire", "public_not_allowed")).toMatch(/crew-only/));
  it("smart id badge says no NFC", () => { openTab("smartid"); expect(screen.getByText("Demo · no NFC")).toBeTruthy(); });
  it("NFC write gives clear copy", async () => { openTab("smartid"); click("Create demo tag"); click(/Write NFC/); expect((await screen.findByRole("alert")).textContent).toContain(NFC_WRITE_MSG); });
  it("empty claim code explains", () => { openTab("smartid"); click("Create demo tag"); expect((screen.getByRole("button", { name: "Claim" }) as HTMLButtonElement).disabled).toBe(true); fireEvent.submit(screen.getByLabelText("claim code").closest("form")!); expect(screen.getByRole("alert").textContent).toMatch(/Enter the claim code/); });
  it("claim without credential is safe", () => { openTab("smartid"); click("Create demo tag"); useWoz.setState({ creds: [] }); type("claim code", "CLAIM-0001"); click("Claim"); expect(screen.getByRole("alert").textContent).toMatch(/isn't on this phone/); });
  it("claim trims whitespace", () => { openTab("smartid"); click("Create demo tag"); type("claim code", "  CLAIM-0001 "); click("Claim"); expect(screen.getByTestId("tag-state").textContent).toMatch(/claimed/); });
  it("revoked tag can be removed", () => { openTab("smartid"); click("Create demo tag"); click("Revoke"); click("Yes, revoke"); click("Remove tag"); expect(useWoz.getState().tags).toEqual([]); expect(screen.getByRole("button", { name: "Create demo tag" })).toBeTruthy(); });
  it("scan labels are plain language", () => { expect(scanLabel({ result: "unclaimed" })).toMatch(/claim it/); expect(scanLabel({ result: "inactive" })).toMatch(/isn’t active/); expect(scanLabel({ result: "revoked" })).toMatch(/revoked/); expect(scanLabel({ result: "rider", displayName: "Ted" })).toBe("Rider: Ted"); });
  it("smart id error map covers every code", () => { for (const c of ["not_found", "invalid_transition", "bad_code", "already_used", "pii_in_payload", "bad_payload", "revoked", "not_owner"]) expect(friendlyError("smartid", c)).not.toMatch(/Something went wrong/); });
});

describe("persistence round-trip across tabs", () => {
  it("tab survives reload", () => { useWoz.getState().setTab("smartid"); reload(); expect(useWoz.getState().tab).toBe("smartid"); });
  it("bad persisted tab ignored", () => { getWozBacking().save("ui.tab", "admin", T); useWoz.getState().hydrate(); expect(useWoz.getState().tab).toBe("crew"); });
  it("crew unlink + privacy survive reload", () => { const s = useWoz.getState(); s.markUnlinked("stomper_AAA111"); s.setPrivacy({ ...s.privacy, shareClipsWithCrew: true }); reload(); expect(useWoz.getState().unlinked).toEqual(["stomper_AAA111"]); expect(useWoz.getState().privacy.shareClipsWithCrew).toBe(true); });
  it("ride + runs survive reload", () => { const s = useWoz.getState(); s.setRuns([{ id: "r", name: "Line", hits: [] }]); s.setRide({ ...R.newRideSession("x", "P"), phase: "active" }); reload(); expect(useWoz.getState().runs[0]!.name).toBe("Line"); expect(useWoz.getState().ride.phase).toBe("active"); });
  it("campfire media survives reload; old shape gets defaults", () => { getWozBacking().save("campfire.media", { clips: [] }, T); useWoz.getState().hydrate(); expect(useWoz.getState().media.comments).toEqual([]); expect(useWoz.getState().media.reactions).toEqual([]); });
  it("smart id tags survive reload; junk dropped", () => { getWozBacking().save("smartid.tags", [{ tagId: "t", publicSlug: "demo-tag-01", state: "active", ownerStomperId: null, createdAtIso: T }, { hacked: 1 }], T); useWoz.getState().hydrate(); expect(useWoz.getState().tags).toHaveLength(1); expect(useWoz.getState().lastError).toBe(RECOVERED_MSG); });
  it("session transcript is NOT persisted (privacy)", () => { useWoz.getState().say("you", "secret"); reload(); expect(useWoz.getState().transcript).toEqual([]); expect(getWozBacking().listKeys().some((k) => /transcript/.test(k))).toBe(false); });
  it("campfireOpen is not persisted (always closed after reload)", () => { useWoz.getState().setCampfireOpen(true); reload(); expect(useWoz.getState().campfireOpen).toBe(false); });
  it("publicProfile forced false even if tampered", () => { getWozBacking().save("crew.privacy", { publicProfile: true, profileVisibility: "crew" }, T); useWoz.getState().hydrate(); expect(useWoz.getState().privacy.publicProfile).toBe(false); });
  it("resetAll clears all Woz keys but not GB state", () => { useWoz.getState().setTab("ride"); useWoz.getState().markUnlinked("x"); useWoz.getState().resetAll(); expect(getWozBacking().listKeys()).toEqual([]); expect(useStomp.getState().crew).toEqual(crew); });
  it("all 5 tabs render after reload with seeded data", () => {
    const s = useWoz.getState(); s.setRuns([{ id: "r", name: "Line", hits: [] }]); s.setTab("crew"); reload();
    for (const t of WOZ_TABS) { cleanup(); openTab(t.id); expect(screen.getByTestId("woz-lab")).toBeTruthy(); }
  });
  it("no persisted value contains coordinates", () => {
    openTab("ride"); click("Start"); click("Mark stash"); cleanup();
    for (const k of getWozBacking().listKeys()) expect(JSON.stringify(getWozBacking().load(k))).not.toMatch(/-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/);
  });
});
