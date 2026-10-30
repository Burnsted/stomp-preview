import { describe, it, expect } from "vitest";
import * as M from "../src/media/crew-dump";
import * as S from "../src/smartid/smart-id";
import * as Core from "../src/core/result";
import * as Idx from "../src/index";
import { CREW_INVITE_STATUS, CREW_INVITE_GB_PATH } from "../src/crew/invite-stub";
const T = "2026-11-01T10:00:00Z";
const v = <T,>(x: { ok: boolean; value?: T }) => { if (!x.ok) throw new Error(JSON.stringify(x)); return x.value as T; };
const clip = (id: string, o: Partial<M.ClipMeta> = {}) => ({ id, kind: "video" as const, localUri: `mock://${id}.mp4`, authorId: "a", crewId: "k", createdAtIso: T, ...o });
const m2 = () => v(M.addClip(v(M.addClip(M.emptyMedia(), clip("c1", { trick: "50-50", rideSessionId: "s1", tags: ["Rail"] }))), clip("c2", { authorId: "b", trick: "50-50", rideSessionId: "s1", createdAtIso: "2026-11-01T11:00:00Z" })));

describe("crew dump media", () => {
  it("default share only_me", () => expect(m2().clips.every((c) => c.share === "only_me")).toBe(true));
  it.each(["https://cdn.example/x.mp4", "s3://bucket/x", "ftp://x"])("rejects remote uri %s", (u) => expect((M.addClip(M.emptyMedia(), clip("x", { localUri: u })) as any).error).toBe("remote_uri"));
  it("duplicate clip", () => expect(M.addClip(m2(), clip("c1")).ok).toBe(false));
  it("tags lowercased + dedup", () => { const m = v(M.tagClip(v(M.tagClip(m2(), "c1", "RAIL")), "c1", "park")); expect(m.clips[0]!.tags).toEqual(["rail", "park"]); });
  it("favorite toggle", () => expect(v(M.toggleFavorite(m2(), "c1")).clips[0]!.favorite).toBe(true));
  it("tag missing clip", () => expect(M.tagClip(m2(), "zz", "x").ok).toBe(false));
  it("public share blocked", () => expect((M.setShare(m2(), "c1", "a", "public") as any).error).toBe("public_not_allowed"));
  it("only author may change share", () => expect((M.setShare(m2(), "c1", "b", "crew") as any).error).toBe("not_author"));
  it("visibility: crewmate sees only crew-shared", () => { const m = v(M.setShare(m2(), "c1", "a", "crew")); expect(M.visibleClips(m, "b", ["k"]).map((c) => c.id).sort()).toEqual(["c1", "c2"]); expect(M.visibleClips(m2(), "b", ["k"]).map((c) => c.id)).toEqual(["c2"]); });
  it("visibility: outsider sees none", () => expect(M.visibleClips(v(M.setShare(m2(), "c1", "a", "crew")), "z", ["other"])).toEqual([]));
  it("album requires crew-shared clip", () => { const m = v(M.createAlbum(m2(), { id: "al", crewId: "k", title: "Dump", nowIso: T })); expect((M.addToAlbum(m, "al", "c1") as any).error).toBe("not_shared"); const m3 = v(M.addToAlbum(v(M.setShare(m, "c1", "a", "crew")), "al", "c1")); expect(m3.albums[0]!.clipIds).toEqual(["c1"]); expect(M.addToAlbum(m3, "al", "c1").ok).toBe(false); });
  it("album empty title", () => expect(M.createAlbum(m2(), { id: "a", crewId: "k", title: " ", nowIso: T }).ok).toBe(false));
  it("album missing", () => expect(M.addToAlbum(m2(), "none", "c1").ok).toBe(false));
  it("organize by tag/sort", () => { expect(M.organize(m2().clips, { tag: "RAIL" }).map((c) => c.id)).toEqual(["c1"]); expect(M.organize(m2().clips).map((c) => c.id)).toEqual(["c2", "c1"]); expect(M.organize(m2().clips, { sort: "oldest" })[0]!.id).toBe("c1"); });
  it("organize favorites first", () => expect(M.organize(v(M.toggleFavorite(m2(), "c1")).clips, { sort: "favorites" })[0]!.id).toBe("c1"));
  it("organize by trick/session", () => { expect(M.organize(m2().clips, { trick: "50-50" })).toHaveLength(2); expect(M.organize(m2().clips, { rideSessionId: "nope" })).toHaveLength(0); });
  it("reaction replaces same user", () => { let m = v(M.react(m2(), { clipId: "c1", by: "b", emoji: "fire" })); m = v(M.react(m, { clipId: "c1", by: "b", emoji: "goat" })); expect(m.reactions).toEqual([{ clipId: "c1", by: "b", emoji: "goat" }]); });
  it("react unknown clip", () => expect(M.react(m2(), { clipId: "x", by: "b", emoji: "fire" }).ok).toBe(false));
  it.each([["", "empty"], ["x".repeat(281), "too_long"]])("comment invalid", (t, e) => expect((M.comment(m2(), { id: "cm", clipId: "c1", by: "b", text: t, atIso: T }) as any).error).toBe(e));
  it("comment ok trimmed", () => expect(v(M.comment(m2(), { id: "cm", clipId: "c1", by: "b", text: " sick ", atIso: T })).comments[0]!.text).toBe("sick"));
  it("playlist association", () => { let m = v(M.createPlaylist(m2(), { id: "p", name: "Park mix", trackLabels: ["Track A"] })); m = v(M.associatePlaylist(m, "c1", "p")); expect(m.clips[0]!.playlistId).toBe("p"); m = v(M.associatePlaylist(m, "c1", null)); expect(m.clips[0]!.playlistId).toBeUndefined(); });
  it("associate unknown playlist", () => expect(M.associatePlaylist(m2(), "c1", "nope").ok).toBe(false));
  it("playlist empty name/dup", () => { expect(M.createPlaylist(m2(), { id: "p", name: "", trackLabels: [] }).ok).toBe(false); const m = v(M.createPlaylist(m2(), { id: "p", name: "x", trackLabels: [] })); expect(M.createPlaylist(m, { id: "p", name: "y", trackLabels: [] }).ok).toBe(false); });
  it("recap respects privacy and is not shareable", () => { const r = M.prepareRecap(m2(), "s1", "a"); expect(r.clipIds).toEqual(["c1"]); expect(r.shareable).toBe(false); expect(r.status).toBe("draft_local"); expect(r.topTrick).toBe("50-50"); });
  it("recap counts reactions on visible clips only", () => { const m = v(M.react(m2(), { clipId: "c2", by: "a", emoji: "fire" })); expect(M.prepareRecap(m, "s1", "a").reactionCount).toBe(0); expect(M.prepareRecap(m, "s1", "b").reactionCount).toBe(1); });
  it("upload port disabled", async () => { const u = M.createDisabledUploadPort(); expect(u.enabled).toBe(false); await expect(u.upload("c1")).rejects.toThrow(/disabled/); });
});

