/**
 * AF-RC-JOURNEY-t1170u — release-candidate fictional-data journey matrix.
 * Composes existing Trip / Day Sesh / Campfire / SV-0 / G1–G4 / fictionalAuthz APIs.
 * Does NOT reopen G1–G4 product rules or SV-0. No live auth / deletion jobs.
 *
 * Viewport note (docs + TEST-RESULTS): Android-sized assumption is ~390×844 CSS px
 * (GB phone shell / browser-smoke). Actual-device acceptance is NOT claimed here.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import * as DaySesh from "../src/daysesh/index.js";
import {
  canDownloadViewer,
  createOctoberWorld,
  createPass,
  createPeakWorld,
  createSaturdayWorld,
  hasRiderAccessAt,
  makeMembership,
  type StomperId,
} from "../src/trips/index.js";
import type { MediaRefId } from "../src/campfire/cf2-types.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

/** RC-J01 — Invite → Avatar (branded id) → Preview → Explicit join */
describe("RC-J01 Invite → Avatar → Preview → Explicit join", () => {
  it("pending invite does not grant membership until acceptInvite", () => {
    let w = CF.createWorld();
    w = v(
      CF.inviteToSquad(w, {
        id: "inv_rc_j01",
        fromId: CF.IDS.ava,
        toId: CF.IDS.vik,
        squadId: CF.IDS.sunrise,
      }),
    );
    const pending = w.invites.find((i) => i.id === "inv_rc_j01")!;
    expect(pending.status).toBe("pending");
    // Preview: invite exists, but Vik is not yet an active Sunrise member
    expect(
      CF.isActiveMember(w.memberships, CF.IDS.sunrise, CF.IDS.vik),
    ).toBe(false);
    expect(
      Shared.authorizeCampfireAccess({
        stomper: w.people.get(CF.IDS.vik)!,
        campfire: w.campfires.get(CF.IDS.cfSunrise)!,
        memberships: w.memberships,
      }).allow,
    ).toBe(false);

    // Explicit join
    w = v(CF.acceptInvite(w, "inv_rc_j01", "2026-11-03T12:00:00.000Z"));
    expect(w.invites.find((i) => i.id === "inv_rc_j01")!.status).toBe("accepted");
    expect(CF.isActiveMember(w.memberships, CF.IDS.sunrise, CF.IDS.vik)).toBe(true);
    expect(
      Shared.authorizeCampfireAccess({
        stomper: w.people.get(CF.IDS.vik)!,
        campfire: w.campfires.get(CF.IDS.cfSunrise)!,
        memberships: w.memberships,
        forPost: true,
      }).allow,
    ).toBe(true);
  });
});

/** RC-J02 — Squad → Campfire → Confirmed single-Squad share (20s) */
describe("RC-J02 Squad → Campfire → Confirmed share", () => {
  it("member posts, prepares one Squad, confirms with recheck; multi denied", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc_j02_msg",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "lodge meetup",
      }),
    );
    w = v(
      CF.uploadMedia(w, {
        id: "rc_j02_media",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(20_000);
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);

    expect(
      Shared.authorizePrepareShare({
        actorId: CF.IDS.ava,
        squadIds: [CF.IDS.sunrise, CF.IDS.powder],
        memberships: w.memberships,
      }).allow,
    ).toBe(false);

    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_rc_j02",
        actorId: CF.IDS.ava,
        mediaRefId: "rc_j02_media",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_rc_j02")!;
    expect(intent.state).toBe("previewing");
    const auth = Shared.authorizeConfirmShare({
      intent,
      nowIso: w.nowIso,
      recheck: {
        actor: w.people.get(CF.IDS.ava)!,
        memberships: w.memberships,
        assets: w.assets,
        nowIso: w.nowIso,
        sessionUnlocked: true,
      },
    });
    expect(auth.allow).toBe(true);
    w = v(CF.confirmQuickShare(w, "si_rc_j02", "lnk_rc_j02"));
    expect(w.shareIntents.find((i) => i.id === "si_rc_j02")!.state).toBe("confirmed");
  });
});

