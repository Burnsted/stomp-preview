/**
 * AF-AUTH-t1184u — strengthened fictional authz + denial paths.
 * Covers: Rider Pass, Viewer, Squads, Campfire, Trip Drop, Day Sesh,
 * MediaRef, Quick Share (20s), G1–G4. DEMO / TEST ONLY — no live auth.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import {
  ID,
  createPass,
  createOctoberWorld,
  createPeakWorld,
  type StomperId,
} from "../src/trips/index.js";
import {
  DS_ID,
  FIXTURE_CREATED_AT,
  createSunriseShredDaySesh,
  sunrisePasses,
} from "../src/daysesh/index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-AUTH-t1184u MediaRef access + G1 clock lock", () => {
  it("allow member within window; deny after leave; share does not extend clock", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "t1184_mr",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshOfficialEndedAt: "2026-02-15T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    const asset = w.assets.get("t1184_mr")!;
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizeMediaRefAccess({
        stomper: ava,
        campfire,
        memberships: w.memberships,
        asset,
        nowIso: w.nowIso,
      }).allow,
    ).toBe(true);

    const before = { ...asset };
    w = v(
      CF.postMediaToSquad(w, {
        linkId: "lt1184_mr",
        mediaRefId: "t1184_mr",
        squadId: CF.IDS.sunrise,
        postedBy: CF.IDS.ava,
      }),
    );
    const after = w.assets.get("t1184_mr")!;
    expect(
      Shared.authorizeMediaRefAccess({
        stomper: ava,
        campfire,
        memberships: w.memberships,
        asset: after,
        nowIso: w.nowIso,
        assetBeforeShare: before,
      }).allow,
    ).toBe(true);
    expect(CF.assertShareDoesNotExtendMediaClock(before, after)).toBe(true);

    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const denied = Shared.authorizeMediaRefAccess({
      stomper: ava,
      campfire,
      memberships: w.memberships,
      asset: after,
      nowIso: w.nowIso,
    });
    expect(denied.allow).toBe(false);
    if (!denied.allow) expect(denied.code).toBe("not_member");
  });
});

describe("AF-AUTH-t1184u Trip Drop media", () => {
  it("allow trip_drop for member; deny wrong origin; deny expired", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "t1184_td",
        ownerId: CF.IDS.ben,
        origin: "trip_drop",
      }),
    );
    const asset = w.assets.get("t1184_td")!;
    expect(asset.origin).toBe("trip_drop");
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    const ben = w.people.get(CF.IDS.ben)!;
    expect(
      Shared.authorizeTripDropMediaAccess({
        stomper: ben,
        campfire,
        memberships: w.memberships,
        asset,
        nowIso: w.nowIso,
      }).allow,
    ).toBe(true);

    const wrong = Shared.authorizeTripDropMediaAccess({
      stomper: ben,
      campfire,
      memberships: w.memberships,
      asset: { ...asset, origin: "campfire" },
      nowIso: w.nowIso,
    });
    expect(wrong.allow).toBe(false);
    if (!wrong.allow) expect(wrong.code).toBe("intent_invalid");

    // Force past expiry when expiresAt is set
    if (asset.expiresAt) {
      const past = Shared.authorizeTripDropMediaAccess({
        stomper: ben,
        campfire,
        memberships: w.memberships,
        asset,
        nowIso: "2099-01-01T00:00:00.000Z",
      });
      expect(past.allow).toBe(false);
    }
  });
});

describe("AF-AUTH-t1184u Day Sesh media G1 45d", () => {
  it("deny past 45d max; flag day_sesh_45d_max; share does not extend", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "t1184_ds",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshOfficialEndedAt: "2026-02-15T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    const asset = w.assets.get("t1184_ds")!;
    expect(asset.flag).toBe("day_sesh_45d_max");
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizeDaySeshMediaAccess({
        stomper: ava,
        campfire,
        memberships: w.memberships,
        asset,
        nowIso: w.nowIso,
      }).allow,
    ).toBe(true);
    const past = Shared.authorizeDaySeshMediaAccess({
      stomper: ava,
      campfire,
      memberships: w.memberships,
      asset,
      nowIso: "2026-04-02T00:00:00.000Z",
    });
    expect(past.allow).toBe(false);
    if (!past.allow) expect(past.code).toBe("expired");
  });
});

describe("AF-AUTH-t1184u G2 leave / rejoin / history", () => {
  it("leave denies history; rejoin prospective-only; prior messages cutoff", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "t1184_old",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "before leave",
      }),
    );
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    const ben = w.people.get(CF.IDS.ben)!;
    const oldMsg = w.messages.find((m) => m.id === "t1184_old")!;
    expect(
      Shared.authorizeCampfireHistoryRead({
        stomper: ben,
        campfire,
        memberships: w.memberships,
        message: oldMsg,
      }).allow,
    ).toBe(true);

    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise));
    const leftDeny = Shared.authorizeCampfireHistoryRead({
      stomper: ben,
      campfire,
      memberships: w.memberships,
      message: oldMsg,
    });
    expect(leftDeny.allow).toBe(false);
    if (!leftDeny.allow) expect(leftDeny.code).toBe("not_member");

    w = v(
      CF.approveSquadRejoin(w, {
        squadId: CF.IDS.sunrise,
        stomperId: CF.IDS.ben,
        joinedAt: "2026-06-01T00:00:00.000Z",
      }),
    );
    const cutoff = Shared.authorizeCampfireHistoryRead({
      stomper: ben,
      campfire,
      memberships: w.memberships,
      message: oldMsg,
    });
    expect(cutoff.allow).toBe(false);
    if (!cutoff.allow) expect(cutoff.code).toBe("history_cutoff");

    w = v(
      CF.postMessage(w, {
        id: "t1184_new",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "after rejoin",
        createdAt: "2026-06-02T00:00:00.000Z",
      }),
    );
    const newMsg = w.messages.find((m) => m.id === "t1184_new")!;
    expect(
      Shared.authorizeCampfireHistoryRead({
        stomper: ben,
        campfire,
        memberships: w.memberships,
        message: newMsg,
      }).allow,
    ).toBe(true);
  });
});

describe("AF-AUTH-t1184u G3 ownership transfer accept-only", () => {
  it("pending/unresolved blocks elevation; accept completes transfer", () => {
    const w = CF.createWorld();
    const people = w.people;
    const squad = w.squads.get(CF.IDS.sunrise)!;
    const nom = CF.nominateOwnerSuccessor({
      squad,
      memberships: w.memberships,
      people,
      fromOwnerId: CF.IDS.ava,
      nomineeId: CF.IDS.ben,
      nowIso: w.nowIso,
    });
    expect(nom.ok).toBe(true);
    if (!nom.ok) return;
    expect(
      Shared.authorizeSquadOwnerElevation({ squad: nom.value.squad }).allow,
    ).toBe(false);

    const accepted = CF.acceptOwnerTransfer({
      squad: nom.value.squad,
      memberships: [...w.memberships],
      transfer: nom.value.transfer,
      acceptorId: CF.IDS.ben,
      nowIso: w.nowIso,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(
      Shared.authorizeSquadOwnerElevation({ squad: accepted.value.squad }).allow,
    ).toBe(true);
    expect(accepted.value.squad.ownerId).toBe(CF.IDS.ben);

    const departed = CF.departOwnerWithoutSuccessor({
      squad,
      memberships: [...w.memberships],
      ownerId: CF.IDS.ava,
      leftAt: w.nowIso,
    });
    expect(departed.ok).toBe(true);
    if (!departed.ok) return;
    expect(departed.value.squad.ownershipState).toBe("unresolved");
    expect(
      Shared.authorizeSquadOwnerElevation({ squad: departed.value.squad }).allow,
    ).toBe(false);
  });
});

describe("AF-AUTH-t1184u G4 logical revoke", () => {
  it("confirmed deletion denies Campfire + non-erased account + no deletion job", () => {
    let w = CF.createWorld();
    const ben = w.people.get(CF.IDS.ben)!;
    const revoked = CF.revokeAccountAccess({
      stomper: ben,
      memberships: [...w.memberships],
      invites: [],
      nowIso: w.nowIso,
    });
    expect(revoked.stomper.accountStatus).toBe("erased");
    expect(revoked.physicalWipeGuaranteed).toBe(false);
    expect(revoked.sessionsRevoked).toBe(true);
    expect(CF.assertNoDeletionJob().enabled).toBe(false);

    expect(
      Shared.authorizeNonErasedAccount({ stomper: revoked.stomper }).allow,
    ).toBe(false);
    expect(
      Shared.authorizeCampfireAccess({
        stomper: revoked.stomper,
        campfire: w.campfires.get(CF.IDS.cfSunrise)!,
        memberships: revoked.memberships,
      }).allow,
    ).toBe(false);
  });
});

describe("AF-AUTH-t1184u Rider Pass / Viewer / Day Sesh / Quick Share regression", () => {
  it("pass join allow+deny; viewer download; day sesh; 20s share TTL", () => {
    const world = createPeakWorld();
    const branded = Shared.toStomperId("t1184_rider") as StomperId;
    const pass = createPass({
      id: "pass-t1184",
      stomperId: branded,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    expect(
      Shared.authorizeJoinTripAsRider({
        stomperId: branded,
        trip: world.trip,
        passes: [...world.passes, pass],
        atIso: world.trip.startIso,
      }).allow,
    ).toBe(true);
    expect(
      Shared.authorizeJoinTripAsRider({
        stomperId: branded,
        trip: world.trip,
        passes: world.passes,
        atIso: world.trip.startIso,
      }).allow,
    ).toBe(false);

    const oct = createOctoberWorld();
    const viewer = oct.viewers[0]!;
    expect(
      Shared.authorizeViewerDownload({ viewer, atIso: viewer.downloadUntilIso! }).allow,
    ).toBe(true);
    expect(
      Shared.authorizeViewerDownload({
        viewer,
        atIso: "2099-01-01T00:00:00Z",
      }).allow,
    ).toBe(false);

    const sesh = createSunriseShredDaySesh();
    expect(
      Shared.authorizeJoinDaySesh({
        stomperId: String(DS_ID.rio),
        sesh,
        passes: sunrisePasses(),
        atIso: FIXTURE_CREATED_AT,
      }).allow,
    ).toBe(true);
    expect(
      Shared.authorizeJoinDaySesh({
        stomperId: String(DS_ID.rio),
        sesh,
        passes: [],
        atIso: FIXTURE_CREATED_AT,
      }).allow,
    ).toBe(false);

    expect(Shared.RIDER_HUB_SHARE_MS).toBe(20_000);
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(ID.cole).toBeTruthy();
  });
});