describe("smart id", () => {
  const issued = () => v(S.issueTag({ tagId: "t1", publicSlug: "frosty-otter-42", claimCode: "CLAIM-9X", nowIso: T }));
  const claimed = () => { const i = issued(); return v(S.claimTag(i.tag, i.credential, { code: "CLAIM-9X", stomperId: "rider-ash" })); };
  const activeT = () => v(S.activateTag(claimed().tag, "rider-ash", T));
  it("issues unclaimed with hashed credential", () => { const i = issued(); expect(i.tag.state).toBe("unclaimed"); expect(i.credential.claimCodeHash).not.toContain("CLAIM-9X"); });
  it("QR payload excludes claim code + owner", () => { const p = v(S.buildQrPayload(activeT())); expect(p).toBe("stomp://id/frosty-otter-42"); expect(p).not.toMatch(/CLAIM|rider-ash/); });
  it.each(["ash@mail.com", "Upper Case", "ab", "x".repeat(40)])("rejects bad slug %s", (slug) => expect(S.issueTag({ tagId: "t", publicSlug: slug, claimCode: "c", nowIso: T }).ok).toBe(false));
  it("rejects claim code embedded in slug", () => expect(S.issueTag({ tagId: "t", publicSlug: "code-1234", claimCode: "1234", nowIso: T }).ok).toBe(false));
  it.each(["https://x/frosty", "stomp://id/", "stomp://id/BAD SLUG", "junk"])("parse bad payload %s", (p) => expect(S.parseQrPayload(p).ok).toBe(false));
  it("parse roundtrip", () => expect(v(S.parseQrPayload("stomp://id/frosty-otter-42"))).toBe("frosty-otter-42"));
  it("claim sets owner and burns credential", () => { const c = claimed(); expect(c.tag.ownerStomperId).toBe("rider-ash"); expect(c.credential.used).toBe(true); });
  it("wrong code", () => { const i = issued(); expect((S.claimTag(i.tag, i.credential, { code: "nope", stomperId: "x" }) as any).error).toBe("bad_code"); });
  it("credential reuse", () => { const c = claimed(); expect((S.claimTag(issued().tag, c.credential, { code: "CLAIM-9X", stomperId: "y" }) as any).error).toBe("already_used"); });
  it("credential for other tag", () => { const i = issued(); expect((S.claimTag({ ...i.tag, tagId: "t2" }, i.credential, { code: "CLAIM-9X", stomperId: "y" }) as any).error).toBe("not_found"); });
  it("activate only by owner", () => expect((S.activateTag(claimed().tag, "rider-bix", T) as any).error).toBe("not_owner"));
  it("cannot activate unclaimed", () => expect(S.activateTag(issued().tag, "x", T).ok).toBe(false));
  it("suspend + reactivate", () => { const s = v(S.suspendTag(activeT(), "rider-ash")); expect(s.state).toBe("suspended"); expect(v(S.activateTag(s, "rider-ash", T)).state).toBe("active"); });
  it("revoke terminal", () => { const r = v(S.revokeTag(activeT(), "rider-ash", T)); expect(r.state).toBe("revoked"); expect((S.activateTag(r, "rider-ash", T) as any).error).toBe("revoked"); });
  it("revoke unclaimed (lost card)", () => expect(v(S.revokeTag(issued().tag, "anyone", T)).state).toBe("revoked"));
  it("non-owner cannot revoke claimed", () => expect(S.revokeTag(activeT(), "rider-bix", T).ok).toBe(false));
  it.each(Object.entries(S.SMART_ID_TRANSITIONS))("transition table %s", (from, tos) => { if (from === "revoked") expect(tos).toEqual([]); else expect(tos).toContain("revoked"); });
  const dir = { "rider-ash": { displayName: "Ash", crewLabel: "Kicker Kids", showCrewOnScan: false } };
  it("scan active shows display name only", () => expect(S.simulateScan("stomp://id/frosty-otter-42", [activeT()], dir)).toEqual({ result: "rider", displayName: "Ash" }));
  it("scan shows crew if opted in", () => expect(S.simulateScan("stomp://id/frosty-otter-42", [activeT()], { "rider-ash": { ...dir["rider-ash"], showCrewOnScan: true } })).toMatchObject({ crewLabel: "Kicker Kids" }));
  it.each([
    [() => issued().tag, "unclaimed"], [() => claimed().tag, "inactive"], [() => v(S.suspendTag(activeT(), "rider-ash")), "inactive"], [() => v(S.revokeTag(activeT(), "rider-ash", T)), "revoked"],
  ])("scan state %#", (f, res) => expect(S.simulateScan("stomp://id/frosty-otter-42", [f()], dir).result).toBe(res));
  it("scan unknown / garbage", () => { expect(S.simulateScan("stomp://id/other-slug", [activeT()], dir).result).toBe("unknown_tag"); expect(S.simulateScan("garbage", [activeT()], dir).result).toBe("unknown_tag"); });
  it("scan never leaks ids/credential", () => { const out = JSON.stringify(S.simulateScan("stomp://id/frosty-otter-42", [activeT()], dir)); expect(out).not.toMatch(/rider-ash|mock-|t1/); });
  it("nfc stub unsupported", async () => { const n = S.createNfcStub(); expect(n.supported).toBe(false); await expect(n.read()).rejects.toThrow(); await expect(n.write("x")).rejects.toThrow(); });
  it("mockHash deterministic", () => expect(S.mockHash("a")).toBe(S.mockHash("a")));
});

describe("integration guards / regression", () => {
  it("all full-cycle guards false", () => expect(Object.values(Core.FULLCYCLE_GUARDS).every((x) => x === false)).toBe(true));
  it.each([["a@b.co", true], ["+1 (555) 123-4567", true], ["Fictional Peak", false], ["rider_42", false]])("pii %s", (s, e) => expect(Core.looksLikePii(s)).toBe(e));
  it("GB Crew Invite still a pointer, absent here", () => { expect(CREW_INVITE_STATUS.presentInThisTip).toBe(false); expect(CREW_INVITE_STATUS.owner).toBe("Grok Build"); expect(CREW_INVITE_GB_PATH).toBe("src/components/stomp/greet.tsx"); });
  it("index exposes namespaced full-cycle modules", () => { for (const k of ["core", "jsonStore", "riderProfiles", "crewStore", "voice", "ride", "media", "smartId"]) expect((Idx as any)[k]).toBeTruthy(); });
  it("legacy batch exports intact", () => { expect(typeof Idx.parseSessionCommand).toBe("function"); expect(typeof Idx.confirmUnlink).toBe("function"); });
});