/** RC-J03 — Day Sesh → Finish → Retention deadline (G1; no reopen) */
describe("RC-J03 Day Sesh → Finish → Retention deadline", () => {
  it("close freezes 45d media clock; Campfire untouched; deletion jobs off", () => {
    let w = CF.createWorld();
    const squadBefore = structuredClone(w.squads.get(CF.IDS.sunrise)!);
    const cfBefore = structuredClone(w.campfires.get(CF.IDS.cfSunrise)!);
    const memBefore = structuredClone(
      w.memberships.filter((m) => m.squadId === CF.IDS.sunrise),
    );

    w = v(
      CF.uploadMedia(w, {
        id: "rc_j03",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshId: CF.IDS.ds1,
        tripBoundIso: null,
      }),
    );
    expect(w.assets.get("rc_j03")!.expiresAt).toBeNull();
    const closed = CF.closeLinkedDaySesh(w);
    w = closed.world;
    expect(w.assets.get("rc_j03")!.flag).toBe("day_sesh_45d_max");
    expect(w.assets.get("rc_j03")!.expiresAt).toBe(
      CF.daySeshMediaExpiresAt(w.daySesh.officialEndedAt!),
    );
    expect(CF.assertNoDeletionJob().enabled).toBe(false);
    expect(
      CF.assertCampfireUntouched({
        before: { squad: squadBefore, campfire: cfBefore, memberships: memBefore },
        after: {
          squad: w.squads.get(CF.IDS.sunrise)!,
          campfire: w.campfires.get(CF.IDS.cfSunrise)!,
          memberships: w.memberships.filter((m) => m.squadId === CF.IDS.sunrise),
        },
      }),
    ).toBe(true);

    const ds = DaySesh.createSunriseShredDaySesh();
    const joined = DaySesh.joinDaySesh({
      sesh: ds,
      stomperId: DaySesh.DS_ID.rio,
      passes: DaySesh.sunrisePasses(),
      nowIso: DaySesh.FIXTURE_CREATED_AT,
      source: "squad",
    });
    expect(joined.ok).toBe(true);
    if (!joined.ok) throw new Error(joined.reason);
    const finished = DaySesh.closeDaySesh(joined.value, "2026-11-07T20:00:00Z");
    expect(finished.campfireEffects).toEqual([]);
  });
});

/** RC-J04 — Leave Squad → Rejoin approval → Prospective history (G2) */
describe("RC-J04 Leave → Rejoin approval → Prospective history", () => {
  it("leave denies access; rejoin appends new row; no prior history auto-expose", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc_j04_old",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "before leave",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise, "2026-02-01T00:00:00.000Z"));
    expect(
      Shared.authorizeCampfireAccess({
        stomper: w.people.get(CF.IDS.ben)!,
        campfire: w.campfires.get(CF.IDS.cfSunrise)!,
        memberships: w.memberships,
      }).allow,
    ).toBe(false);
    w = v(
      CF.approveSquadRejoin(w, {
        squadId: CF.IDS.sunrise,
        stomperId: CF.IDS.ben,
        joinedAt: "2026-06-01T00:00:00.000Z",
      }),
    );
    expect(CF.canViewerSeeMessage(w, CF.IDS.ben, "rc_j04_old")).toBe(false);
    w = v(
      CF.postMessage(w, {
        id: "rc_j04_new",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "after rejoin",
        createdAt: "2026-06-02T00:00:00.000Z",
      }),
    );
    expect(CF.canViewerSeeMessage(w, CF.IDS.ben, "rc_j04_new")).toBe(true);
  });
});

