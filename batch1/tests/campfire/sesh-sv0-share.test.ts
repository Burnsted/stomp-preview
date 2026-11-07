/**
 * AF-SV-20–25 — one-Squad share, CONFLICT-1, recheck (SV-0).
 * Powder Pals ≈ Park Crew; Sunrise ≈ Mountain Crew. Fictional only.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-SV-20–25 Sesh share / one-Squad (SV-0)", () => {
  it("AF-SV-20 share last photo with Powder → approve → delivered, one link", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "P1",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const store = new CF.PendingStore(() => Date.parse(w.nowIso));
    const pending = store.prepare({
      pendingId: "p_sv20",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.powder,
      contentHash: "P1",
      mediaRefId: "P1" as CF.MediaRefId,
      readbackText: "Share P1 with Powder Pals",
    });
    expect(pending.status).toBe("prepared");

    const claim = CF.claimPendingConfirmation(store, {
      pendingId: "p_sv20",
      actorId: CF.IDS.ava,
      channel: "voice",
      sessionUnlocked: true,
    });
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    const gate = CF.recheckBeforeSend(claim.value, {
      actor: w.people.get(CF.IDS.ava)!,
      memberships: w.memberships,
      squads: w.squads,
      assets: w.assets,
      sessionUnlocked: true,
      nowIso: w.nowIso,
    });
    expect(gate.ok).toBe(true);

    expect(store.markQueued("p_sv20").ok).toBe(true);
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_sv20",
        actorId: CF.IDS.ava,
        mediaRefId: "P1",
        squadIds: [CF.IDS.powder],
      }),
    );
    w = v(CF.confirmQuickShare(w, "si_sv20", "lnk_sv20"));
    expect(w.links.filter((l) => l.mediaRefId === "P1")).toHaveLength(1);
    expect(store.markDelivered("p_sv20").ok).toBe(true);
    expect(CF.characterForPendingStatus(store.get("p_sv20")!.status)).toBe(
      "done",
    );
  });

  it('AF-SV-21 "share to all my Squads" → deny multi_recipient (CONFLICT-1)', () => {
    const action = CF.prepareFromVoice(
      { kind: "post_to_all_squads" },
      CF.IDS.ava,
    );
    expect(action.kind).toBe("denied");
    if (action.kind === "denied") {
      expect(action.reason).toBe("multi_recipient");
      expect(action.message).toMatch(/one Squad/i);
    }
    const parsed = CF.parseVoiceUtterance("share to all my Squads");
    expect(parsed.kind).toBe("post_to_all_squads");
    const fromParse = CF.prepareFromVoice(parsed, CF.IDS.ava);
    expect(fromParse.kind).toBe("denied");
  });

  it("AF-SV-22 wrong recipient cancel → nothing; recipient edit creates new pendingId", () => {
    const store = new CF.PendingStore(() => 20_000_000);
    store.prepare({
      pendingId: "p_wrong",
      actorId: CF.IDS.ava,
      kind: "send_text",
      squadId: CF.IDS.sunrise,
      contentHash: "hello",
      textBody: "hello",
      readbackText: "Send to Sunrise: hello",
    });
    const cancel = CF.applyVoiceConfirm(store, {
      text: "No, cancel",
      actorId: CF.IDS.ava,
    });
    expect(cancel.ok).toBe(true);
    if (cancel.ok) expect(cancel.value.status).toBe("cancelled");

    const next = store.prepare({
      pendingId: "p_right",
      actorId: CF.IDS.ava,
      kind: "send_text",
      squadId: CF.IDS.powder,
      contentHash: "hello",
      textBody: "hello",
      readbackText: "Send to Powder Pals: hello",
    });
    expect(next.pendingId).toBe("p_right");
    expect(next.pendingId).not.toBe("p_wrong");
    expect(store.get("p_wrong")?.status).toBe("cancelled");
  });

  it("AF-SV-23 membership removed between readback and approve → recheck fails, not sent", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "med_sv23",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const store = new CF.PendingStore(() => Date.parse(w.nowIso));
    store.prepare({
      pendingId: "p_sv23",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.powder,
      contentHash: "med_sv23",
      mediaRefId: "med_sv23" as CF.MediaRefId,
      readbackText: "Share with Powder Pals",
    });
    const claim = CF.claimPendingConfirmation(store, {
      pendingId: "p_sv23",
      actorId: CF.IDS.ava,
      channel: "voice",
    });
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    // Revoke Ava from Powder (Park Crew) between confirm and send
    w = {
      ...w,
      memberships: w.memberships.map((m) =>
        m.stomperId === CF.IDS.ava && m.squadId === CF.IDS.powder
          ? { ...m, state: "revoked" as const, leftAt: w.nowIso }
          : m,
      ),
    };
    const gate = CF.recheckBeforeSend(claim.value, {
      actor: w.people.get(CF.IDS.ava)!,
      memberships: w.memberships,
      squads: w.squads,
      assets: w.assets,
      sessionUnlocked: true,
      nowIso: w.nowIso,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error).toBe("not_member");
    expect(store.markRejectedRecheck("p_sv23").ok).toBe(true);
    expect(store.get("p_sv23")!.status).toBe("rejected_recheck");
    expect(CF.characterForPendingStatus("rejected_recheck")).not.toBe("done");
  });

  it('AF-SV-24 last photo P2 expired → "That photo expired"; not shared', () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "P2",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    // Force expiry in the past
    const asset = w.assets.get("P2")!;
    w.assets.set("P2", {
      ...asset,
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    const media = CF.mediaIsUsable(w.assets.get("P2"), w.nowIso);
    expect(media.ok).toBe(false);
    if (!media.ok) {
      expect(media.error).toBe("expired");
      expect(media.message).toMatch(/expired/i);
    }
    const post = CF.postMediaToSquad(w, {
      linkId: "lnk_p2",
      mediaRefId: "P2",
      squadId: CF.IDS.powder,
      postedBy: CF.IDS.ava,
    });
    // World may still allow post of soft-expired; SV-0 recheck blocks share path
    const store = new CF.PendingStore(() => Date.parse(w.nowIso));
    const pending = store.prepare({
      pendingId: "p_sv24",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.powder,
      contentHash: "P2",
      mediaRefId: "P2" as CF.MediaRefId,
      readbackText: "Share P2",
    });
    const claim = v(
      CF.claimPendingConfirmation(store, {
        pendingId: pending.pendingId,
        actorId: CF.IDS.ava,
        channel: "tap",
      }),
    );
    const gate = CF.recheckBeforeSend(claim, {
      actor: w.people.get(CF.IDS.ava)!,
      memberships: w.memberships,
      squads: w.squads,
      assets: w.assets,
      sessionUnlocked: true,
      nowIso: w.nowIso,
    });
    expect(gate.ok).toBe(false);
    void post;
  });

  it("AF-SV-25 P3 deleted between readback & approve → not sent", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "P3",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const store = new CF.PendingStore(() => Date.parse(w.nowIso));
    store.prepare({
      pendingId: "p_sv25",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "P3",
      mediaRefId: "P3" as CF.MediaRefId,
      readbackText: "Share P3",
    });
    const claim = v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_sv25",
        actorId: CF.IDS.ava,
        channel: "voice",
      }),
    );
    // Tombstone media between claim and recheck
    const a = w.assets.get("P3")!;
    w.assets.set("P3", { ...a, localUri: null });
    const gate = CF.recheckBeforeSend(claim, {
      actor: w.people.get(CF.IDS.ava)!,
      memberships: w.memberships,
      squads: w.squads,
      assets: w.assets,
      sessionUnlocked: true,
      nowIso: w.nowIso,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error).toBe("media_deleted");
    store.markRejectedRecheck("p_sv25");
    expect(store.get("p_sv25")!.status).toBe("rejected_recheck");
  });
});
