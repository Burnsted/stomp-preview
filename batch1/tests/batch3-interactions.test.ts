import { describe, expect, it } from "vitest";
import { createCampfireFixtures, FIXTURE_CAMPFIRE_SESSION } from "../src/campfire/fixtures.js";
import { addClipRef, canShareCampfire, closeCampfireSession, listClips, openCampfireSession, CAMPFIRE_GUARDS } from "../src/campfire/interactions.js";
import { createIdentityFixtureTokens } from "../src/identity/fixtures.js";
import { createTokenFixture, resolveByPayloadLabel, toggleShareInMemory, IDENTITY_GUARDS } from "../src/identity/interactions.js";
import { createExpandedFixtureSnapshot, crewsForStomper, listCrewSessions, FIXTURE_CREW_SESSIONS } from "../src/stompers/crew-session.js";
import { createFixtureSnapshot } from "../src/stompers/fixtures.js";
import { createNoopInviteUnlinkAdapter } from "../src/crew/invite-unlink-adapter.js";
import { CREW_INVITE_STATUS } from "../src/crew/invite-stub.js";
import type { CrewId, StomperId } from "../src/stompers/types.js";

describe("Campfire interactions", () => {
  it("opens, adds, lists clips; stays crew_private, unshareable", () => {
    const base = createCampfireFixtures();
    let b = openCampfireSession(base, { id: "camp_new", crewId: "crew_demo_ridge" as CrewId, title: "Night lap (fictional)", hostStomperId: "stomper_jax" as StomperId, nowIso: "2026-10-29T20:00:00.000Z" });
    b = addClipRef(b, { id: "c2", sessionId: "camp_new", authorStomperId: "stomper_ria" as StomperId, caption: "b", nowIso: "2026-10-29T20:10:00.000Z" });
    b = addClipRef(b, { id: "c1", sessionId: "camp_new", authorStomperId: "stomper_ria" as StomperId, caption: "a", nowIso: "2026-10-29T20:05:00.000Z" });
    expect(listClips(b, "camp_new").map((c) => c.caption)).toEqual(["a", "b"]);
    expect(b.sessions.every((s) => s.visibility === "crew_private" && canShareCampfire(s) === false)).toBe(true);
    expect(base.sessions).toHaveLength(1);
    expect(CAMPFIRE_GUARDS.liveShare).toBe(false);
  });
  it("rejects clips on ended/unknown sessions", () => {
    const b = createCampfireFixtures();
    expect(() => addClipRef(b, { id: "x", sessionId: FIXTURE_CAMPFIRE_SESSION.id, authorStomperId: "stomper_ria" as StomperId, caption: "", nowIso: "t" })).toThrow(/ended/);
    expect(() => addClipRef(b, { id: "x", sessionId: "nope", authorStomperId: "stomper_ria" as StomperId, caption: "", nowIso: "t" })).toThrow();
    const opened = openCampfireSession(b, { id: "s2", crewId: "crew_demo_ridge" as CrewId, title: "t", hostStomperId: "stomper_ria" as StomperId, nowIso: "t" });
    expect(closeCampfireSession(opened, "s2", "t2").sessions[1].endedAtIso).toBe("t2");
  });
});

describe("QR/NFC identity interactions", () => {
  it("creates token with share off, toggles in memory, resolves by label", () => {
    const t = createTokenFixture({ stomperId: "stomper_kip" as StomperId, channel: "nfc", slug: "sample-bowl/kip", nowIso: "t" });
    expect(t.shareEnabled).toBe(false);
    const on = toggleShareInMemory(t);
    expect(on.shareEnabled).toBe(true);
    expect(t.shareEnabled).toBe(false);
    expect(resolveByPayloadLabel(createIdentityFixtureTokens(), " local-qr:demo-ridge/jax ")?.stomperId).toBe("stomper_jax");
    expect(resolveByPayloadLabel([t], "missing")).toBeUndefined();
    expect(IDENTITY_GUARDS).toEqual({ liveNfc: false, liveCamera: false, networkShare: false });
  });
});

describe("Expanded STOMPERS + crew sessions", () => {
  it("adds a second fictional crew without changing base fixtures", () => {
    const x = createExpandedFixtureSnapshot();
    expect(x.profiles).toHaveLength(6);
    expect(x.crews.map((c) => c.privacy)).toEqual(["private", "private"]);
    expect(createFixtureSnapshot().profiles).toHaveLength(3);
    expect(crewsForStomper(x, "stomper_nes" as StomperId)).toHaveLength(2);
    expect(listCrewSessions("crew_sample_bowl" as CrewId)[0].parkDayLabel).toMatch(/Park Day/);
    expect(FIXTURE_CREW_SESSIONS.every((s) => !JSON.stringify(s).includes("@"))).toBe(true);
  });
  it("adapter is no-op and does not claim Invite", () => {
    const a = createNoopInviteUnlinkAdapter();
    expect(a.inviteOwner).toBe("Grok Build");
    expect(a.invitePresent).toBe(false);
    expect(CREW_INVITE_STATUS.presentInThisTip).toBe(false);
    expect(a.pendingInvitesFor(createFixtureSnapshot(), "crew_demo_ridge" as CrewId)).toHaveLength(1);
  });
});