/** RC-J05 — Ownership transfer + unresolved-owner safety (G3) */
describe("RC-J05 Ownership transfer + unresolved-owner safety", () => {
  it("transfer only after accept; unresolved denies auto-elevate", () => {
    let w = CF.createWorld();
    const nom = v(
      CF.nominateSquadOwner(w, {
        squadId: CF.IDS.sunrise,
        fromOwnerId: CF.IDS.ava,
        nomineeId: CF.IDS.ben,
      }),
    );
    w = nom.world;
    expect(w.squads.get(CF.IDS.sunrise)!.ownershipState).toBe("pending_transfer");
    w = v(CF.acceptSquadOwnerTransfer(w, nom.transfer, CF.IDS.ben));
    expect(w.squads.get(CF.IDS.sunrise)!.ownerId).toBe(CF.IDS.ben);

    // Unresolved path
    w = v(
      CF.departSquadOwner(w, {
        squadId: CF.IDS.sunrise,
        ownerId: CF.IDS.ben,
        remainAsMember: false,
      }),
    );
    expect(w.squads.get(CF.IDS.sunrise)!.ownershipState).toBe("unresolved");
    expect(CF.canElevateToOwner(w.squads.get(CF.IDS.sunrise)!).ok).toBe(false);
  });
});

/** RC-J06 — Account deletion → immediate logical revoke (G4) */
describe("RC-J06 Account deletion → logical revoke", () => {
  it("erase denies new auth; others' content intact; no deletion job", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc_j06_ava",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "stays",
      }),
    );
    w = CF.eraseStomper(w, CF.IDS.ben);
    expect(Shared.authorizeNonErasedAccount({ stomper: w.people.get(CF.IDS.ben)! }).allow).toBe(
      false,
    );
    expect(
      CF.postMessage(w, {
        id: "rc_j06_fail",
        authorId: CF.IDS.ben,
        squadId: CF.IDS.sunrise,
        body: "nope",
      }).ok,
    ).toBe(false);
    expect(w.messages.find((m) => m.id === "rc_j06_ava")!.state).toBe("live");
    expect(CF.assertNoDeletionJob().enabled).toBe(false);
    expect(CF.ownerAccountDeletionAllowed(CF.IDS.ava).physicalWipeGuaranteed).toBe(false);
  });
});

