import { describe, expect, it } from "vitest";
import * as C from "@/lib/stomp/woz-bridge/crew";
import { readFileSync } from "node:fs";

const T = "2026-10-29T12:00:00.000Z";
const crew = [{ code: "AAA111", name: "Ria" }, { code: "BBB222", name: "Jax" }, { code: "CCC333", name: "Nes" }];
const snap = () => C.snapshotFromGb({ riderCode: "ME0001", riderName: "Ted", crew, nowIso: T });

describe("snapshotFromGb", () => {
  it("makes rider the owner", () => expect(snap().crews[0]!.ownerId).toBe(C.sid("ME0001")));
  it("adds every crew mate as active member", () => expect(C.activeCrew(snap())).toHaveLength(4));
  it("crew is private", () => expect(snap().crews[0]!.privacy).toBe("private"));
  it("has no invitations (Invite is GB-owned)", () => expect(snap().invitations).toEqual([]));
  it("dedupes duplicate codes", () => expect(C.activeCrew(C.snapshotFromGb({ riderCode: "ME", riderName: "", crew: [...crew, crew[0]!], nowIso: T }))).toHaveLength(4));
  it("ignores a mate with the rider's own code", () => expect(C.activeCrew(C.snapshotFromGb({ riderCode: "AAA111", riderName: "", crew, nowIso: T }))).toHaveLength(3));
  it("ignores blank codes", () => expect(C.activeCrew(C.snapshotFromGb({ riderCode: "ME", riderName: "", crew: [{ code: "", name: "x" }], nowIso: T }))).toHaveLength(1));
  it("falls back to 'You' for empty rider name", () => expect(C.displayName(C.snapshotFromGb({ riderCode: "", riderName: "", crew: [], nowIso: T }), C.sid("me"))).toBe("You"));
  it("does not mutate GB crew array", () => { const c = structuredClone(crew); C.snapshotFromGb({ riderCode: "ME", riderName: "", crew: c, nowIso: T }); expect(c).toEqual(crew); });
  it("profiles never contain email-like handles", () => expect(snap().profiles.every((p) => !p.handle.includes("@") || p.handle.startsWith("@"))).toBe(true));
  it("displayName returns id when unknown", () => expect(C.displayName(snap(), "zzz")).toBe("zzz"));
});

describe("applyLocalUnlinks", () => {
  it("marks unlinked members left", () => expect(C.activeCrew(C.applyLocalUnlinks(snap(), [C.sid("AAA111")]))).toHaveLength(3));
  it("never unlinks the owner", () => expect(C.activeCrew(C.applyLocalUnlinks(snap(), [C.sid("ME0001")]))).toHaveLength(4));
  it("ignores unknown ids", () => expect(C.activeCrew(C.applyLocalUnlinks(snap(), ["nobody"]))).toHaveLength(4));
  it("keeps history rows", () => expect(C.applyLocalUnlinks(snap(), [C.sid("AAA111")]).memberships).toHaveLength(4));
});

describe("unlink via batch1", () => {
  it("member unlink requires UNLINK phrase", () => {
    const s = snap(); const st = C.beginUnlinkConfirm(C.createUnlinkState(), s, C.GB_CREW_ID, C.sid("BBB222"));
    expect(st.phase).toBe("confirming");
    expect(C.confirmUnlink(st, s, "unlink").state.phase).toBe("confirming");
    expect(C.confirmUnlink(st, s, "UNLINK").state.phase).toBe("unlinked");
  });
  it("unlink result removes member from active list", () => {
    const s = snap(); const st = C.beginUnlinkConfirm(C.createUnlinkState(), s, C.GB_CREW_ID, C.sid("BBB222"));
    expect(C.activeCrew(C.confirmUnlink(st, s, "UNLINK").snapshot)).toHaveLength(3);
  });
  it("non-member unlink errors", () => expect(C.beginUnlinkConfirm(C.createUnlinkState(), snap(), C.GB_CREW_ID, C.sid("ZZZ")).phase).toBe("error"));
  it("owner cannot unlink while others remain", () => expect(C.beginUnlinkConfirm(C.createUnlinkState(), snap(), C.GB_CREW_ID, C.sid("ME0001")).phase).toBe("error"));
  it("cancel resets to idle", () => expect(C.cancelUnlink(C.beginUnlinkConfirm(C.createUnlinkState(), snap(), C.GB_CREW_ID, C.sid("BBB222"))).phase).toBe("idle"));
  it("confirm without begin errors", () => expect(C.confirmUnlink(C.createUnlinkState(), snap(), "UNLINK").state.phase).toBe("error"));
});

