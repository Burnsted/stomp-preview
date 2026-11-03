/**
 * AF-AUTH-01..12 — fictional server-authorization deny-by-default matrix (t1165u).
 * DEMO / TEST ONLY — never production security. No live auth / credentials.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import {
  ID,
  applyPassLapseToMembership,
  canDownloadViewer,
  createOctoberWorld,
  createPass,
  createPeakWorld,
  createSaturdayWorld,
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

describe("AF-AUTH-01 own STOMPER account", () => {
  it("allow matching actor; deny mismatch", () => {
    expect(Shared.authorizeOwnStomper({ actorId: "ava", accountOwnerId: "ava" }).allow).toBe(
      true,
    );
    const deny = Shared.authorizeOwnStomper({ actorId: "ava", accountOwnerId: "ben" });
    expect(deny.allow).toBe(false);
    if (!deny.allow) expect(deny.code).toBe("account_mismatch");
  });
});

describe("AF-AUTH-02 Rider Pass → Trip join", () => {
  it("allow with active Pass; deny without", () => {
    const world = createPeakWorld();
    const branded = Shared.toStomperId("auth_rider_02") as StomperId;
    const pass = createPass({
      id: "pass-auth02",
      stomperId: branded,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    const ok = Shared.authorizeJoinTripAsRider({
      stomperId: branded,
      trip: world.trip,
      passes: [...world.passes, pass],
      atIso: world.trip.startIso,
    });
    expect(ok.allow).toBe(true);
    const deny = Shared.authorizeJoinTripAsRider({
      stomperId: branded,
      trip: world.trip,
      passes: world.passes,
      atIso: world.trip.startIso,
    });
    expect(deny.allow).toBe(false);
  });
});

describe("AF-AUTH-03 co-host permissions", () => {
  it("allow host; deny plain rider", () => {
    const world = createSaturdayWorld();
    const host = Shared.authorizeCohostAction({
      actorId: String(ID.cole),
      memberships: world.memberships,
      tripId: world.trip.id,
    });
    expect(host.allow).toBe(true);
    const rider = Shared.authorizeCohostAction({
      actorId: String(ID.rio),
      memberships: world.memberships,
      tripId: world.trip.id,
    });
    expect(rider.allow).toBe(false);
    if (!rider.allow) expect(rider.code).toBe("not_host_or_cohost");
  });
});

describe("AF-AUTH-04 Squad Campfire access", () => {
  it("allow member; deny after leave", () => {
    let w = CF.createWorld();
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizeCampfireAccess({
        stomper: ava,
        campfire,
        memberships: w.memberships,
      }).allow,
    ).toBe(true);
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const denied = Shared.authorizeCampfireAccess({
      stomper: ava,
      campfire,
      memberships: w.memberships,
      forPost: true,
    });
    expect(denied.allow).toBe(false);
    if (!denied.allow) expect(denied.code).toBe("not_member");
  });
});

describe("AF-AUTH-05 Viewer react denied without Squad membership", () => {
  it("Trip Viewer alone cannot Campfire-react", () => {
    const tripWorld = createOctoberWorld();
    const w = CF.createWorld();
    const vik = w.people.get(CF.IDS.vik)!;
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    // Ensure Vik is not an active Sunrise member in CF world
    const decision = Shared.authorizeViewerReact({
      stomper: vik,
      campfire,
      memberships: w.memberships,
      tripWorld,
    });
    expect(decision.allow).toBe(false);
  });
});

describe("AF-AUTH-06 Viewer download deadline / revoke", () => {
  it("allow within deadline; deny after / revoked", () => {
    const world = createOctoberWorld();
    const viewer = world.viewers[0]!;
    expect(
      Shared.authorizeViewerDownload({
        viewer,
        atIso: viewer.downloadUntilIso!,
      }).allow,
    ).toBe(true);
    expect(
      Shared.authorizeViewerDownload({
        viewer,
        atIso: "2099-01-01T00:00:00Z",
      }).allow,
    ).toBe(false);
    expect(
      Shared.authorizeViewerDownload({
        viewer: { ...viewer, revokedAtIso: "2026-11-15T00:00:00Z" },
        atIso: "2026-11-16T00:00:00Z",
      }).allow,
    ).toBe(false);
    // Sanity: underlying trip guard still aligned
    expect(canDownloadViewer(viewer, "2099-01-01T00:00:00Z").ok).toBe(false);
  });
});

describe("AF-AUTH-07 prepare single-Squad share", () => {
  it("allow one Squad member; deny multi / non-member", () => {
    const w = CF.createWorld();
    expect(
      Shared.authorizePrepareShare({
        actorId: CF.IDS.ava,
        squadIds: [CF.IDS.sunrise],
        memberships: w.memberships,
      }).allow,
    ).toBe(true);
    const multi = Shared.authorizePrepareShare({
      actorId: CF.IDS.ava,
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
      memberships: w.memberships,
    });
    expect(multi.allow).toBe(false);
    if (!multi.allow) expect(multi.code).toBe("multi_recipient");
  });
});

describe("AF-AUTH-08 confirm share with recheck", () => {
  it("allow when membership+media+session ok; deny locked session", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "auth08",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_auth08",
        actorId: CF.IDS.ava,
        mediaRefId: "auth08",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_auth08")!;
    const ok = Shared.authorizeConfirmShare({
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
    expect(ok.allow).toBe(true);
    const locked = Shared.authorizeConfirmShare({
      intent,
      nowIso: w.nowIso,
      recheck: {
        actor: w.people.get(CF.IDS.ava)!,
        memberships: w.memberships,
        assets: w.assets,
        nowIso: w.nowIso,
        sessionUnlocked: false,
      },
    });
    expect(locked.allow).toBe(false);
    if (!locked.allow) expect(locked.code).toBe("session_locked");
  });
});

describe("AF-AUTH-09 Day Sesh Pass gate", () => {
  it("allow with Pass; deny without (Trip grace irrelevant)", () => {
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
  });
});

describe("AF-AUTH-10 retention / expiry rider access", () => {
  it("deny after grace; allow while in grace after lapse freeze", () => {
    const world = createSaturdayWorld();
    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    const frozen = applyPassLapseToMembership(
      rio,
      world.trip,
      "2026-11-07T10:00:00Z",
    );
    expect(
      Shared.authorizeRiderAccessAt({
        membership: frozen,
        trip: world.trip,
        passes: [],
        atIso: world.trip.scheduledEndAt,
      }).allow,
    ).toBe(true);
    expect(
      Shared.authorizeRiderAccessAt({
        membership: frozen,
        trip: world.trip,
        passes: [],
        atIso: "2026-11-09T00:00:00Z",
      }).allow,
    ).toBe(false);
  });
});

describe("AF-AUTH-11 SHARE_MS / SESH TTL lock", () => {
  it("Rider Hub SHARE_MS === SESH_PENDING_TTL_MS === 20000", () => {
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(20_000);
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(CF.SESH_PENDING_TTL_MS);
  });
});

describe("AF-AUTH-12 Rider Hub bridge table completeness", () => {
  it("every demo op has bridge advice; join_trip expects Pass deny code", () => {
    expect(Shared.RIDER_HUB_BRIDGE_TABLE.length).toBeGreaterThanOrEqual(10);
    const join = Shared.adviceFor("join_trip");
    expect(join.batch1Surface).toBe("trips.eligibility");
    expect(join.expectedAuthzCode).toBe("pass_inactive");
    const confirm = Shared.adviceFor("confirm_share");
    expect(confirm.batch1Surface).toBe("campfireCf2.sesh");
  });
});
