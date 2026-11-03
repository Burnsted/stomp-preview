/**
 * AF-XINT-01..14 — cross-feature acceptance (integration rehearsal t1152u + t1159u).
 * Fictional data only. AF-XINT-11/12 PASS after SV-0 cherry-pick (CONFLICT-1/2 closed).
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import * as Trips from "../src/trips/index.js";
import * as DaySesh from "../src/daysesh/index.js";
import {
  createOctoberWorld,
  createPeakWorld,
  createFictionalPeak,
  ID,
} from "../src/trips/fixtures.js";
import { mediaViewerDeadline as tripsMediaViewerDeadline } from "../src/trips/retention.js";
import {
  createSunriseShredDaySesh,
  createSunriseSquad,
  createSunriseCampfireStub,
  cloneSquad,
  cloneCampfire,
} from "../src/daysesh/fixtures.js";
import { closeDaySesh as closeRealDaySesh } from "../src/daysesh/lifecycle.js";
import type { GuardReason } from "../src/trips/types.js";
import type { DenyReason, MediaRefId } from "../src/campfire/cf2-types.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-XINT cross-feature (t1152u)", () => {
  it("AF-XINT-01 Identity: avatar.stomperId round-trips into branded StomperId", () => {
    // #12 AvatarConfig.stomperId is an unbranded string — brand via A1
    const avatarStomperId = "avatar_fixt_local_01";
    const branded = Shared.toStomperId(avatarStomperId);
    expect(branded).toBe(avatarStomperId);
    // Usable as CF / trips id string without inventing a second brand at runtime
    const people = CF.createCf2People();
    expect(people.every((p) => Shared.toStomperId(p.id) === p.id)).toBe(true);
    expect(() => Shared.toStomperId("former_stomper")).toThrow();
  });

  it("AF-XINT-02 Avatar×Campfire: erased → former stomper card; no body leak", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "m_erase",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "secret body must clear",
      }),
    );
    const erased = CF.eraseAccount({
      stomper: w.people.get(CF.IDS.ava)!,
      messages: w.messages,
      assets: [...w.assets.values()],
      links: w.links,
      blocks: w.blocks,
    });
    expect(erased.stomper.accountStatus).toBe("erased");
    expect(erased.displayLabel).toMatch(/Former/i);
    const msg = erased.messages.find((m) => m.id === "m_erase")!;
    expect(msg.authorId).toBe("former_stomper");
    expect(msg.body).toBeNull();
    const profiles = new Map([[CF.IDS.ava, erased.stomper]]);
    expect(CF.displayNameForAuthor(msg.authorId, profiles)).toMatch(/Former/i);
    // A1 still rejects tombstone as a live branded id
    expect(() => Shared.toStomperId("former_stomper")).toThrow();
  });

  it("AF-XINT-03 Avatar×Campfire: grom ageBand ⇒ youth ⇒ Campfire disabled", () => {
    const status = Shared.ageBandToAccountStatus("grom");
    expect(status).toBe("youth");
    const gia = CF.createCf2People().find((p) => p.id === CF.IDS.gia)!;
    expect(gia.accountStatus).toBe("youth");
    const allow = CF.accountAllowsCampfire(status);
    expect(allow.ok).toBe(false);
    if (!allow.ok) expect(allow.error).toBe("youth_disabled");
    // Planning assumption only — grom label ≠ authorized youth enrollment
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
  });

  it("AF-XINT-04 Trip×Campfire: completed Trip → A2 → same 45d deadline as #13", () => {
    const world = createOctoberWorld();
    const anchor = Shared.tripToEndAnchor(world.trip);
    expect(anchor.ok).toBe(true);
    if (!anchor.ok) return;
    expect(anchor.value.status).toBe("ended");
    const fromTrips = tripsMediaViewerDeadline(world.trip);
    const fromShim = CF.mediaViewerDeadline(anchor.value);
    expect(fromShim.deadlineIso).toBe(fromTrips.deadlineIso);
    expect(fromShim.kind).toBe("media_45d");
    expect(CF.VIEWER_MEDIA_MAX_DAYS).toBe(Trips.VIEWER_MEDIA_MAX_DAYS);
    expect(CF.VIEWER_MEDIA_MAX_DAYS).toBe(45);
  });

  it("AF-XINT-05 Trip×Campfire: extension moves expiry via Trip only; share never extends", () => {
    let w = CF.createWorld();
    w = v(CF.uploadMedia(w, { id: "xint5", ownerId: CF.IDS.ava, origin: "trip_drop" }));
    const before = w.assets.get("xint5")!.expiresAt!;
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_x5",
        actorId: CF.IDS.ava,
        mediaRefId: "xint5",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    w = v(CF.confirmQuickShare(w, "si_x5", "lnk_x5"));
    // Share confirmed — expiresAt unchanged
    expect(w.assets.get("xint5")!.expiresAt).toBe(before);
    w = CF.extendTripOfficialEnd(w, "2026-04-01T00:00:00.000Z");
    const after = w.assets.get("xint5")!.expiresAt!;
    expect(after > before).toBe(true);
    expect(after).toBe(CF.addUtcDays("2026-04-01T00:00:00.000Z", 45));
  });

  it("AF-XINT-06 Clock: TZ edge — #13 clock vs A3 shim agree at late local end", () => {
    // Resort-local late evening end (America/Denver); deadline math is #13 SoT
    const trip = createFictionalPeak({
      status: "completed",
      timeZone: "America/Denver",
      officialEndDate: "2026-03-08T06:30:00Z", // 11:30 PM MST prior evening
      scheduledEndAt: "2026-03-08T06:30:00Z",
    });
    const fromTrips = Trips.mediaViewerDeadline(trip);
    const anchor = v(Shared.tripToEndAnchor(trip));
    const fromShim = CF.mediaViewerDeadline(anchor);
    expect(fromShim.deadlineIso).toBe(fromTrips.deadlineIso);
    expect(fromShim.anchorIso).toBe(fromTrips.anchorIso);
    // DST spring-forward week: offsets differ pre/post; deadline still matches SoT
    const beforeDst = Trips.offsetMinutesAt("2026-03-07T12:00:00Z", "America/Denver");
    const afterDst = Trips.offsetMinutesAt("2026-03-09T12:00:00Z", "America/Denver");
    expect(beforeDst).not.toBe(afterDst);
  });

  it("AF-XINT-07 DaySesh×Campfire: real #13 close leaves Squad/Campfire byte-identical", () => {
    const sesh = createSunriseShredDaySesh();
    const squad = createSunriseSquad();
    const campfire = createSunriseCampfireStub();
    const before = {
      squad: cloneSquad(squad),
      campfire: cloneCampfire(campfire),
    };
    const closed = closeRealDaySesh(sesh, "2026-12-02T15:00:00Z");
    expect(closed.campfireEffects).toEqual([]);
    expect(closed.sesh.status).toBe("closed");
    // A4 stub for CF boundary
    const stub = Shared.daySeshToStub(closed.sesh);
    const cfClosed = CF.closeDaySesh(stub, "2026-12-02T15:00:00Z");
    expect(cfClosed.campfireEffects).toEqual([]);
    expect(JSON.stringify(squad)).toBe(JSON.stringify(before.squad));
    expect(JSON.stringify(campfire)).toBe(JSON.stringify(before.campfire));
  });

  it("AF-XINT-08 DaySesh×Campfire: DS media preview shows DEADLINE_UNSPECIFIED", () => {
    const flag = CF.daySeshMediaPolicyFlag();
    expect(flag.flag).toBe("DEADLINE_UNSPECIFIED");
    expect(flag.deadlineAt).toBeNull();
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "ds_media",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
      }),
    );
    const asset = w.assets.get("ds_media")!;
    expect(asset.flag).toBe("DEADLINE_UNSPECIFIED");
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_ds",
        actorId: CF.IDS.ava,
        mediaRefId: "ds_media",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_ds")!;
    expect(intent.preview.expirySource).toBe("DEADLINE_UNSPECIFIED");
  });

  it("AF-XINT-09 Viewer≠Squad: ViewerEntitlement holder denied Campfire (via A6)", () => {
    const tripWorld = createPeakWorld();
    const facts = Shared.participationFacts(ID.vik, tripWorld, null);
    expect(facts.isTripViewer).toBe(true);
    // CF world: Vik is trip viewer, not Sunrise member
    const w = CF.createWorld();
    expect(
      CF.viewerOrParticipantHasSquadAccess({
        stomperId: CF.IDS.vik,
        memberships: w.memberships,
        squadId: CF.IDS.sunrise,
        isTripViewer: facts.isTripViewer,
        isDaySeshParticipant: facts.isDaySeshParticipant,
      }),
    ).toBe(false);
    const read = CF.canRead({
      stomper: w.people.get(CF.IDS.vik)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
    });
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.error).toBe("not_member");
  });

  it("AF-XINT-10 Viewer≠Squad voice: Trip Viewer share to Park Crew → not_member", () => {
    const tripWorld = createPeakWorld();
    const facts = Shared.participationFacts(ID.vik, tripWorld, null);
    expect(facts.isTripViewer).toBe(true);
    const w = CF.createWorld();
    // Voice may prepare, but confirm path for non-member must deny
    const prepared = CF.prepareFromVoice(
      { kind: "share_to_squad", squadId: CF.IDS.sunrise },
      CF.IDS.vik,
    );
    expect(prepared.kind).toBe("share_prepare");
    w.assets.set("clip_v", {
      id: "clip_v" as MediaRefId,
      ownerId: CF.IDS.vik,
      origin: "trip_drop",
      uploadedAt: w.nowIso,
      expiresAt: null,
      localUri: "fixt://clip_v",
      bytesLabel: "clip",
    });
    // Non-member cannot post/share into Squad Campfire
    const post = CF.postMediaToSquad(w, {
      linkId: "lv",
      mediaRefId: "clip_v",
      squadId: CF.IDS.sunrise,
      postedBy: CF.IDS.vik,
    });
    expect(post.ok).toBe(false);
    if (!post.ok) expect(post.error).toBe("not_member");
  });

  // CONFLICT-1 closed by SV-0: prepareFromVoice("post_to_all_squads") → denied multi_recipient.
  it("AF-XINT-11 Share: multi-squad denied (CONFLICT-1 / SV-0)", () => {
    const action = CF.prepareFromVoice(
      { kind: "post_to_all_squads" },
      CF.IDS.ava,
    );
    expect(action.kind).toBe("denied");
    if (action.kind === "denied") {
      expect(action.reason).toBe("multi_recipient");
    }
    const voiced = CF.voiceCommand(CF.createWorld(), CF.IDS.ava, "post to all my Squads");
    expect(voiced.kind).toBe("denied");
    if (voiced.kind === "denied") {
      expect(voiced.reason).toBe("multi_recipient");
    }
  });

  // CONFLICT-2 closed by SV-0: confirmShare + confirmQuickShare recheck membership.
  it("AF-XINT-12 Share: removed-between-prepare-and-confirm recheck denies (CONFLICT-2 / SV-0)", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "med_c2",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_c2",
        actorId: CF.IDS.ava,
        mediaRefId: "med_c2",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    // Revoke Ava's Sunrise membership between prepare and confirm
    w = {
      ...w,
      memberships: w.memberships.map((m) =>
        m.stomperId === CF.IDS.ava && m.squadId === CF.IDS.sunrise
          ? { ...m, state: "revoked" as const, leftAt: w.nowIso }
          : m,
      ),
    };
    const intent = w.shareIntents.find((i) => i.id === "si_c2")!;
    const confirmed = CF.confirmShare(intent, {
      nowIso: w.nowIso,
      recheck: {
        actor: w.people.get(CF.IDS.ava)!,
        memberships: w.memberships,
        assets: w.assets,
        nowIso: w.nowIso,
        sessionUnlocked: true,
      },
    });
    const worldConfirm = CF.confirmQuickShare(w, "si_c2", "lnk_c2");
    expect(confirmed.ok).toBe(false);
    expect(worldConfirm.ok).toBe(false);
    if (!confirmed.ok) expect(confirmed.error).toBe("not_member");
    if (!worldConfirm.ok) expect(worldConfirm.error).toBe("not_member");
  });

  it("AF-XINT-13 Guards: GuardReason↔DenyReason map total; no ok leak", () => {
    const reasons = Object.keys(Shared.GUARD_TO_DENY) as GuardReason[];
    expect(Shared.assertGuardReasonMapTotal(reasons)).toBe(true);
    for (const r of reasons) {
      if (r === "ok") {
        expect(Shared.mapGuardReasonToDeny(r)).toBe("ok");
      } else {
        expect(Shared.mapGuardReasonToDeny(r)).not.toBe("ok");
        const g = Shared.guardToResult({
          ok: false as const,
          reason: r,
        });
        expect(g.ok).toBe(false);
      }
    }
    // DenyReason inverse covers all deny keys
    for (const d of Object.keys(Shared.DENY_TO_GUARD) as DenyReason[]) {
      expect(Shared.mapDenyReasonToGuard(d)).toBeTruthy();
    }
  });

  it("AF-XINT-14 Index: trips + daysesh + campfireCf2 + shared; no name collision", async () => {
    const root = await import("../src/index.js");
    expect(root.trips).toBeTruthy();
    expect(root.daysesh).toBeTruthy();
    expect(root.campfireCf2).toBeTruthy();
    expect(root.shared).toBeTruthy();
    expect(typeof root.trips.mediaViewerDeadline).toBe("function");
    expect(typeof root.daysesh.closeDaySesh).toBe("function");
    expect(typeof root.campfireCf2.mediaViewerDeadline).toBe("function");
    expect(typeof root.shared.toStomperId).toBe("function");
    expect(typeof root.shared.tripToEndAnchor).toBe("function");
    expect(typeof root.shared.participationFacts).toBe("function");
    // Namespaced — no top-level collision between trip/cf2 StomperId brands
    expect(root.trips.VIEWER_MEDIA_MAX_DAYS).toBe(
      root.campfireCf2.VIEWER_MEDIA_MAX_DAYS,
    );
  });
});
