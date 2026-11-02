/**
 * AF-CF block / report / collapse / moderation stub tests.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-CF block + report", () => {
  it("AF-CF-20 block: blocker-only collapse; Ben can't invite Ava", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m20", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "ben says" }));
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(CF.viewMessage(w, CF.IDS.ava, "m20" as CF.MessageId)).toBe("collapsed_for_blocker");
    expect(CF.viewMessage(w, CF.IDS.cal, "m20" as CF.MessageId)).toBe("visible");
    const inv = CF.inviteToSquad(w, { id: "inv20", squadId: CF.IDS.sunrise, fromId: CF.IDS.ben, toId: CF.IDS.ava });
    // Ben is not admin — would fail admin; use Powder where Dee is owner — Ben member
    // Per AF-CF-20: Ben can't invite Ava due to block. Make Ava admin on powder? Use Cal invite path with Ben as from after elevating — simpler: dm/invite from Ben.
    // Direct invite attempt while blocked:
    w = {
      ...w,
      memberships: w.memberships.map((m) =>
        m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.powder
          ? { ...m, role: "admin" as const }
          : m,
      ),
    };
    const inv2 = CF.inviteToSquad(w, { id: "inv20b", squadId: CF.IDS.powder, fromId: CF.IDS.ben, toId: CF.IDS.ava });
    expect(inv2.ok).toBe(true);
    expect(v(inv2).invites.find((i) => i.id === "inv20b")!.status).toBe("silently_denied");
    void inv;
  });

  it("AF-CF-41 Quick Share into Squad containing blocked person: allowed; no targeted notify", () => {
    let w = CF.createWorld();
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    w = v(CF.uploadMedia(w, { id: "m41", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.beginQuickShare(w, { intentId: "si41", actorId: CF.IDS.ava, mediaRefId: "m41", squadIds: [CF.IDS.sunrise] }));
    w = v(CF.confirmQuickShare(w, "si41", "l41"));
    expect(w.links.some((l) => l.id === "l41")).toBe(true);
    const toBen = w.notifications.filter((n) => n.recipientId === CF.IDS.ben && n.kind === "share");
    expect(toBen.every((n) => n.suppressed)).toBe(true);
  });

  it("AF-CF-52 block denies DM/mention/reply; no notify", () => {
    let w = CF.createWorld();
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(CF.dmUser(w, { fromId: CF.IDS.ben, toId: CF.IDS.ava }).ok).toBe(false);
    w = v(CF.mentionUser(w, { fromId: CF.IDS.ben, toId: CF.IDS.ava, squadId: CF.IDS.sunrise }));
    expect(w.notifications.at(-1)!.suppressed).toBe(true);
    w = v(CF.postMessage(w, { id: "m52a", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "thread" }));
    const reply = CF.postMessage(w, {
      id: "m52b",
      authorId: CF.IDS.ben,
      squadId: CF.IDS.sunrise,
      body: "reply",
      replyToId: "m52a" as CF.MessageId,
    });
    expect(reply.ok).toBe(false);
    if (!reply.ok) expect(reply.error).toBe("blocked_target");
  });

  it("AF-CF-53 block denies invite silently", () => {
    let w = CF.createWorld();
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    w = {
      ...w,
      memberships: w.memberships.map((m) =>
        m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.powder
          ? { ...m, role: "admin" as const }
          : m,
      ),
    };
    w = v(CF.inviteToSquad(w, { id: "inv53", squadId: CF.IDS.powder, fromId: CF.IDS.ben, toId: CF.IDS.ava }));
    expect(w.invites.find((i) => i.id === "inv53")!.status).toBe("silently_denied");
    expect(w.notifications.filter((n) => n.kind === "invite").every((n) => n.suppressed)).toBe(true);
  });

  it("AF-CF-54 blocker collapse + explicit reveal", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m54", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "hello" }));
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(CF.viewMessage(w, CF.IDS.ava, "m54" as CF.MessageId)).toBe("collapsed_for_blocker");
    w = CF.revealMessage(w, CF.IDS.ava, "m54" as CF.MessageId);
    expect(CF.viewMessage(w, CF.IDS.ava, "m54" as CF.MessageId)).toBe("revealed_by_blocker");
  });

  it("AF-CF-55 report → STOMP moderation stub; adminAssist optional", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m55", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "x" }));
    w = CF.reportTarget(w, {
      id: "r55",
      reporterId: CF.IDS.ava,
      target: { kind: "message", id: "m55" },
      reason: "abuse",
      evidenceRef: "m55" as CF.MessageId,
      adminAssist: true,
    });
    expect(w.reports[0]!.route).toBe("stomp_moderation");
    expect(w.reports[0]!.adminAssist).toBe(true);
    expect(w.reports[0]!.networkCall).toBe(false);
  });

  it("AF-CF-56 report submitted day 89 → media still expires day 90", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m56", ownerId: CF.IDS.ben, origin: "campfire", uploadedAt: "2026-01-01T00:00:00.000Z" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l56", mediaRefId: "m56", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ben }));
    w = CF.advanceClock(w, CF.addUtcDays("2026-01-01T00:00:00.000Z", 89));
    w = CF.reportTarget(w, {
      id: "r56",
      reporterId: CF.IDS.ava,
      target: { kind: "media", id: "m56" },
      reason: "late",
      evidenceRef: "m56" as CF.MediaRefId,
    });
    expect(CF.reportPausesExpiry(w.reports[0]!)).toBe(false);
    const exp = w.assets.get("m56")!.expiresAt!;
    w = CF.advanceClock(w, exp);
    expect(CF.getLazyMedia(w, "m56")).toBeNull();
  });

  it("AF-CF-68 unrelated member Cal sees Ben's msgs unchanged while Ava blocked Ben", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m68", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "ben" }));
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(CF.viewMessage(w, CF.IDS.cal, "m68" as CF.MessageId)).toBe("visible");
    expect(CF.viewMessage(w, CF.IDS.ava, "m68" as CF.MessageId)).toBe("collapsed_for_blocker");
  });

  it("AF-CF-69 block → no auto removal; Ben not notified", () => {
    let w = CF.createWorld();
    const before = w.memberships.filter((m) => m.stomperId === CF.IDS.ben && m.state === "active").length;
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    const after = w.memberships.filter((m) => m.stomperId === CF.IDS.ben && m.state === "active").length;
    expect(after).toBe(before);
    expect(w.notifications.filter((n) => n.recipientId === CF.IDS.ben)).toHaveLength(0);
  });

  it("AF-CF-70 Ava blocks Ben; applies in Sunrise + Powder; Frost isolation", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m70s", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "s" }));
    w = v(CF.postMessage(w, { id: "m70p", authorId: CF.IDS.ben, squadId: CF.IDS.powder, body: "p" }));
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(CF.viewMessage(w, CF.IDS.ava, "m70s" as CF.MessageId)).toBe("collapsed_for_blocker");
    expect(CF.viewMessage(w, CF.IDS.ava, "m70p" as CF.MessageId)).toBe("collapsed_for_blocker");
    // Frost: Ava not a member — Cal/Dee only; block doesn't invent membership
    expect(CF.readRecentMessages(w, CF.IDS.ava, CF.IDS.frost).ok).toBe(false);
  });

  it("AF-CF-71 Ben reacts to Ava's msg → count to others; no notify/hidden for Ava", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m71", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "ava" }));
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    w = v(CF.reactToMessage(w, { messageId: "m71" as CF.MessageId, reactorId: CF.IDS.ben, emoji: "🔥" }));
    expect(CF.visibleReactionCount(w, CF.IDS.cal, "m71" as CF.MessageId)).toBe(1);
    expect(CF.visibleReactionCount(w, CF.IDS.ava, "m71" as CF.MessageId)).toBe(0);
    const n = w.notifications.find((x) => x.kind === "reaction" && x.recipientId === CF.IDS.ava)!;
    expect(n.suppressed).toBe(true);
  });

  it("AF-CF-72 pre-block old messages collapse for blocker", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m72", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "old", createdAt: "2026-01-01T00:00:00.000Z" }));
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(CF.viewMessage(w, CF.IDS.ava, "m72" as CF.MessageId)).toBe("collapsed_for_blocker");
  });

  it("AF-CF-73 revoked membership keeps block; rejoin re-applies", () => {
    let w = CF.createWorld();
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise));
    expect(w.blocks.some((b) => b.blockerId === CF.IDS.ava && b.blockedId === CF.IDS.ben && !b.inert)).toBe(true);
    // rejoin
    w = {
      ...w,
      memberships: w.memberships.map((m) =>
        m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.sunrise
          ? { ...m, state: "active" as const, leftAt: undefined }
          : m,
      ),
    };
    w = v(CF.postMessage(w, { id: "m73", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "back" }));
    expect(CF.viewMessage(w, CF.IDS.ava, "m73" as CF.MessageId)).toBe("collapsed_for_blocker");
  });

  it("AF-CF-74 blocked/blocker account deleted → block inert, no crash", () => {
    let w = CF.createWorld();
    w = CF.blockUser(w, CF.IDS.ava, CF.IDS.ben);
    w = CF.eraseStomper(w, CF.IDS.ben);
    expect(w.blocks.every((b) => b.inert === true || b.blockedId !== CF.IDS.ben)).toBe(true);
    expect(() => CF.viewMessage(w, CF.IDS.ava, "nope" as CF.MessageId)).not.toThrow();
  });

  it("AF-CF-78 Report/Mute/Leave controls reachable from blocked-person context", () => {
    expect(CF.blockedContextControls()).toEqual(["report", "mute", "leave"]);
  });
});
