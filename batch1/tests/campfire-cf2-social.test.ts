/**
 * AF-CF social / membership / leave / Day Sesh boundary tests (fictional data).
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-CF social model + membership", () => {
  it("AF-CF-01 Ava in 2 Squads → 2 Campfires 1:1", () => {
    const w = CF.createWorld();
    const list = CF.listMyCampfires(w, CF.IDS.ava);
    expect(list).toHaveLength(2);
    const names = list.map((c) => c.squadName).sort();
    expect(names).toEqual(["Powder Pals", "Sunrise"]);
    expect(new Set(list.map((c) => c.campfireId)).size).toBe(2);
    expect(list.every((c) => w.squads.get(c.squadId)!.campfireId === c.campfireId)).toBe(true);
  });

  it("AF-CF-02 Sunrise member cannot read Powder Pals (Cal)", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m1", authorId: CF.IDS.ava, squadId: CF.IDS.powder, body: "powder only" }));
    const read = CF.readRecentMessages(w, CF.IDS.cal, CF.IDS.powder);
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error).toBe("not_member");
  });

  it("AF-CF-03 non-member read/post denied", () => {
    const w = CF.createWorld();
    expect(CF.readRecentMessages(w, CF.IDS.vik, CF.IDS.sunrise).ok).toBe(false);
    expect(CF.postMessage(w, { id: "x", authorId: CF.IDS.vik, squadId: CF.IDS.sunrise, body: "nope" }).ok).toBe(false);
  });

  it("AF-CF-04 Day Sesh close → campfireEffects: []", () => {
    const w = CF.createWorld();
    const closed = CF.closeLinkedDaySesh(w);
    expect(closed.campfireEffects).toEqual([]);
    expect(closed.untouched).toBe(true);
    expect(closed.world.campfires.get(CF.IDS.cfSunrise)?.persistent).toBe(true);
  });

  it("AF-CF-05 Trip Viewer ≠ Squad member", () => {
    const w = CF.createWorld();
    expect(w.trip.viewerIds).toContain(CF.IDS.vik);
    expect(
      CF.viewerOrParticipantHasSquadAccess({
        stomperId: CF.IDS.vik,
        memberships: w.memberships,
        squadId: CF.IDS.sunrise,
        isTripViewer: true,
        isDaySeshParticipant: false,
      }),
    ).toBe(false);
  });

  it("AF-CF-06 Quick Share no confirm → nothing", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med1", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.beginQuickShare(w, { intentId: "si1", actorId: CF.IDS.ava, mediaRefId: "med1", squadIds: [CF.IDS.sunrise] }));
    expect(w.links).toHaveLength(0);
    expect(w.shareIntents[0]!.state).toBe("previewing");
  });

  it("AF-CF-07 ShareIntent 2 Squads rejected", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med2", ownerId: CF.IDS.ava, origin: "campfire" }));
    const r = CF.beginQuickShare(w, {
      intentId: "si2",
      actorId: CF.IDS.ava,
      mediaRefId: "med2",
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("multi_recipient");
  });

  it("AF-CF-08 2nd Squad needs own confirm", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med3", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.beginQuickShare(w, { intentId: "si_a", actorId: CF.IDS.ava, mediaRefId: "med3", squadIds: [CF.IDS.sunrise] }));
    w = v(CF.confirmQuickShare(w, "si_a", "lnk_a"));
    expect(w.links).toHaveLength(1);
    w = v(CF.beginQuickShare(w, { intentId: "si_b", actorId: CF.IDS.ava, mediaRefId: "med3", squadIds: [CF.IDS.powder] }));
    expect(w.shareIntents.find((i) => i.id === "si_b")!.state).toBe("previewing");
    expect(w.links.filter((l) => l.squadId === CF.IDS.powder)).toHaveLength(0);
    w = v(CF.confirmQuickShare(w, "si_b", "lnk_b"));
    expect(w.links.filter((l) => l.squadId === CF.IDS.powder)).toHaveLength(1);
  });

  it("AF-CF-09 Sesh voice → prepared only", () => {
    const w = CF.createWorld();
    const a = CF.voiceCommand(w, CF.IDS.ava, "share this clip to Sunrise");
    expect(a.kind).toBe("share_prepare");
    if (a.kind === "share_prepare") {
      expect(a.needsConfirm).toBe(true);
      expect(a.multiRecipient).toBe(false);
    }
  });

  it("AF-CF-15 author delete → tombstone, attachment dropped", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med15", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l15", mediaRefId: "med15", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava, messageId: "m15", body: "clip" }));
    w = v(CF.deleteOwnMessage(w, CF.IDS.ava, "m15" as CF.MessageId));
    const msg = w.messages.find((m) => m.id === "m15")!;
    expect(msg.state).toBe("author_removed");
    expect(msg.body).toBeNull();
    expect(w.links.find((l) => l.id === "l15")!.tombstoned).toBe(true);
  });

  it("AF-CF-16 reaction by non-member denied", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m16", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "hi" }));
    const r = CF.reactToMessage(w, { messageId: "m16" as CF.MessageId, reactorId: CF.IDS.vik, emoji: "🔥" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("not_member");
  });

  it("AF-CF-17 single pin", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m17a", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "a" }));
    w = v(CF.postMessage(w, { id: "m17b", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "b" }));
    w = CF.pinMessage(w, CF.IDS.cfSunrise, "m17a" as CF.MessageId);
    w = CF.pinMessage(w, CF.IDS.cfSunrise, "m17b" as CF.MessageId);
    expect(w.pins.get(CF.IDS.cfSunrise)).toBe("m17b");
    expect(w.messages.find((m) => m.id === "m17a")!.pinned).toBe(false);
    expect(w.messages.find((m) => m.id === "m17b")!.pinned).toBe(true);
  });

  it("AF-CF-18 mute local-only", () => {
    let w = CF.createWorld();
    w = CF.muteUser(w, CF.IDS.ava, CF.IDS.ben);
    expect(w.mutes[0]!.localOnly).toBe(true);
    expect(w.notifications.filter((n) => n.kind === "dm")).toHaveLength(0);
  });

  it("AF-CF-19 report → queued stub, no network", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m19", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "x" }));
    w = CF.reportTarget(w, {
      id: "r19",
      reporterId: CF.IDS.ava,
      target: { kind: "message", id: "m19" },
      reason: "spam",
      evidenceRef: "m19" as CF.MessageId,
    });
    expect(w.reports[0]!.route).toBe("stomp_moderation");
    expect(w.reports[0]!.state).toBe("queued");
    expect(w.reports[0]!.networkCall).toBe(false);
  });

  it("AF-CF-21 youth Gia: Campfire disabled", () => {
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    const w = CF.createWorld();
    expect(w.people.get(CF.IDS.gia)!.accountStatus).toBe("youth");
    // Even if somehow membership existed, account gate denies
    const withMem: CF.CampfireWorld = {
      ...w,
      memberships: [
        ...w.memberships,
        {
          squadId: CF.IDS.sunrise,
          stomperId: CF.IDS.gia,
          role: "member",
          state: "active",
          joinedAt: w.nowIso,
        },
      ],
    };
    expect(CF.readRecentMessages(withMem, CF.IDS.gia, CF.IDS.sunrise).ok).toBe(false);
  });

  it("AF-CF-23 soft cap notice at 20", () => {
    let w = CF.createWorld();
    w = CF.seedMembersToSoftCap(w, CF.IDS.sunrise, 20);
    expect(CF.activeMemberCount(w, CF.IDS.sunrise)).toBe(20);
    w = v(CF.inviteToSquad(w, { id: "inv21", squadId: CF.IDS.sunrise, fromId: CF.IDS.cal, toId: CF.IDS.vik }));
    expect(w.invites.at(-1)!.status).toBe("pending");
    expect(w.softCapNotices).toBeGreaterThanOrEqual(1);
  });

  it("AF-CF-24 reduced-motion Sesh", () => {
    expect(CF.reducedMotionSeshPref(true)).toEqual({ animate: false, reason: "prefers-reduced-motion" });
    expect(CF.reducedMotionSeshPref(false).animate).toBe(true);
  });

  it("AF-CF-25 mic denied → text", () => {
    expect(CF.micDeniedFallback()).toEqual({ mode: "text", voice: false });
  });

  it("AF-CF-26 out-of-scope routes absent", () => {
    for (const r of ["capture_studio", "other_sports", "kiosk", "payments"]) {
      expect(CF.isOutOfScopeRoute(r)).toBe(true);
    }
    expect(CF.isOutOfScopeRoute("campfire")).toBe(false);
  });
});

describe("AF-CF-27–34 multi-Squad / admin / leave", () => {
  it("AF-CF-27 Ava list Campfires exactly 2, 1:1, no cross unread leak", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "ps", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "sunrise" }));
    w = v(CF.postMessage(w, { id: "pp", authorId: CF.IDS.ben, squadId: CF.IDS.powder, body: "powder" }));
    const list = CF.listMyCampfires(w, CF.IDS.ava);
    expect(list).toHaveLength(2);
    const sun = list.find((c) => c.squadId === CF.IDS.sunrise)!;
    const pow = list.find((c) => c.squadId === CF.IDS.powder)!;
    expect(sun.lastMessagePreview).toContain("sunrise");
    expect(pow.lastMessagePreview).toContain("powder");
  });

  it("AF-CF-28 M in Sunrise / Powder feed for Ava / M absent for Cal", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med28", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l28", mediaRefId: "med28", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    const feedAva = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(feedAva.some((f) => f.mediaRefId === "med28")).toBe(true);
    expect(CF.feedForViewer(w, CF.IDS.cal, CF.IDS.powder).ok).toBe(false);
  });

  it("AF-CF-29 same MediaRef two links; unlink one; other intact; clock unchanged", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med29", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-02-01T00:00:00.000Z" }));
    const exp = w.assets.get("med29")!.expiresAt;
    w = v(CF.postMediaToSquad(w, { linkId: "l29a", mediaRefId: "med29", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = v(CF.postMediaToSquad(w, { linkId: "l29b", mediaRefId: "med29", squadId: CF.IDS.powder, postedBy: CF.IDS.ava }));
    w = CF.unlinkOneSquadLink(w, "l29a");
    expect(w.links.find((l) => l.id === "l29a")!.tombstoned).toBe(true);
    expect(w.links.find((l) => l.id === "l29b")!.tombstoned).toBeFalsy();
    expect(w.assets.get("med29")!.expiresAt).toBe(exp);
  });

  it("AF-CF-30 Sunrise notification while viewing Powder — Sunrise label only", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m30", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "ping" }));
    w = v(CF.reactToMessage(w, { messageId: "m30" as CF.MessageId, reactorId: CF.IDS.cal, emoji: "👏" }));
    const n = w.notifications.find((x) => x.kind === "reaction")!;
    expect(n.squadId).toBe(CF.IDS.sunrise);
    expect(n.squadId).not.toBe(CF.IDS.powder);
  });

  it("AF-CF-31 Cal admin invites Eli → created, audit actor=Cal", () => {
    // Eli already in Sunrise — invite Vik instead as new invitee
    let w = CF.createWorld();
    w = v(CF.inviteToSquad(w, { id: "inv31", squadId: CF.IDS.sunrise, fromId: CF.IDS.cal, toId: CF.IDS.vik }));
    expect(w.invites[0]!.status).toBe("pending");
    expect(w.invites[0]!.auditActorId).toBe(CF.IDS.cal);
  });

  it("AF-CF-32 Ben trip host not admin → not_squad_admin", () => {
    const w = CF.createWorld();
    const r = CF.inviteToSquad(w, { id: "inv32", squadId: CF.IDS.sunrise, fromId: CF.IDS.ben, toId: CF.IDS.vik });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("not_squad_admin");
  });

  it("AF-CF-33 Cal admin revoked → invite denied; prior pending stay", () => {
    let w = CF.createWorld();
    w = v(CF.inviteToSquad(w, { id: "inv33a", squadId: CF.IDS.sunrise, fromId: CF.IDS.cal, toId: CF.IDS.vik }));
    w = CF.revokeAdmin(w, CF.IDS.cal, CF.IDS.sunrise);
    const r = CF.inviteToSquad(w, { id: "inv33b", squadId: CF.IDS.sunrise, fromId: CF.IDS.cal, toId: CF.IDS.gia });
    expect(r.ok).toBe(false);
    expect(w.invites.find((i) => i.id === "inv33a")!.status).toBe("pending");
  });

  it("AF-CF-34 Eli leaves → read+post denied; old msgs visible to others", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m34", authorId: CF.IDS.eli, squadId: CF.IDS.sunrise, body: "eli was here" }));
    w = v(CF.leaveSquad(w, CF.IDS.eli, CF.IDS.sunrise));
    expect(CF.readRecentMessages(w, CF.IDS.eli, CF.IDS.sunrise).ok).toBe(false);
    expect(CF.postMessage(w, { id: "m34b", authorId: CF.IDS.eli, squadId: CF.IDS.sunrise, body: "no" }).ok).toBe(false);
    const others = v(CF.readRecentMessages(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(others.items.some((m) => m.id === "m34" && m.body === "eli was here")).toBe(true);
  });

  it("AF-CF-37 20 members / 21st invite allowed + soft notice", () => {
    let w = CF.createWorld();
    w = CF.seedMembersToSoftCap(w, CF.IDS.sunrise, 20);
    w = v(CF.inviteToSquad(w, { id: "inv37", squadId: CF.IDS.sunrise, fromId: CF.IDS.ava, toId: CF.IDS.vik }));
    expect(w.invites.at(-1)!.status).toBe("pending");
    expect(w.softCapNotices).toBeGreaterThanOrEqual(1);
  });
});

describe("AF-CF-60–65 / 67 / 76 Day Sesh + departure + author rights", () => {
  it("AF-CF-60 DS1 linked to Sunrise closes → campfireEffects [], Sunrise unchanged", () => {
    const w = CF.createWorld();
    const before = structuredClone(w.campfires.get(CF.IDS.cfSunrise)!);
    const { world, campfireEffects, untouched } = CF.closeLinkedDaySesh(w);
    expect(campfireEffects).toEqual([]);
    expect(untouched).toBe(true);
    expect(world.campfires.get(CF.IDS.cfSunrise)).toEqual(before);
    expect(world.daySesh.status).toBe("closed");
  });

  it("AF-CF-61 DS1 media / session clock → DEADLINE_UNSPECIFIED, link tombstones only via known bound", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "dsmed61",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshId: CF.IDS.ds1,
        tripBoundIso: null,
      }),
    );
    expect(w.assets.get("dsmed61")!.flag).toBe("DEADLINE_UNSPECIFIED");
    expect(w.assets.get("dsmed61")!.expiresAt).toBeNull();
  });

  it("AF-CF-62 DS1 closes / non-member participants → no Sunrise access", () => {
    const w = CF.createWorld();
    const { world } = CF.closeLinkedDaySesh(w);
    expect(world.daySesh.participantIds).toContain(CF.IDS.vik);
    expect(
      CF.viewerOrParticipantHasSquadAccess({
        stomperId: CF.IDS.vik,
        memberships: world.memberships,
        squadId: CF.IDS.sunrise,
        isTripViewer: false,
        isDaySeshParticipant: true,
      }),
    ).toBe(false);
  });

  it("AF-CF-63 11 mo Squad activity does not extend 12 mo-old message", () => {
    let w = CF.createWorld("2026-01-01T00:00:00.000Z");
    w = v(
      CF.postMessage(w, {
        id: "m63",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "old",
        createdAt: "2025-01-01T00:00:00.000Z",
      }),
    );
    const exp = w.messages.find((m) => m.id === "m63")!.expiresAt;
    w = v(
      CF.postMessage(w, {
        id: "m63b",
        authorId: CF.IDS.ben,
        squadId: CF.IDS.sunrise,
        body: "fresh activity",
        createdAt: "2025-12-01T00:00:00.000Z",
      }),
    );
    expect(w.messages.find((m) => m.id === "m63")!.expiresAt).toBe(exp);
    w = CF.advanceClock(w, "2026-01-02T00:00:00.000Z");
    const page = v(CF.readRecentMessages(w, CF.IDS.ava, CF.IDS.sunrise));
    const old = page.items.find((m) => m.id === "m63")!;
    expect(old.state).toBe("expired");
    expect(old.body).toBeNull();
  });

  it("AF-CF-64 forward/react on text and media → no reset", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "med64", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-01-01T00:00:00.000Z" }));
    const mediaExp = w.assets.get("med64")!.expiresAt;
    w = v(CF.postMessage(w, { id: "m64", authorId: CF.IDS.ava, squadId: CF.IDS.sunrise, body: "text", createdAt: "2026-01-01T00:00:00.000Z" }));
    const textExp = w.messages.find((m) => m.id === "m64")!.expiresAt;
    w = v(CF.reactToMessage(w, { messageId: "m64" as CF.MessageId, reactorId: CF.IDS.ben, emoji: "🔥", at: "2026-02-15T00:00:00.000Z" }));
    w = v(CF.forwardMediaToSquad(w, { linkId: "l64", mediaRefId: "med64", toSquadId: CF.IDS.powder, postedBy: CF.IDS.ava }));
    expect(w.assets.get("med64")!.expiresAt).toBe(mediaExp);
    expect(w.messages.find((m) => m.id === "m64")!.expiresAt).toBe(textExp);
  });

  it("AF-CF-65 Eli left; authored msgs visible; Eli read via own msg denied", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m65", authorId: CF.IDS.eli, squadId: CF.IDS.sunrise, body: "keep me" }));
    w = v(CF.leaveSquad(w, CF.IDS.eli, CF.IDS.sunrise));
    const others = v(CF.readRecentMessages(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(others.items.some((m) => m.id === "m65")).toBe(true);
    expect(CF.readRecentMessages(w, CF.IDS.eli, CF.IDS.sunrise).ok).toBe(false);
  });

  it("AF-CF-67 owner/admin delete other's post → not_author", () => {
    let w = CF.createWorld();
    w = v(CF.postMessage(w, { id: "m67", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "ben" }));
    expect(CF.deleteOwnMessage(w, CF.IDS.ava, "m67" as CF.MessageId).ok).toBe(false);
    expect(CF.deleteOwnMessage(w, CF.IDS.cal, "m67" as CF.MessageId).ok).toBe(false);
  });

  it("AF-CF-76 Viewer after trip end / DS participant → no Squad entitlement leak", () => {
    const w = CF.createWorld();
    expect(
      CF.viewerOrParticipantHasSquadAccess({
        stomperId: CF.IDS.vik,
        memberships: w.memberships,
        squadId: CF.IDS.sunrise,
        isTripViewer: true,
        isDaySeshParticipant: true,
      }),
    ).toBe(false);
  });
});
