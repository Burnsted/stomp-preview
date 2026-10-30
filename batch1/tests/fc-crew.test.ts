import { describe, it, expect } from "vitest";
import * as P from "../src/stompers/profile-privacy";
import * as C from "../src/stompers/crew-store";
import type { CrewId, StomperId } from "../src/stompers/types";
const A = "rider-ash" as StomperId, B = "rider-bix" as StomperId, Z = "rider-zed" as StomperId, K = "crew-k" as CrewId, T = "2026-11-01T10:00:00Z";
const v = <T,>(r: { ok: boolean; value?: T }) => { if (!r.ok) throw new Error(JSON.stringify(r)); return r.value as T; };
const base = () => v(C.createCrew(C.emptySnapshot(), { id: K, name: "Kicker Kids", ownerId: A, nowIso: T }));

describe("rider profiles", () => {
  it("creates with most-private defaults", () => { const p = v(P.createRiderProfile({ id: "r1", displayName: "Ash", handle: "ash_rides", nowIso: T })); expect(p.privacy).toEqual(P.DEFAULT_PRIVACY); expect(p.privacy.profileVisibility).toBe("only_me"); });
  it.each([
    [{ displayName: " ", handle: "abc" }, "empty_name"], [{ displayName: "x".repeat(41), handle: "abc" }, "name_too_long"],
    [{ displayName: "Ash", handle: "AB" }, "bad_handle"], [{ displayName: "Ash", handle: "has space" }, "bad_handle"],
    [{ displayName: "ash@mail.com", handle: "abc" }, "pii_detected"], [{ displayName: "Ash", handle: "abc", bio: "call 555-123-4567" }, "pii_detected"],
  ])("rejects %j -> %s", (i, e) => { const r = P.validateProfileInput(i as any); expect(r.ok).toBe(false); expect((r as any).error).toBe(e); });
  it("trims display name", () => expect(v(P.createRiderProfile({ id: "r", displayName: "  Bix ", handle: "bix", nowIso: T })).displayName).toBe("Bix"));
  it("blocks public profile", () => { const p = v(P.createRiderProfile({ id: "r", displayName: "B", handle: "bix", nowIso: T })); expect(P.updatePrivacy(p, { publicProfile: true }).ok).toBe(false); });
  it("updates other privacy keys and keeps public false", () => { const p = v(P.createRiderProfile({ id: "r", displayName: "B", handle: "bix", nowIso: T })); const u = v(P.updatePrivacy(p, { profileVisibility: "crew", publicProfile: false })); expect(u.privacy.profileVisibility).toBe("crew"); expect(u.privacy.publicProfile).toBe(false); });
  const prof = (vis: "only_me" | "crew", home: boolean) => ({ ...v(P.createRiderProfile({ id: "r", displayName: "B", handle: "bix", homeMountainLabel: "Fictional Peak", bio: "hi", nowIso: T })), privacy: { ...P.DEFAULT_PRIVACY, profileVisibility: vis, showHomeMountain: home } });
  it("stranger sees nothing", () => expect(P.viewProfile(prof("crew", true), "stranger")).toBeNull());
  it("self sees all", () => expect(P.viewProfile(prof("only_me", false), "self")?.homeMountainLabel).toBe("Fictional Peak"));
  it("crewmate sees only name when only_me", () => expect(Object.keys(P.viewProfile(prof("only_me", true), "crewmate")!).sort()).toEqual(["displayName", "id"]));
  it("crewmate sees handle when crew visible", () => expect(P.viewProfile(prof("crew", false), "crewmate")?.handle).toBe("bix"));
  it("home mountain hidden unless opted in", () => expect(P.viewProfile(prof("crew", false), "crewmate")?.homeMountainLabel).toBeUndefined());
  it("home mountain shown when opted in", () => expect(P.viewProfile(prof("crew", true), "crewmate")?.homeMountainLabel).toBe("Fictional Peak"));
  it("defaults are frozen", () => expect(Object.isFrozen(P.DEFAULT_PRIVACY)).toBe(true));
});

