import { describe, expect, it } from "vitest";
import { media as M, mediaFromGbClips, uploadPort, CAMPFIRE_GUARDS, canShareCampfire } from "@/lib/stomp/woz-bridge/campfire";
import { smartId as S, nfc, SMART_ID_FLAGS, demoTag } from "@/lib/stomp/woz-bridge/smartid";
import { FULLCYCLE_GUARDS } from "@/lib/stomp/woz-bridge";

const T = "2026-10-29T12:00:00.000Z";
const gbClips = [{ id: "c1", title: "Boardslide", at: 1 }, { id: "c2", title: "Ollie", at: 2 }];
const must = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => { if (!r.ok) throw new Error(r.error); return r.value; };

describe("campfire", () => {
  it("seeds from GB clips", () => expect(mediaFromGbClips(gbClips, "me", "crew").clips).toHaveLength(2));
  it("seeded clips default to only_me", () => expect(mediaFromGbClips(gbClips, "me", "crew").clips.every((c) => c.share === "only_me")).toBe(true));
  it("seeded clips use local URIs", () => expect(mediaFromGbClips(gbClips, "me", "crew").clips[0]!.localUri.startsWith("local://")).toBe(true));
  it("duplicates skipped", () => expect(mediaFromGbClips([...gbClips, gbClips[0]!], "me", "crew").clips).toHaveLength(2));
  it("trick label from GB title", () => expect(mediaFromGbClips(gbClips, "me", "crew").clips[0]!.trick).toBe("Boardslide"));
  it("crewmate cannot see private clip", () => expect(M.visibleClips(mediaFromGbClips(gbClips, "me", "crew"), "other", ["crew"])).toHaveLength(0));
  it("crewmate sees crew-shared clip", () => { const m = must(M.setShare(mediaFromGbClips(gbClips, "me", "crew"), "c1", "me", "crew")); expect(M.visibleClips(m, "other", ["crew"])).toHaveLength(1); });
  it("outsider never sees crew clip", () => { const m = must(M.setShare(mediaFromGbClips(gbClips, "me", "crew"), "c1", "me", "crew")); expect(M.visibleClips(m, "x", ["other-crew"])).toHaveLength(0); });
  it("public share rejected", () => expect(M.setShare(mediaFromGbClips(gbClips, "me", "crew"), "c1", "me", "public").ok).toBe(false));
  it("non-author cannot change share", () => expect(M.setShare(mediaFromGbClips(gbClips, "me", "crew"), "c1", "other", "crew").ok).toBe(false));
  it("react adds reaction", () => expect(must(M.react(mediaFromGbClips(gbClips, "me", "crew"), { clipId: "c1", by: "me", emoji: "fire" })).reactions).toHaveLength(1));
  it("react unknown clip errors", () => expect(M.react(M.emptyMedia(), { clipId: "zz", by: "me", emoji: "fire" }).ok).toBe(false));
  it("empty comment rejected", () => expect(M.comment(mediaFromGbClips(gbClips, "me", "crew"), { id: "x", clipId: "c1", by: "me", text: " ", atIso: T }).ok).toBe(false));
  it("comment accepted", () => expect(must(M.comment(mediaFromGbClips(gbClips, "me", "crew"), { id: "x", clipId: "c1", by: "me", text: "send it", atIso: T })).comments).toHaveLength(1));
  it("favorite toggles", () => expect(must(M.toggleFavorite(mediaFromGbClips(gbClips, "me", "crew"), "c1")).clips[0]!.favorite).toBe(true));
  it("upload port disabled", async () => { expect(uploadPort.enabled).toBe(false); await expect(uploadPort.upload("c1")).rejects.toThrow(); });
  it("campfire guards: no upload/live share", () => expect([CAMPFIRE_GUARDS.upload, CAMPFIRE_GUARDS.liveShare]).toEqual([false, false]));
  it("campfire not shareable", () => expect(canShareCampfire({} as never)).toBe(false));
  it("recap draft not shareable", () => expect(M.prepareRecap(mediaFromGbClips(gbClips, "me", "crew"), "r1", "me").shareable).toBe(false));
});

describe("smart id", () => {
  const issue = () => must(demoTag("demo-tag-01", "CLAIM-0001", T));
  it("issues unclaimed tag", () => expect(issue().tag.state).toBe("unclaimed"));
  it("claim code not in QR payload", () => expect(must(S.buildQrPayload(issue().tag))).not.toContain("CLAIM"));
  it("credential stores hash only", () => expect(JSON.stringify(issue().credential)).not.toContain("CLAIM-0001"));
  it("bad claim code rejected", () => { const { tag, credential } = issue(); expect(S.claimTag(tag, credential, { code: "nope", stomperId: "me" }).ok).toBe(false); });
  it("claim then reuse rejected", () => { const { tag, credential } = issue(); const r = must(S.claimTag(tag, credential, { code: "CLAIM-0001", stomperId: "me" })); expect(S.claimTag(r.tag, r.credential, { code: "CLAIM-0001", stomperId: "x" }).ok).toBe(false); });
  it("only owner can activate", () => { const { tag, credential } = issue(); const r = must(S.claimTag(tag, credential, { code: "CLAIM-0001", stomperId: "me" })); expect(S.activateTag(r.tag, "other", T).ok).toBe(false); expect(S.activateTag(r.tag, "me", T).ok).toBe(true); });
  it("revoked is terminal", () => { const { tag, credential } = issue(); const c = must(S.claimTag(tag, credential, { code: "CLAIM-0001", stomperId: "me" })); const rv = must(S.revokeTag(c.tag, "me", T)); expect(S.activateTag(rv, "me", T).ok).toBe(false); });
  it("PII slug rejected", () => expect(demoTag("a@b.co", "x", T).ok).toBe(false));
  it("scan unknown payload", () => expect(S.simulateScan("http://evil", [], {}).result).toBe("unknown_tag"));
  it("scan unclaimed", () => expect(S.simulateScan("stomp://id/demo-tag-01", [issue().tag], {}).result).toBe("unclaimed"));
  it("scan active shows display name only", () => {
    const { tag, credential } = issue(); const c = must(S.claimTag(tag, credential, { code: "CLAIM-0001", stomperId: "me" })); const a = must(S.activateTag(c.tag, "me", T));
    const v = S.simulateScan("stomp://id/demo-tag-01", [a], { me: { displayName: "Ted", crewLabel: "Crew", showCrewOnScan: false } });
    expect(v).toEqual({ result: "rider", displayName: "Ted" });
  });
  it("scan claimed-not-active is inactive", () => { const { tag, credential } = issue(); const c = must(S.claimTag(tag, credential, { code: "CLAIM-0001", stomperId: "me" })); expect(S.simulateScan("stomp://id/demo-tag-01", [c.tag], { me: { displayName: "T", showCrewOnScan: false } }).result).toBe("inactive"); });
  it("NFC stub unsupported", async () => { expect(nfc.supported).toBe(false); await expect(nfc.read()).rejects.toThrow(/NFC/); await expect(nfc.write("x")).rejects.toThrow(/NFC/); });
  it("flags all off", () => expect(Object.values(SMART_ID_FLAGS).every((v) => v === false)).toBe(true));
});

describe("global guards", () => {
  for (const [k, v] of Object.entries(FULLCYCLE_GUARDS)) it(`${k} is false`, () => expect(v).toBe(false));
});
