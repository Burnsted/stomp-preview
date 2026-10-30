// @vitest-environment jsdom
// Woz Path1 batch9: Smart ID lifecycle copy + ConfirmBar on Suspend/Revoke, Session ↔ Ride ↔ Campfire isolation,
// Invite empty copy (no fake invites), adapter stays read-only.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { StompApp } from "@/components/stomp/app";
import { useStomp } from "@/lib/stomp/store";
import { useWoz, setWozBacking } from "@/lib/stomp/woz-bridge/woz-store";
import { createWozStore, createMemoryBackend } from "@/lib/stomp/woz-bridge/persistence";
import { SMART_ID_FLAGS, nfc } from "@/lib/stomp/woz-bridge/smartid";
import { createMirrorEventHub, createMirrorInviteUnlinkAdapter } from "@/lib/stomp/woz-bridge/invite-adapter";
import { SMARTID_EMPTY, SMARTID_STATE, SMARTID_DONE, SUSPEND_CONFIRM, REVOKED_BANNER, REVOKE_CONFIRM, smartIdStateLabel, smartIdActions, INVITE_EMPTY, RIDE_PAUSED_START, plainError, CLAIM_EMPTY, DEMO_LABEL } from "@/lib/stomp/woz-bridge/copy";

beforeEach(() => {
  localStorage.clear();
  setWozBacking(createWozStore(createMemoryBackend()));
  useWoz.getState().resetAll();
  useStomp.setState({ screen: "home", crew: [{ code: "AAA111", name: "Ria" }], riderName: "Ted", riderCode: "ME0001", running: false, stashes: [], clips: [{ id: "c1", title: "Boardslide", place: "Park", seconds: 3, image: "", at: 1 }], landings: [], callouts: [], stomped: [] } as never);
});
afterEach(() => cleanup());
const openTab = (tab: string) => { useWoz.setState({ tab: tab as never }); useStomp.setState({ screen: "woz" }); render(<StompApp />); };
const click = (name: RegExp | string) => fireEvent.click(screen.getByRole("button", { name }));
const has = (name: RegExp | string) => screen.queryByRole("button", { name }) !== null;
const type = (label: string, v: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
const state = () => useWoz.getState().tags[0]?.state;
const claimed = () => { openTab("smartid"); click("Create demo tag"); type("claim code", "CLAIM-0001"); click("Claim"); };
const active = () => { claimed(); click("Activate"); };
const say = (t: string) => { type("session command", t); click("Send"); };
const go = (tab: string) => act(() => { useStomp.setState({ screen: "woz" }); useWoz.setState({ tab: tab as never }); });
const last = () => { const tr = useWoz.getState().transcript; return tr[tr.length - 1]!.text; };

describe("copy: smart id lifecycle", () => {
  for (const s of ["unclaimed", "claimed", "active", "suspended", "revoked"] as const) {
    it(`state label ${s} is a plain sentence`, () => { expect(smartIdStateLabel(s)).toBe(SMARTID_STATE[s]); expect(plainError(SMARTID_STATE[s])).toBe(SMARTID_STATE[s]); });
  }
  it("unknown state safe", () => expect(smartIdStateLabel("zzz")).toBe("Unknown tag state."));
  it("revoked banner = state copy", () => expect(REVOKED_BANNER).toBe(SMARTID_STATE.revoked));
  it("all done messages end with punctuation", () => { for (const v of Object.values(SMARTID_DONE)) expect(v).toMatch(/[.!]$/); });
  it("empty copy says demo · no NFC", () => { expect(SMARTID_EMPTY).toMatch(/Demo · no NFC/); expect(DEMO_LABEL.smartid).toBe("Demo · no NFC"); });
  it("actions: unclaimed", () => expect(smartIdActions("unclaimed")).toEqual({ activate: true, suspend: false, revoke: true, remove: false }));
  it("actions: claimed", () => expect(smartIdActions("claimed")).toEqual({ activate: true, suspend: false, revoke: true, remove: false }));
  it("actions: active (no Activate no-op)", () => expect(smartIdActions("active")).toEqual({ activate: false, suspend: true, revoke: true, remove: false }));
  it("actions: suspended", () => expect(smartIdActions("suspended")).toEqual({ activate: true, suspend: false, revoke: true, remove: false }));
  it("actions: revoked", () => expect(smartIdActions("revoked")).toEqual({ activate: false, suspend: false, revoke: false, remove: true }));
  it("suspend/revoke confirms are questions", () => { expect(SUSPEND_CONFIRM).toMatch(/^Suspend this tag\?/); expect(REVOKE_CONFIRM).toMatch(/^Revoke this tag\?/); });
});

describe("smart id panel batch9", () => {
  it("empty state copy before any tag", () => { openTab("smartid"); expect(screen.getByTestId("smartid-empty").textContent).toBe(SMARTID_EMPTY); });
  it("create shows note + claim code", () => { openTab("smartid"); click("Create demo tag"); expect(screen.getByTestId("smartid-note").textContent).toBe(SMARTID_DONE.created); expect(screen.queryByTestId("smartid-empty")).toBeNull(); });
  it("state help follows tag", () => { openTab("smartid"); click("Create demo tag"); expect(screen.getByTestId("tag-state-help").textContent).toBe(SMARTID_STATE.unclaimed); });
  it("empty code submit explains", () => { openTab("smartid"); click("Create demo tag"); fireEvent.submit(screen.getByLabelText("claim code").closest("form")!); expect(screen.getByTestId("woz-error").textContent).toContain(CLAIM_EMPTY); expect(state()).toBe("unclaimed"); });
  it("claim input described by hint", () => { openTab("smartid"); click("Create demo tag"); expect(screen.getByLabelText("claim code").getAttribute("aria-describedby")).toBe("claim-hint"); });
  it("claim note", () => { claimed(); expect(screen.getByTestId("smartid-note").textContent).toBe(SMARTID_DONE.claimed); expect(screen.getByTestId("tag-state-help").textContent).toBe(SMARTID_STATE.claimed); });
  it("claimed has no Suspend", () => { claimed(); expect(has("Suspend")).toBe(false); expect(has("Activate")).toBe(true); });
  it("activate note + no Activate when active", () => { active(); expect(screen.getByTestId("smartid-note").textContent).toBe(SMARTID_DONE.activated); expect(has("Activate")).toBe(false); expect(has("Suspend")).toBe(true); });
  it("suspend asks first", () => { active(); click("Suspend"); expect(screen.getByTestId("suspend-confirm").textContent).toMatch(/Suspend this tag\?/); expect(state()).toBe("active"); });
  it("suspend Keep focuses Keep + keeps active", () => { active(); click("Suspend"); expect(document.activeElement?.textContent).toBe("Keep active"); click("Keep active"); expect(state()).toBe("active"); expect(screen.queryByTestId("suspend-confirm")).toBeNull(); });
  it("suspend Esc keeps", () => { active(); click("Suspend"); fireEvent.keyDown(screen.getByTestId("suspend-confirm"), { key: "Escape" }); expect(state()).toBe("active"); });
  it("suspend Yes suspends + note", () => { active(); click("Suspend"); click("Yes, suspend"); expect(state()).toBe("suspended"); expect(screen.getByTestId("smartid-note").textContent).toBe(SMARTID_DONE.suspended); });
  it("suspended scan says not active", () => { active(); click("Suspend"); click("Yes, suspend"); type("scan payload", "stomp://id/demo-tag-01"); click("Simulate scan"); expect(screen.getByTestId("scan-view").textContent).toMatch(/isn’t active/); });
  it("reactivate after suspend", () => { active(); click("Suspend"); click("Yes, suspend"); click("Activate"); expect(state()).toBe("active"); });
  it("only one confirm at a time (actions hidden while confirming)", () => { active(); click("Suspend"); expect(has("Revoke")).toBe(false); expect(screen.queryByTestId("smartid-actions")).toBeNull(); });
  it("revoke Keep tag keeps", () => { active(); click("Revoke"); click("Keep tag"); expect(state()).toBe("active"); });
  it("revoke Yes → banner copy, note, remove only", () => { active(); click("Revoke"); click("Yes, revoke"); expect(screen.getByTestId("revoked-banner").textContent).toBe(REVOKED_BANNER); expect(screen.getByTestId("smartid-note").textContent).toBe(SMARTID_DONE.revoked); expect(has("Activate")).toBe(false); expect(has("Suspend")).toBe(false); expect(has("Revoke")).toBe(false); expect(has("Remove tag")).toBe(true); });
  it("revoke from unclaimed works", () => { openTab("smartid"); click("Create demo tag"); click("Revoke"); click("Yes, revoke"); expect(state()).toBe("revoked"); });
  it("remove note + back to empty", () => { openTab("smartid"); click("Create demo tag"); click("Revoke"); click("Yes, revoke"); click("Remove tag"); expect(screen.getByTestId("smartid-note").textContent).toBe(SMARTID_DONE.removed); expect(screen.getByTestId("smartid-empty")).toBeTruthy(); });
  it("empty scan explains", () => { openTab("smartid"); click("Simulate scan"); expect(screen.getByTestId("scan-view").textContent).toMatch(/Paste a QR payload first/); });
  it("scan trims whitespace", () => { active(); type("scan payload", "  stomp://id/demo-tag-01  "); click("Simulate scan"); expect(screen.getByTestId("scan-view").textContent).toBe("Rider: Ted"); });
  it("error clears note", () => { openTab("smartid"); click("Create demo tag"); click("Activate"); expect(screen.queryByTestId("smartid-note")).toBeNull(); expect(screen.getByTestId("woz-error").textContent).toMatch(/Claim it first/); });
  it("NFC write never succeeds", async () => { active(); click(/Write NFC/); expect((await screen.findByTestId("woz-error")).textContent).toMatch(/nothing was written/); expect(nfc.supported).toBe(false); expect(SMART_ID_FLAGS.liveNfc).toBe(false); });
  it("flags line says not supported / off", () => { openTab("smartid"); expect(screen.getByTestId("smartid-flags").textContent).toMatch(/NFC: not supported · Camera scan: off · Network: off/); });
});

describe("session ↔ ride ↔ campfire isolation", () => {
  it("opening campfire from Session doesn't touch ride", () => { openTab("session"); say("start session"); const before = useWoz.getState().ride; useStomp.setState({ screen: "woz" }); useWoz.setState({ tab: "session" }); say("open campfire"); expect(useWoz.getState().campfireOpen).toBe(true); expect(useWoz.getState().ride).toEqual(before); });
  it("closing campfire needs Session confirm, ride unchanged", () => { useWoz.setState({ campfireOpen: true }); openTab("session"); say("start session"); useStomp.setState({ screen: "woz" }); const before = useWoz.getState().ride; say("close campfire"); expect(useWoz.getState().campfireOpen).toBe(true); say("yes"); expect(useWoz.getState().campfireOpen).toBe(false); expect(useWoz.getState().ride).toEqual(before); });
  it("campfire toggle in panel never changes ride", () => { openTab("campfire"); const before = useWoz.getState().ride; click("Open Campfire"); click("Close Campfire"); click("Yes, close"); expect(useWoz.getState().ride).toEqual(before); });
  it("ride controls ignore campfire state", () => { useWoz.setState({ campfireOpen: true }); openTab("ride"); expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(false); click("Start"); expect(useWoz.getState().ride.phase).toBe("active"); expect(useWoz.getState().campfireOpen).toBe(true); });
  it("ending ride leaves campfire open", () => { useWoz.setState({ campfireOpen: true }); openTab("ride"); click("Start"); click("End"); expect(useWoz.getState().campfireOpen).toBe(true); });
  it("stale close prompt dropped when campfire closed elsewhere", () => { useWoz.setState({ campfireOpen: true }); openTab("campfire"); click("Close Campfire"); expect(screen.getByTestId("campfire-close-confirm")).toBeTruthy(); act(() => { useWoz.setState({ campfireOpen: false }); }); expect(screen.queryByTestId("campfire-close-confirm")).toBeNull(); });
  it("Session start while paused explains (no restart)", () => { openTab("session"); say("start session"); useStomp.setState({ screen: "woz" }); say("pause"); const id = useWoz.getState().ride.id; expect(useWoz.getState().ride.phase).toBe("paused"); say("start session"); expect(last()).toBe(RIDE_PAUSED_START); expect(useWoz.getState().ride.id).toBe(id); expect(useWoz.getState().ride.phase).toBe("paused"); });
  it("Session double start keeps one ride", () => { openTab("session"); say("start session"); useStomp.setState({ screen: "woz" }); const id = useWoz.getState().ride.id; say("start session"); expect(useWoz.getState().ride.id).toBe(id); expect(last()).toMatch(/already going/); });
  it("Ride Start disabled while Session ride live", () => { openTab("session"); say("start session"); go("ride"); expect((screen.getByRole("button", { name: "Start" }) as HTMLButtonElement).disabled).toBe(true); });
  it("Session end then Ride Start makes a fresh ride", () => { openTab("session"); say("start session"); useStomp.setState({ screen: "woz" }); const id = useWoz.getState().ride.id; say("im done"); if (useWoz.getState().router.pending) say("yes"); go("ride"); click("Start"); expect(useWoz.getState().ride.phase).toBe("active"); expect(useWoz.getState().ride.id).not.toBe(id); });
  it("ride banner on Session reflects pause from Ride", () => { openTab("ride"); click("Start"); click("Pause"); go("session"); expect(screen.getByTestId("ride-banner").getAttribute("data-phase")).toBe("paused"); });
  it("no banner on Campfire tab", () => { openTab("ride"); click("Start"); go("campfire"); expect(screen.queryByTestId("ride-banner")).toBeNull(); });
});

describe("invite: empty copy, no fake invites", () => {
  it("empty copy is the batch9 text", () => { openTab("crew"); expect(screen.getByTestId("invite-empty").textContent).toBe(INVITE_EMPTY); });
  it("empty copy promises nothing faked", () => expect(INVITE_EMPTY).toMatch(/none are shown or faked/));
  it("adapter lists no invitations", () => { const a = createMirrorInviteUnlinkAdapter(createMirrorEventHub()); expect(a.port.listInvitations("crew-gb" as never)).toEqual([]); });
  it("adapter has no write/send methods", () => { const a = createMirrorInviteUnlinkAdapter(createMirrorEventHub()) as unknown as Record<string, unknown>; for (const k of ["send", "create", "invite", "accept", "revokeInvite"]) expect(a[k]).toBeUndefined(); });
  it("no Demo invite fixtures in source", () => { const src = readFileSync("src/lib/stomp/woz-bridge/invite-adapter.ts", "utf8"); expect(src).not.toMatch(/status:\s*"pending"/); });
  it("CrewLink export unchanged", async () => { const { CREWLINK_SHA, crewLinkSha } = await import("./greet-invite-sha"); expect(crewLinkSha()).toBe(CREWLINK_SHA); });
});
