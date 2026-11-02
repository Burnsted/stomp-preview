/**
 * AF-CF media / retention / share / Feed tests (fictional data).
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-CF media + retention", () => {
  it("AF-CF-10 trip link keeps MediaRef id + expiresAt", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "trip10", ownerId: CF.IDS.ava, origin: "trip_drop" }));
    const before = w.assets.get("trip10")!;
    const deadline = CF.mediaViewerDeadline({
      id: w.trip.id,
      status: w.trip.status,
      officialEndDate: w.trip.officialEndDate,
      scheduledEndAt: w.trip.scheduledEndAt,
    });
    expect(before.expiresAt).toBe(deadline.deadlineIso);
    w = v(CF.postMediaToSquad(w, { linkId: "lt10", mediaRefId: "trip10", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    expect(w.assets.get("trip10")!.id).toBe("trip10");
    expect(w.assets.get("trip10")!.expiresAt).toBe(before.expiresAt);
  });

  it("AF-CF-11 trip expiry → tombstone Campfire+Feed", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "trip11", ownerId: CF.IDS.ava, origin: "trip_drop" }));
    w = v(CF.postMediaToSquad(w, { linkId: "lt11", mediaRefId: "trip11", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    const exp = w.assets.get("trip11")!.expiresAt!;
    w = CF.advanceClock(w, exp);
    expect(CF.getLazyMedia(w, "trip11")).toBeNull();
    const feed = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.sunrise));
    const item = feed.find((f) => f.mediaRefId === "trip11")!;
    expect(item.render).toBe("tombstone");
    expect(item.localUri).toBeNull();
  });

  it("AF-CF-12 trip extension moves expiry via Trip only, ≤ end+45", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "trip12", ownerId: CF.IDS.ava, origin: "trip_drop" }));
    const old = w.assets.get("trip12")!.expiresAt!;
    w = CF.extendTripOfficialEnd(w, "2026-03-01T00:00:00.000Z");
    const next = w.assets.get("trip12")!.expiresAt!;
    expect(next > old).toBe(true);
    const expected = CF.addUtcDays("2026-03-01T00:00:00.000Z", CF.VIEWER_MEDIA_MAX_DAYS);
    expect(next).toBe(expected);
    // Share must not have been the mover — clock came from Trip
    expect(CF.VIEWER_MEDIA_MAX_DAYS).toBe(45);
  });

  it("AF-CF-13 standalone media tombstones at upload+90 d", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "m13",
        ownerId: CF.IDS.ava,
        origin: "campfire",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    expect(w.assets.get("m13")!.expiresAt).toBe(CF.addUtcDays("2026-01-01T00:00:00.000Z", 90));
    w = v(CF.postMediaToSquad(w, { linkId: "l13", mediaRefId: "m13", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = CF.advanceClock(w, "2026-04-02T00:00:00.000Z");
    expect(CF.getLazyMedia(w, "m13")).toBeNull();
  });

  it("AF-CF-14 text expires at createdAt+12 mo; no report exemption", () => {
    let w = CF.createWorld("2026-01-01T00:00:00.000Z");
    w = v(
      CF.postMessage(w, {
        id: "t14",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "year old soon",
        createdAt: "2025-01-01T00:00:00.000Z",
      }),
    );
    w = CF.reportTarget(w, {
      id: "r14",
      reporterId: CF.IDS.ben,
      target: { kind: "message", id: "t14" },
      reason: "test",
      evidenceRef: "t14" as CF.MessageId,
    });
    expect(CF.reportPausesExpiry(w.reports[0]!)).toBe(false);
    w = CF.advanceClock(w, "2026-01-01T00:00:00.000Z");
    const page = v(CF.readRecentMessages(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(page.items.find((m) => m.id === "t14")!.state).toBe("expired");
  });

  it("AF-CF-22 Feed = same records, no duplicate store", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m22", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l22", mediaRefId: "m22", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    const feed = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(feed[0]!.mediaLinkId).toBe("l22");
    expect(w.links.filter((l) => l.id === "l22")).toHaveLength(1);
    expect(w.assets.size).toBe(1);
  });

  it("AF-CF-38 share clip / intent opens / preview fields", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m38", ownerId: CF.IDS.ava, origin: "campfire", bytesLabel: "thumb38" }));
    w = v(CF.beginQuickShare(w, { intentId: "si38", actorId: CF.IDS.ava, mediaRefId: "m38", squadIds: [CF.IDS.sunrise] }));
    const p = w.shareIntents[0]!.preview;
    expect(p.squadName).toBe("Sunrise");
    expect(p.memberCount).toBeGreaterThan(0);
    expect(p.thumbLabel).toBe("thumb38");
    expect(p.expiresAt).toBeTruthy();
  });

  it("AF-CF-39 preview open / cancel → nothing posted", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m39", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.beginQuickShare(w, { intentId: "si39", actorId: CF.IDS.ava, mediaRefId: "m39", squadIds: [CF.IDS.sunrise] }));
    w = v(CF.cancelQuickShare(w, "si39"));
    expect(w.shareIntents[0]!.state).toBe("cancelled");
    expect(w.links).toHaveLength(0);
  });

  it("AF-CF-40 trip media 10d left / share preview shows trip expiry; MediaRef unchanged", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m40", ownerId: CF.IDS.ava, origin: "trip_drop" }));
    const exp = w.assets.get("m40")!.expiresAt;
    w = v(CF.beginQuickShare(w, { intentId: "si40", actorId: CF.IDS.ava, mediaRefId: "m40", squadIds: [CF.IDS.sunrise] }));
    expect(w.shareIntents[0]!.preview.expiresAt).toBe(exp);
    expect(w.shareIntents[0]!.preview.expirySource).toBe("trip_drop_45d");
    expect(w.assets.get("m40")!.id).toBe("m40");
  });

  it("AF-CF-42 standalone 90 d tombstone in Feed", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m42", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-01-01T00:00:00.000Z" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l42", mediaRefId: "m42", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = CF.advanceClock(w, CF.addUtcDays("2026-01-01T00:00:00.000Z", 90));
    const feed = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(feed[0]!.render).toBe("tombstone");
    expect(feed[0]!.localUri).toBeNull();
  });

  it("AF-CF-43 standalone day 60 / reposted / expiresAt unchanged", () => {
    let w = CF.createWorld("2026-03-02T00:00:00.000Z");
    w = v(CF.uploadMedia(w, { id: "m43", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-01-01T00:00:00.000Z" }));
    const exp = w.assets.get("m43")!.expiresAt;
    w = v(CF.postMediaToSquad(w, { linkId: "l43a", mediaRefId: "m43", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = v(CF.forwardMediaToSquad(w, { linkId: "l43b", mediaRefId: "m43", toSquadId: CF.IDS.powder, postedBy: CF.IDS.ava }));
    expect(w.assets.get("m43")!.expiresAt).toBe(exp);
  });

  it("AF-CF-44 trip media linked → end+45, never 90d", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m44", ownerId: CF.IDS.ava, origin: "trip_drop" }));
    const exp = w.assets.get("m44")!.expiresAt!;
    const ninety = CF.addUtcDays(w.assets.get("m44")!.uploadedAt, 90);
    const trip = CF.addUtcDays(w.trip.officialEndDate!, 45);
    expect(exp).toBe(trip);
    expect(exp).not.toBe(ninety);
  });

  it("AF-CF-45 re-upload = new MediaRef + new clock", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m45a", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-01-01T00:00:00.000Z", bytesLabel: "same-bytes" }));
    w = v(CF.uploadMedia(w, { id: "m45b", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-02-01T00:00:00.000Z", bytesLabel: "same-bytes" }));
    expect(w.assets.get("m45a")!.expiresAt).not.toBe(w.assets.get("m45b")!.expiresAt);
    expect(w.assets.size).toBe(2);
  });

  it("AF-CF-46 DS+trip → min, never extended", () => {
    let w = CF.createWorld();
    const tripBound = CF.mediaViewerDeadline({
      id: w.trip.id,
      status: w.trip.status,
      officialEndDate: w.trip.officialEndDate,
      scheduledEndAt: w.trip.scheduledEndAt,
    }).deadlineIso;
    w = v(
      CF.uploadMedia(w, {
        id: "m46",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshId: CF.IDS.ds1,
        tripBoundIso: tripBound,
        trip: {
          id: w.trip.id,
          status: w.trip.status,
          officialEndDate: w.trip.officialEndDate,
          scheduledEndAt: w.trip.scheduledEndAt,
        },
      }),
    );
    expect(w.assets.get("m46")!.flag).toBe("DEADLINE_UNSPECIFIED");
    expect(w.assets.get("m46")!.expiresAt).toBe(tripBound);
  });

  it("AF-CF-47 expired tombstone identical Feed+Campfire", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m47", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2025-01-01T00:00:00.000Z" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l47", mediaRefId: "m47", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = CF.advanceClock(w, "2026-06-01T00:00:00.000Z");
    const campfireUri = CF.getLazyMedia(w, "m47");
    const feed = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.sunrise));
    expect(CF.identicalTombstone(campfireUri, feed[0]!.localUri)).toBe(true);
  });

  it("AF-CF-66 author deletes post → gone in Campfire + Feed + reply quote tombstone", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m66", ownerId: CF.IDS.ava, origin: "campfire" }));
    w = v(CF.postMediaToSquad(w, { linkId: "l66", mediaRefId: "m66", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava, messageId: "msg66", body: "orig" }));
    w = v(CF.postMessage(w, { id: "reply66", authorId: CF.IDS.ben, squadId: CF.IDS.sunrise, body: "re", replyToId: "msg66" as CF.MessageId }));
    w = v(CF.deleteOwnMessage(w, CF.IDS.ava, "msg66" as CF.MessageId));
    const page = v(CF.readRecentMessages(w, CF.IDS.ben, CF.IDS.sunrise));
    expect(page.items.find((m) => m.id === "msg66")!.state).toBe("author_removed");
    const feed = v(CF.feedForViewer(w, CF.IDS.ben, CF.IDS.sunrise));
    // tombstoned link dropped from active feed content
    expect(w.links.find((l) => l.id === "l66")!.tombstoned).toBe(true);
    expect(feed.every((f) => f.mediaLinkId !== "l66" || f.render === "tombstone")).toBe(true);
    const quote = CF.replyQuoteTombstone(w, "reply66" as CF.MessageId);
    expect(quote.parentRender).toBe("tombstone");
    expect(quote.body).toBeNull();
  });

  it("AF-CF-75 Day Sesh media without exact deadline → DEADLINE_UNSPECIFIED", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m75", ownerId: CF.IDS.ava, origin: "day_sesh", tripBoundIso: null }));
    expect(w.assets.get("m75")!.flag).toBe("DEADLINE_UNSPECIFIED");
    expect(w.assets.get("m75")!.expiresAt).toBeNull();
    expect(CF.daySeshMediaDeadline().flag).toBe("DEADLINE_UNSPECIFIED");
  });

  it("AF-CF-77 cross-Squad media expiry isolation (unlink one)", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "m77", ownerId: CF.IDS.ava, origin: "campfire", uploadedAt: "2026-01-01T00:00:00.000Z" }));
    const exp = w.assets.get("m77")!.expiresAt;
    w = v(CF.postMediaToSquad(w, { linkId: "l77a", mediaRefId: "m77", squadId: CF.IDS.sunrise, postedBy: CF.IDS.ava }));
    w = v(CF.postMediaToSquad(w, { linkId: "l77b", mediaRefId: "m77", squadId: CF.IDS.powder, postedBy: CF.IDS.ava }));
    w = CF.unlinkOneSquadLink(w, "l77a");
    expect(w.links.find((l) => l.id === "l77b")!.tombstoned).toBeFalsy();
    expect(w.assets.get("m77")!.expiresAt).toBe(exp);
    const sun = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.sunrise));
    const pow = v(CF.feedForViewer(w, CF.IDS.ava, CF.IDS.powder));
    expect(sun.filter((f) => !w.links.find((l) => l.id === f.mediaLinkId)?.tombstoned)).toHaveLength(0);
    expect(pow.some((f) => f.mediaLinkId === "l77b")).toBe(true);
  });
});