describe("crew store", () => {
  it("create crew makes owner membership", () => { const s = base(); expect(s.crews[0]!.privacy).toBe("private"); expect(C.activeMembers(s, K)[0]!.role).toBe("owner"); });
  it("rejects empty crew name", () => expect(C.createCrew(C.emptySnapshot(), { id: "x", name: "  ", ownerId: A, nowIso: T }).ok).toBe(false));
  it("rejects duplicate crew id", () => expect(C.createCrew(base(), { id: K, name: "Dup", ownerId: B, nowIso: T }).ok).toBe(false));
  it("join + double join", () => { const s = v(C.joinCrew(base(), { crewId: K, stomperId: B, nowIso: T })); expect(C.activeMembers(s, K)).toHaveLength(2); expect((C.joinCrew(s, { crewId: K, stomperId: B, nowIso: T }) as any).error).toBe("already_member"); });
  it("join unknown crew", () => expect((C.joinCrew(base(), { crewId: "nope" as CrewId, stomperId: B, nowIso: T }) as any).error).toBe("not_found"));
  it("crew full", () => { let s = base(); for (let i = 0; i < C.MAX_CREW_SIZE - 1; i++) s = v(C.joinCrew(s, { crewId: K, stomperId: `m${i}` as StomperId, nowIso: T })); expect((C.joinCrew(s, { crewId: K, stomperId: Z, nowIso: T }) as any).error).toBe("crew_full"); });
  it("leave (unlink) then relink", () => { let s = v(C.joinCrew(base(), { crewId: K, stomperId: B, nowIso: T })); s = v(C.leaveCrew(s, { crewId: K, stomperId: B, nowIso: T })); expect(C.activeMembers(s, K)).toHaveLength(1); expect(s.memberships.find((m) => m.stomperId === B)!.status).toBe("left"); s = v(C.joinCrew(s, { crewId: K, stomperId: B, nowIso: T })); expect(C.activeMembers(s, K)).toHaveLength(2); expect(s.memberships.filter((m) => m.stomperId === B)).toHaveLength(1); });
  it("removed by owner status", () => { let s = v(C.joinCrew(base(), { crewId: K, stomperId: B, nowIso: T })); s = v(C.leaveCrew(s, { crewId: K, stomperId: B, nowIso: T, removedByOwner: true })); expect(s.memberships.find((m) => m.stomperId === B)!.status).toBe("removed"); });
  it("owner cannot leave", () => expect((C.leaveCrew(base(), { crewId: K, stomperId: A, nowIso: T }) as any).error).toBe("owner_cannot_leave"));
  it("non-member cannot leave", () => expect((C.leaveCrew(base(), { crewId: K, stomperId: Z, nowIso: T }) as any).error).toBe("not_member"));
  it("ownership transfer swaps roles", () => { let s = v(C.joinCrew(base(), { crewId: K, stomperId: B, nowIso: T })); s = v(C.transferOwnership(s, { crewId: K, fromId: A, toId: B })); expect(s.crews[0]!.ownerId).toBe(B); expect(C.activeMembers(s, K).find((m) => m.stomperId === A)!.role).toBe("member"); expect(C.leaveCrew(s, { crewId: K, stomperId: A, nowIso: T }).ok).toBe(true); });
  it.each([[B, A, "not_owner"], [A, A, "invalid_transition"], [A, Z, "not_member"]])("transfer %s->%s fails %s", (f, t, e) => { const s = v(C.joinCrew(base(), { crewId: K, stomperId: B, nowIso: T })); expect((C.transferOwnership(s, { crewId: K, fromId: f as StomperId, toId: t as StomperId }) as any).error).toBe(e); });
  it("transfer unknown crew", () => expect((C.transferOwnership(base(), { crewId: "q" as CrewId, fromId: A, toId: B }) as any).error).toBe("not_found"));
  it("empty state no_crews", () => { expect(C.crewEmptyState(C.emptySnapshot(), A)).toBe("no_crews"); expect(C.crewEmptyState(base(), A)).toBeNull(); });
});

describe("local invitation states (not GB Invite UI)", () => {
  const inv = (exp?: string) => v(C.createLocalInvitation(base(), { id: "i1", crewId: K, fromStomperId: A, toDisplayLabel: "Fictional Friend", nowIso: T, expiresAtIso: exp }));
  it("creates pending", () => expect(inv().invitations[0]!.status).toBe("pending"));
  it("non-member cannot invite", () => expect((C.createLocalInvitation(base(), { id: "i", crewId: K, fromStomperId: Z, toDisplayLabel: "x", nowIso: T }) as any).error).toBe("not_member"));
  it("invite to unknown crew", () => expect((C.createLocalInvitation(base(), { id: "i", crewId: "q" as CrewId, fromStomperId: A, toDisplayLabel: "x", nowIso: T }) as any).error).toBe("not_found"));
  it("accept joins crew", () => { const s = v(C.respondToInvitation(inv(), { invitationId: "i1", to: "accepted", accepterId: B, nowIso: T })); expect(s.invitations[0]!.status).toBe("accepted"); expect(C.activeMembers(s, K).some((m) => m.stomperId === B)).toBe(true); });
  it.each(["declined", "revoked", "expired"] as const)("pending -> %s ok and no membership", (to) => { const s = v(C.respondToInvitation(inv(), { invitationId: "i1", to, nowIso: T })); expect(s.invitations[0]!.status).toBe(to); expect(C.activeMembers(s, K)).toHaveLength(1); });
  it.each(["accepted", "declined", "revoked", "expired"] as const)("terminal %s cannot transition", (st) => { for (const to of ["accepted", "declined", "revoked", "expired"] as const) expect(C.canTransitionInvite(st, to)).toBe(false); });
  it("double accept invalid", () => { const s = v(C.respondToInvitation(inv(), { invitationId: "i1", to: "accepted", accepterId: B, nowIso: T })); expect((C.respondToInvitation(s, { invitationId: "i1", to: "accepted", accepterId: Z, nowIso: T }) as any).error).toBe("invalid_transition"); });
  it("accept after expiry rejected", () => expect((C.respondToInvitation(inv("2026-10-31T00:00:00Z"), { invitationId: "i1", to: "accepted", accepterId: B, nowIso: T }) as any).error).toBe("expired"));
  it("accept respects invites disabled", () => expect((C.respondToInvitation(inv(), { invitationId: "i1", to: "accepted", accepterId: B, nowIso: T, invitesAllowed: false }) as any).error).toBe("invites_disabled"));
  it("accept without accepter", () => expect(C.respondToInvitation(inv(), { invitationId: "i1", to: "accepted", nowIso: T }).ok).toBe(false));
  it("unknown invite", () => expect((C.respondToInvitation(inv(), { invitationId: "zz", to: "declined", nowIso: T }) as any).error).toBe("not_found"));
  it("expireInvitations sweeps only past pending", () => { const s = C.expireInvitations(inv("2026-10-31T00:00:00Z"), T); expect(s.invitations[0]!.status).toBe("expired"); expect(C.expireInvitations(inv(), T).invitations[0]!.status).toBe("pending"); });
});

