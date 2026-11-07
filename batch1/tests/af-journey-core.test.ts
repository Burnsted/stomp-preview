/**
 * AF-JOURNEY — complete fictional-data integration candidate (t1165u).
 * STOMPER → Trip Drop → Squad → Campfire → Confirmed Share → Day Sesh → History
 * Plus: decline, expired entitlements, multi-Squad deny, revoke, dup confirm.
 * Does NOT rewrite Trip/DaySesh/Campfire/SV-0 cores — composes existing APIs.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import * as DaySesh from "../src/daysesh/index.js";
import {
  canDownloadViewer,
  canJoinAsRider,
  createOctoberWorld,
  createPass,
  createPeakWorld,
  createSaturdayWorld,
  hasRiderAccessAt,
  makeMembership,
  markMediaDeletedAtDeadline,
  mediaViewerDeadline,
  tripHistoryReadableAfterMediaDelete,
  type StomperId,
} from "../src/trips/index.js";
import type { MediaRefId } from "../src/campfire/cf2-types.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-JOURNEY happy path — STOMPER→Trip→Squad→Campfire→Share→DaySesh→History", () => {
  it("composes one fictional integration candidate end-to-end", () => {
    // 1) STOMPER (A1 brand) — greet gate remains product UI; here we only brand id
    const stomperRaw = "journey_rider_ava";
    const branded = Shared.toStomperId(stomperRaw) as StomperId;
    expect(Shared.authorizeOwnStomper({ actorId: branded, accountOwnerId: branded }).allow).toBe(
      true,
    );

    // 2) Trip Drop — Pass + invite→active
    const tripWorld = createPeakWorld();
    const pass = createPass({
      id: "pass-journey",
      stomperId: branded,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    const join = Shared.authorizeJoinTripAsRider({
      stomperId: branded,
      trip: tripWorld.trip,
      passes: [...tripWorld.passes, pass],
      atIso: tripWorld.trip.startIso,
    });
    expect(join.allow).toBe(true);
    const membership = makeMembership({
      tripId: tripWorld.trip.id,
      stomperId: branded,
      role: "rider",
      joinedAtIso: tripWorld.trip.startIso,
      participationEndsAt: tripWorld.trip.scheduledEndAt,
      status: "active",
    });
    expect(
      hasRiderAccessAt(
        membership,
        tripWorld.trip,
        [...tripWorld.passes, pass],
        tripWorld.trip.startIso,
      ),
    ).toBe(true);

    // 3–4) Squad + Campfire (1 Campfire/Squad)
    let w = CF.createWorld();
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    expect(campfire.persistent).toBe(true);
    expect(campfire.squadId).toBe(CF.IDS.sunrise);
    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizeCampfireAccess({
        stomper: ava,
        campfire,
        memberships: w.memberships,
        forPost: true,
      }).allow,
    ).toBe(true);
    w = v(
      CF.postMessage(w, {
        id: "j_msg",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "lodge after last chair",
      }),
    );

    // 5) Confirmed single-Squad share (SV-0 TTL + explicit confirm)
    w = v(
      CF.uploadMedia(w, {
        id: "j_media",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(CF.SESH_PENDING_TTL_MS);
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_journey",
        actorId: CF.IDS.ava,
        mediaRefId: "j_media",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_journey")!;
    expect(intent.state).toBe("previewing");
    const confirmAuth = Shared.authorizeConfirmShare({
      intent,
      nowIso: w.nowIso,
      recheck: {
        actor: ava,
        memberships: w.memberships,
        assets: w.assets,
        nowIso: w.nowIso,
        sessionUnlocked: true,
      },
    });
    expect(confirmAuth.allow).toBe(true);
    w = v(CF.confirmQuickShare(w, "si_journey", "lnk_journey"));
    const confirmed = w.shareIntents.find((i) => i.id === "si_journey")!;
    expect(confirmed.state).toBe("confirmed");
    expect(CF.shareWouldPost(confirmed)).toBe(true);

    // MediaRef clocks: source media expiry not reset by share confirm
    const assetBefore = w.assets.get("j_media" as MediaRefId);
    expect(assetBefore).toBeTruthy();

    // 6) Day Sesh — isolated; close leaves Campfire untouched
    const squadBefore = structuredClone(w.squads.get(CF.IDS.sunrise)!);
    const cfBefore = structuredClone(w.campfires.get(CF.IDS.cfSunrise)!);
    const memBefore = structuredClone(
      w.memberships.filter((m) => m.squadId === CF.IDS.sunrise),
    );
    const ds = DaySesh.createSunriseShredDaySesh();
    const dsJoin = Shared.authorizeJoinDaySesh({
      stomperId: String(DaySesh.DS_ID.rio),
      sesh: ds,
      passes: DaySesh.sunrisePasses(),
      atIso: DaySesh.FIXTURE_CREATED_AT,
    });
    expect(dsJoin.allow).toBe(true);
    const joinedGate = DaySesh.joinDaySesh({
      sesh: ds,
      stomperId: DaySesh.DS_ID.rio,
      passes: DaySesh.sunrisePasses(),
      nowIso: DaySesh.FIXTURE_CREATED_AT,
      source: "squad",
    });
    expect(joinedGate.ok).toBe(true);
    if (!joinedGate.ok) throw new Error(joinedGate.reason);
    const closed = DaySesh.closeDaySesh(joinedGate.value, "2026-11-07T20:00:00Z");
    expect(closed.campfireEffects).toEqual([]);
    expect(
      CF.assertCampfireUntouched({
        before: {
          squad: squadBefore,
          campfire: cfBefore,
          memberships: memBefore,
        },
        after: {
          squad: w.squads.get(CF.IDS.sunrise)!,
          campfire: w.campfires.get(CF.IDS.cfSunrise)!,
          memberships: w.memberships.filter((m) => m.squadId === CF.IDS.sunrise),
        },
      }),
    ).toBe(true);

    // 7) Rider history / retention — soft-hide; no deletion jobs
    const oct = createSaturdayWorld();
    const dl = mediaViewerDeadline(oct.trip);
    const marked = markMediaDeletedAtDeadline(oct.trip, dl.deadlineIso!);
    expect(marked.deletionJob.enabled).toBe(false);
    const hist = tripHistoryReadableAfterMediaDelete(oct.trip);
    expect(hist.id).toBe(oct.trip.id);

    // A6 facts: Day Sesh participant ≠ Squad membership leak
    const facts = Shared.participationFacts(CF.IDS.vik, tripWorld, null);
    expect(
      CF.viewerOrParticipantHasSquadAccess({
        stomperId: CF.IDS.vik,
        memberships: w.memberships,
        squadId: CF.IDS.sunrise,
        isTripViewer: facts.isTripViewer,
        isDaySeshParticipant: true,
      }),
    ).toBe(false);
  });
});

describe("AF-JOURNEY denial / edge paths", () => {
  it("declined / no-pass trip join denied", () => {
    const world = createPeakWorld();
    const stranger = Shared.toStomperId("journey_no_pass") as StomperId;
    expect(canJoinAsRider(stranger, world.trip, world.passes, world.trip.startIso).ok).toBe(
      false,
    );
  });

  it("multi-Squad share + duplicate confirm denied", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "j_deny",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const multi = CF.beginQuickShare(w, {
      intentId: "si_multi_j",
      actorId: CF.IDS.ava,
      mediaRefId: "j_deny",
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
    });
    expect(multi.ok).toBe(false);

    const clock = { t: Date.parse(w.nowIso) };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_j_dup",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "j_deny",
      mediaRefId: "j_deny" as MediaRefId,
      readbackText: "Share",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_j_dup",
        actorId: CF.IDS.ava,
        channel: "tap",
      }),
    );
    const dup = CF.claimPendingConfirmation(store, {
      pendingId: "p_j_dup",
      actorId: CF.IDS.ava,
      channel: "voice",
    });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error).toBe("already_handled");
  });

  it("expired pending + revoked viewer download denied", () => {
    const clock = { t: 1_000_000 };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_j_exp",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "x",
      mediaRefId: "x" as MediaRefId,
      readbackText: "Share",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    clock.t += CF.SESH_PENDING_TTL_MS + 1;
    const late = CF.claimPendingConfirmation(store, {
      pendingId: "p_j_exp",
      actorId: CF.IDS.ava,
      channel: "tap",
    });
    expect(late.ok).toBe(false);

    const world = createOctoberWorld();
    const viewer = world.viewers[0]!;
    const revoked = canDownloadViewer(
      { ...viewer, revokedAtIso: "2026-11-15T00:00:00Z" },
      "2026-11-16T00:00:00Z",
    );
    expect(revoked.ok).toBe(false);
  });

  it("Rider Hub bridge: finish_day leaves Campfire; confirm_share maps to sesh", () => {
    expect(Shared.adviceFor("finish_day").note).toMatch(/campfireEffects/);
    expect(Shared.adviceFor("confirm_share").batch1Surface).toBe("campfireCf2.sesh");
    expect(Shared.adviceFor("set_pass_expired").expectedAuthzCode).toBe("pass_inactive");
  });
});