describe("owner transfer via batch1", () => {
  it("lists members as candidates", () => expect(C.listTransferCandidates(snap(), C.GB_CREW_ID, C.sid("ME0001"))).toHaveLength(3));
  it("transfer requires TRANSFER phrase", () => {
    const s = snap(); const st = C.beginOwnerTransferConfirm(C.createOwnerTransferState(), s, C.GB_CREW_ID, C.sid("ME0001"), C.sid("AAA111"));
    expect(st.phase).toBe("confirming");
    expect(C.confirmOwnerTransfer(st, s, "nope").state.phase).not.toBe("transferred");
    const r = C.confirmOwnerTransfer(st, s, "TRANSFER");
    expect(r.state.phase).toBe("transferred");
    expect(r.snapshot.crews[0]!.ownerId).toBe(C.sid("AAA111"));
  });
  it("transfer keeps member count", () => {
    const s = snap(); const st = C.beginOwnerTransferConfirm(C.createOwnerTransferState(), s, C.GB_CREW_ID, C.sid("ME0001"), C.sid("AAA111"));
    expect(C.activeCrew(C.confirmOwnerTransfer(st, s, "TRANSFER").snapshot)).toHaveLength(4);
  });
  it("non-owner cannot start transfer", () => expect(C.beginOwnerTransferConfirm(C.createOwnerTransferState(), snap(), C.GB_CREW_ID, C.sid("AAA111"), C.sid("BBB222")).phase).toBe("error"));
  it("cannot transfer to a non-member", () => expect(C.beginOwnerTransferConfirm(C.createOwnerTransferState(), snap(), C.GB_CREW_ID, C.sid("ME0001"), C.sid("ZZZ")).phase).toBe("error"));
  it("cancel resets", () => expect(C.cancelOwnerTransfer(C.beginOwnerTransferConfirm(C.createOwnerTransferState(), snap(), C.GB_CREW_ID, C.sid("ME0001"), C.sid("AAA111"))).phase).toBe("idle"));
});

describe("GB invite adapter", () => {
  it("declares GB as invite owner", () => expect(C.createGbInviteUnlinkAdapter().inviteOwner).toBe("Grok Build"));
  it("invite present (greet.tsx)", () => expect(C.createGbInviteUnlinkAdapter().invitePresent).toBe(true));
  it("source path points at greet.tsx", () => expect(C.INVITE_SOURCE).toBe("src/components/stomp/greet.tsx"));
  it("greet.tsx exists at that path", () => expect(readFileSync(`${process.cwd()}/${C.INVITE_SOURCE}`, "utf8")).toContain("export function Greet"));
  it("logs unlink events locally", () => { const log: string[] = []; C.createGbInviteUnlinkAdapter(log).local.onMemberUnlinked(C.GB_CREW_ID, C.sid("A")); expect(log[0]).toMatch(/^unlinked:/); });
  it("logs transfer events locally", () => { const log: string[] = []; C.createGbInviteUnlinkAdapter(log).local.onOwnerTransferred(C.GB_CREW_ID, C.sid("A"), C.sid("B")); expect(log[0]).toContain("->"); });
  it("pendingInvitesFor filters pending only", () => {
    const s = { ...snap(), invitations: [{ id: "i1", crewId: C.GB_CREW_ID, fromStomperId: C.sid("ME0001"), toDisplayLabel: "x", status: "pending", createdAtIso: T }, { id: "i2", crewId: C.GB_CREW_ID, fromStomperId: C.sid("ME0001"), toDisplayLabel: "y", status: "accepted", createdAtIso: T }] } as unknown as C.LocalCrewStoreSnapshot;
    expect(C.createGbInviteUnlinkAdapter().pendingInvitesFor(s, C.GB_CREW_ID)).toHaveLength(1);
  });
});

describe("privacy", () => {
  const p = () => C.selfProfile("Ted", "ME0001", T);
  it("defaults to only_me", () => expect(p().privacy.profileVisibility).toBe("only_me"));
  it("public profile always false", () => expect(p().privacy.publicProfile).toBe(false));
  it("rejects public profile", () => expect(C.updatePrivacy(p(), { publicProfile: true }).ok).toBe(false));
  it("stranger sees nothing", () => expect(C.viewProfile(p(), "stranger")).toBeNull());
  it("crewmate sees only name when only_me", () => expect(Object.keys(C.viewProfile(p(), "crewmate")!).sort()).toEqual(["displayName", "id"]));
  it("crewmate sees handle when crew visibility", () => { const r = C.updatePrivacy(p(), { profileVisibility: "crew" }); expect(r.ok && C.viewProfile(r.value, "crewmate")!.handle).toBeTruthy(); });
  it("home mountain hidden by default", () => { const r = C.updatePrivacy({ ...p(), homeMountainLabel: "X" }, { profileVisibility: "crew" }); expect(r.ok && C.viewProfile(r.value, "crewmate")!.homeMountainLabel).toBeUndefined(); });
  it("self sees everything", () => expect(C.viewProfile(p(), "self")).toEqual(p()));
  it("selfProfile tolerates odd codes", () => expect(C.selfProfile("", "!!", T).displayName).toBe("Rider"));
  it("selfProfile falls back when name has PII", () => expect(C.selfProfile("ted@example.com", "ME0001", T).displayName).toBe("Rider"));
  it("sync port is disabled", async () => { expect(C.syncPort.enabled).toBe(false); await expect(C.syncPort.push([])).rejects.toThrow(/disabled/); });
  it("queueLocalOp only queues locally", () => expect(C.queueLocalOp([], { opId: "1", kind: "crew.leave", payload: {}, createdAtIso: T })[0]!.status).toBe("queued_local"));
});