describe("crew session scheduling", () => {
  const S = () => v(C.joinCrew(base(), { crewId: K, stomperId: B, nowIso: T }));
  const sess = (id: string, s: string, e: string, by = A) => ({ id, crewId: K, title: "Park day", startIso: s, endIso: e, parkLabel: "Fictional Park", createdBy: by });
  const one = () => v(C.scheduleCrewSession([], S(), sess("s1", "2026-11-02T09:00:00Z", "2026-11-02T12:00:00Z")));
  it("schedules with creator going", () => expect(one()[0]!.rsvps[A]).toBe("going"));
  it("bad time", () => expect((C.scheduleCrewSession([], S(), sess("s", "2026-11-02T12:00:00Z", "2026-11-02T09:00:00Z")) as any).error).toBe("bad_time"));
  it("overlap conflict", () => expect((C.scheduleCrewSession(one(), S(), sess("s2", "2026-11-02T11:00:00Z", "2026-11-02T13:00:00Z")) as any).error).toBe("conflict"));
  it("adjacent ok", () => expect(C.scheduleCrewSession(one(), S(), sess("s2", "2026-11-02T12:00:00Z", "2026-11-02T13:00:00Z")).ok).toBe(true));
  it("non-member cannot schedule", () => expect((C.scheduleCrewSession([], S(), sess("s", "2026-11-02T09:00:00Z", "2026-11-02T10:00:00Z", Z)) as any).error).toBe("not_member"));
  it("rsvp member", () => expect(v(C.rsvp(one(), S(), { sessionId: "s1", stomperId: B, answer: "maybe" }))[0]!.rsvps[B]).toBe("maybe"));
  it("rsvp non-member", () => expect(C.rsvp(one(), S(), { sessionId: "s1", stomperId: Z, answer: "going" }).ok).toBe(false));
  it("cancel by non-owner non-creator fails", () => expect((C.cancelCrewSession(one(), S(), { sessionId: "s1", by: B }) as any).error).toBe("not_owner"));
  it("cancel then rsvp fails and slot frees", () => { const l = v(C.cancelCrewSession(one(), S(), { sessionId: "s1", by: A })); expect(C.rsvp(l, S(), { sessionId: "s1", stomperId: B, answer: "going" }).ok).toBe(false); expect(C.scheduleCrewSession(l, S(), sess("s2", "2026-11-02T10:00:00Z", "2026-11-02T11:00:00Z")).ok).toBe(true); });
  it("upcoming sorted and excludes past", () => { let l = one(); l = v(C.scheduleCrewSession(l, S(), sess("s0", "2026-11-01T08:00:00Z", "2026-11-01T09:00:00Z"))); expect(C.upcomingSessions(l, K, T).map((x) => x.id)).toEqual(["s1"]); expect(C.upcomingSessions(l, K, "2026-10-01T00:00:00Z").map((x) => x.id)).toEqual(["s0", "s1"]); });
});

describe("sync prep (disabled)", () => {
  it("port disabled and rejects", async () => { const p = C.createDisabledSyncPort(); expect(p.enabled).toBe(false); await expect(p.push([])).rejects.toThrow(/disabled/); });
  it("enqueue stays local", () => expect(C.enqueueSyncOp([], { opId: "o", kind: "crew.create", payload: {}, createdAtIso: T })[0]!.status).toBe("queued_local"));
});