/** RC-J07 — Rider Pass / Viewer entitlement expiration */
describe("RC-J07 Pass / Viewer entitlement expiration", () => {
  it("deny Trip join without Pass; deny Viewer download after deadline / revoke", () => {
    const peak = createPeakWorld();
    const stranger = Shared.toStomperId("rc_j07_stranger") as StomperId;
    expect(
      Shared.authorizeJoinTripAsRider({
        stomperId: stranger,
        trip: peak.trip,
        passes: peak.passes,
        atIso: peak.trip.startIso,
      }).allow,
    ).toBe(false);

    const branded = Shared.toStomperId("rc_j07_rider") as StomperId;
    const pass = createPass({
      id: "pass-rc-j07",
      stomperId: branded,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    expect(
      Shared.authorizeJoinTripAsRider({
        stomperId: branded,
        trip: peak.trip,
        passes: [...peak.passes, pass],
        atIso: peak.trip.startIso,
      }).allow,
    ).toBe(true);

    const oct = createOctoberWorld();
    const viewer = oct.viewers[0]!;
    expect(Shared.authorizeViewerDownload({ viewer, atIso: viewer.downloadUntilIso! }).allow).toBe(
      true,
    );
    expect(
      Shared.authorizeViewerDownload({ viewer, atIso: "2099-01-01T00:00:00Z" }).allow,
    ).toBe(false);
    expect(
      canDownloadViewer(
        { ...viewer, revokedAtIso: "2026-11-15T00:00:00Z" },
        "2026-11-16T00:00:00Z",
      ).ok,
    ).toBe(false);

    // Day Sesh Pass gate (Trip grace alone insufficient)
    expect(
      Shared.authorizeJoinDaySesh({
        stomperId: String(DaySesh.DS_ID.rio),
        sesh: DaySesh.createSunriseShredDaySesh(),
        passes: [],
        atIso: DaySesh.FIXTURE_CREATED_AT,
      }).allow,
    ).toBe(false);
  });
});

/** RC-J08 — Sesh confirm / cancel / delivery outcomes (SV-0 honesty) */
describe("RC-J08 Sesh confirm / cancel / delivery outcomes", () => {
  it("confirm→delivered DONE; cancel/fail never DONE; dup claim denied", () => {
    const clock = { t: 40_000_000 };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_rc_j08",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "rc_j08",
      mediaRefId: "rc_j08" as MediaRefId,
      readbackText: "Share clip",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_rc_j08",
        actorId: CF.IDS.ava,
        channel: "tap",
        sessionUnlocked: true,
      }),
    );
    expect(store.markQueued("p_rc_j08").ok).toBe(true);
    expect(CF.characterForPendingStatus("queued")).toBe("working");
    expect(CF.characterForPendingStatus("queued")).not.toBe("done");
    const delivered = store.markDelivered("p_rc_j08");
    expect(delivered.ok).toBe(true);
    if (delivered.ok) {
      expect(CF.characterForPendingStatus(delivered.value.status)).toBe("done");
    }

    // Cancel / fail path
    store.prepare({
      pendingId: "p_rc_j08_fail",
      actorId: CF.IDS.ava,
      kind: "send_text",
      squadId: CF.IDS.sunrise,
      contentHash: "body",
      textBody: "hi",
      readbackText: "Send",
    });
    v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_rc_j08_fail",
        actorId: CF.IDS.ava,
        channel: "voice",
        sessionUnlocked: true,
      }),
    );
    store.markQueued("p_rc_j08_fail");
    const failed = store.markFailed("p_rc_j08_fail");
    expect(failed.ok).toBe(true);
    if (failed.ok) {
      expect(failed.value.status).toBe("failed");
      expect(CF.characterForPendingStatus(failed.value.status)).not.toBe("done");
    }

    // Dup claim
    store.prepare({
      pendingId: "p_rc_j08_dup",
      actorId: CF.IDS.ava,
      kind: "send_text",
      squadId: CF.IDS.sunrise,
      contentHash: "x",
      textBody: "x",
      readbackText: "x",
    });
    v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_rc_j08_dup",
        actorId: CF.IDS.ava,
        channel: "tap",
      }),
    );
    const dup = CF.claimPendingConfirmation(store, {
      pendingId: "p_rc_j08_dup",
      actorId: CF.IDS.ava,
      channel: "voice",
    });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error).toBe("already_handled");
  });
});

/** RC-J09 — Trip Drop + returning rider entitlement composition */
describe("RC-J09 Trip Drop access composition (returning rider)", () => {
  it("active Pass + membership grants access; no Pass denies", () => {
    const world = createSaturdayWorld();
    const branded = Shared.toStomperId("rc_j09") as StomperId;
    const pass = createPass({
      id: "pass-rc-j09",
      stomperId: branded,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    const membership = makeMembership({
      tripId: world.trip.id,
      stomperId: branded,
      role: "rider",
      joinedAtIso: world.trip.startIso,
      participationEndsAt: world.trip.scheduledEndAt,
      status: "active",
    });
    expect(
      hasRiderAccessAt(membership, world.trip, [...world.passes, pass], world.trip.startIso),
    ).toBe(true);
    expect(hasRiderAccessAt(membership, world.trip, world.passes, world.trip.startIso)).toBe(
      false,
    );
    // STOMPER-first ownership fictional check
    expect(
      Shared.authorizeOwnStomper({ actorId: branded, accountOwnerId: branded }).allow,
    ).toBe(true);
  });
});

/** RC-J10 — Youth enrollment remains disabled on RC tip */
describe("RC-J10 Youth enrollment disabled", () => {
  it("YOUTH_CAMPFIRE_ENABLED false; youth enrollment authz denies", () => {
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    const w = CF.createWorld();
    const youth = {
      ...w.people.get(CF.IDS.ava)!,
      accountStatus: "youth" as const,
    };
    expect(Shared.authorizeAdultCampfireEnrollment({ stomper: youth }).allow).toBe(false);
  });
});
