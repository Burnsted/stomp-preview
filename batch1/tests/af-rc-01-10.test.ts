/**
 * AF-RC-01..10 — release-blocker closure cross-feature fictional matrix (t1159u).
 * Success AND denial for each of 10 integration paths. Reuses A1–A6; A7 SPEC-only.
 * Fictional data / fixtures only — no GB shell / youth / payments / deletion jobs.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import * as Trips from "../src/trips/index.js";
import * as DaySesh from "../src/daysesh/index.js";
import {
  ID,
  approveExtension,
  applyPassLapseToMembership,
  canDownloadViewer,
  canJoinAsRider,
  createOctoberWorld,
  createPass,
  createPeakWorld,
  createSaturdayWorld,
  fixedClock,
  hasActivePass,
  hasRiderAccessAt,
  inGrace,
  lapsePass,
  makeMembership,
  markMediaDeletedAtDeadline,
  mediaViewerDeadline,
  tripHistoryReadableAfterMediaDelete,
  viewerOnlyAccountClock,
  VIEWER_MEDIA_MAX_DAYS,
  VIEWER_ONLY_MONTHS,
  RIDER_ARCHIVE_MONTHS,
  PASS_EXPORT_ONLY_MONTHS,
  type ExtensionId,
  type StomperId,
} from "../src/trips/index.js";
import {
  DS_ID,
  FIXTURE_CREATED_AT,
  canJoinDaySesh,
  cloneCampfire,
  cloneSquad,
  closeDaySesh,
  createSunriseCampfireStub,
  createSunriseShredDaySesh,
  createSunriseSquad,
  daySeshDeniedDespiteTripGrace,
  joinDaySesh,
  sunrisePasses,
} from "../src/daysesh/index.js";
import type {
  BlockId,
  MediaRefId,
  MessageId,
  ReportId,
} from "../src/campfire/cf2-types.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-RC-01 Avatar → Trip Drop invitations", () => {
  it("success: branded avatar stomperId joins Trip Drop as invited→active rider", () => {
    const avatarRaw = "avatar_fixt_rc01";
    const branded = Shared.toStomperId(avatarRaw);
    const world = createPeakWorld();
    const pass = createPass({
      id: "pass-rc01",
      stomperId: branded as StomperId,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    const invited = makeMembership({
      tripId: world.trip.id,
      stomperId: branded as StomperId,
      role: "rider",
      joinedAtIso: world.trip.startIso,
      participationEndsAt: world.trip.scheduledEndAt,
      status: "invited",
    });
    expect(invited.status).toBe("invited");
    const join = canJoinAsRider(
      branded as StomperId,
      world.trip,
      [...world.passes, pass],
      world.trip.startIso,
    );
    expect(join.ok).toBe(true);
    const active = { ...invited, status: "active" as const };
    expect(
      hasRiderAccessAt(active, world.trip, [...world.passes, pass], world.trip.startIso),
    ).toBe(true);
  });

  it("denial: empty / former_stomper avatar id cannot brand; no pass → invite join denied", () => {
    expect(() => Shared.toStomperId("")).toThrow();
    expect(() => Shared.toStomperId("former_stomper")).toThrow();
    const world = createPeakWorld();
    const stranger = Shared.toStomperId("avatar_no_pass") as StomperId;
    const join = canJoinAsRider(stranger, world.trip, world.passes, world.trip.startIso);
    expect(join.ok).toBe(false);
    if (!join.ok) expect(join.reason).toBe("pass_inactive");
  });
});

describe("AF-RC-02 Rider Pass → Trip participation", () => {
  it("success: active Pass grants rider access within participationEndsAt", () => {
    const world = createSaturdayWorld();
    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    expect(hasActivePass(world.passes, ID.rio, "2026-11-07T12:00:00Z")).toBe(true);
    expect(hasRiderAccessAt(rio, world.trip, world.passes, "2026-11-07T12:00:00Z")).toBe(
      true,
    );
  });

  it("denial: lapsed Pass without grace denies; completed trip denies new join", () => {
    const world = createSaturdayWorld();
    const lapsed = world.passes.map((p) =>
      p.stomperId === ID.rio ? lapsePass(p, "2026-11-07T10:00:00Z") : p,
    );
    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    // No grace yet → deny
    expect(hasRiderAccessAt(rio, world.trip, lapsed, "2026-11-07T12:00:00Z")).toBe(false);
    const oct = createOctoberWorld();
    const join = canJoinAsRider(ID.rio, oct.trip, oct.passes, "2026-12-01T00:00:00Z");
    expect(join.ok).toBe(false);
    if (!join.ok) expect(join.reason).toBe("trip_not_active");
  });
});

describe("AF-RC-03 Day Sesh → temporary participation + closure (Campfire untouched)", () => {
  it("success: Pass holder joins Day Sesh; close keeps records + empty campfireEffects", () => {
    const sesh = createSunriseShredDaySesh();
    const squad = cloneSquad(createSunriseSquad());
    const campfire = cloneCampfire(createSunriseCampfireStub());
    const beforeSquad = structuredClone(squad);
    const beforeCf = structuredClone(campfire);
    const joined = joinDaySesh({
      sesh,
      stomperId: DS_ID.rio,
      passes: sunrisePasses(),
      nowIso: FIXTURE_CREATED_AT,
      source: "temporary_friend",
    });
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    const closed = closeDaySesh(joined.value, "2026-12-01T18:00:00Z");
    expect(closed.sesh.status).toBe("closed");
    expect(closed.campfireEffects).toEqual([]);
    expect(squad).toEqual(beforeSquad);
    expect(campfire).toEqual(beforeCf);
  });

  it("denial: Trip Drop grace NEVER unlocks Day Sesh; closed sesh rejects join", () => {
    const sesh = createSunriseShredDaySesh();
    const closed = closeDaySesh(sesh, "2026-12-01T18:00:00Z").sesh;
    const rejoin = canJoinDaySesh(DS_ID.rio, closed, sunrisePasses(), "2026-12-01T19:00:00Z");
    expect(rejoin.ok).toBe(false);
    // Grace on Trip Drop must not grant Day Sesh
    const world = createSaturdayWorld();
    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    const withGrace = { ...rio, graceUntilAt: world.trip.scheduledEndAt };
    const denied = daySeshDeniedDespiteTripGrace(
      DS_ID.rio,
      createSunriseShredDaySesh(),
      [], // no active Pass
      FIXTURE_CREATED_AT,
      withGrace.graceUntilAt!,
    );
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe("pass_inactive");
  });
});

describe("AF-RC-04 Squad membership → persistent Campfire", () => {
  it("success: active Squad member reads/posts Campfire", () => {
    let w = CF.createWorld();
    const gate = CF.canAccessCampfire({
      stomper: w.people.get(CF.IDS.ava)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
    });
    expect(gate.ok).toBe(true);
    w = v(
      CF.postMessage(w, {
        id: "rc04",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "persistent campfire note",
      }),
    );
    expect(w.messages.some((m) => m.id === "rc04")).toBe(true);
  });

  it("denial: leave Squad ends Campfire access; authored msgs remain", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc04b",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "stays after leave",
      }),
    );
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const gate = CF.canAccessCampfire({
      stomper: w.people.get(CF.IDS.ava)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.error).toBe("not_member");
    const msg = w.messages.find((m) => m.id === "rc04b")!;
    expect(msg.body).toBe("stays after leave");
    expect(msg.authorId).toBe(CF.IDS.ava);
  });
});

describe("AF-RC-05 Campfire → Single-Squad Quick Share", () => {
  it("success: one-Squad Quick Share prepare→confirm→wouldPost", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "rc05",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_rc05",
        actorId: CF.IDS.ava,
        mediaRefId: "rc05",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    w = v(CF.confirmQuickShare(w, "si_rc05", "lnk_rc05"));
    const intent = w.shareIntents.find((i) => i.id === "si_rc05")!;
    expect(intent.state).toBe("confirmed");
    expect(CF.shareWouldPost(intent)).toBe(true);
  });

  it("denial: multi-Squad beginQuickShare rejected; zero squads rejected", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "rc05d",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const multi = CF.beginQuickShare(w, {
      intentId: "si_multi",
      actorId: CF.IDS.ava,
      mediaRefId: "rc05d",
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
    });
    expect(multi.ok).toBe(false);
    if (!multi.ok) expect(multi.error).toBe("multi_recipient");
    const empty = CF.beginQuickShare(w, {
      intentId: "si_empty",
      actorId: CF.IDS.ava,
      mediaRefId: "rc05d",
      squadIds: [],
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("multi_recipient");
  });
});

describe("AF-RC-06 Sesh → permission-bound content + recipient confirm (SV-0)", () => {
  it("success: prepare pending → claim → recheck ok → delivered character Done", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "rc06",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const clock = { t: Date.parse(w.nowIso) };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_rc06",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "rc06",
      mediaRefId: "rc06" as MediaRefId,
      readbackText: "Share rc06 to Sunrise",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    expect(CF.SESH_PENDING_TTL_MS).toBe(20000);
    const claim = v(
      CF.claimPendingConfirmation(store, {
        pendingId: "p_rc06",
        actorId: CF.IDS.ava,
        channel: "voice",
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
    expect(gate.ok).toBe(true);
    // Dup confirm → already_handled
    const dup = CF.claimPendingConfirmation(store, {
      pendingId: "p_rc06",
      actorId: CF.IDS.ava,
      channel: "tap",
    });
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error).toBe("already_handled");
  });

  it("denial: TTL expiry + multi-squad voice deny; locked session blocks claim", () => {
    const action = CF.prepareFromVoice({ kind: "post_to_all_squads" }, CF.IDS.ava);
    expect(action.kind).toBe("denied");
    if (action.kind === "denied") expect(action.reason).toBe("multi_recipient");

    const clock = { t: 20_000_000 };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_rc06d",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "rc06d",
      mediaRefId: "rc06d" as MediaRefId,
      readbackText: "Share",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    // Locked session before TTL elapses
    const locked = CF.claimPendingConfirmation(store, {
      pendingId: "p_rc06d",
      actorId: CF.IDS.ava,
      channel: "tap",
      sessionUnlocked: false,
    });
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.error).toBe("session_locked");

    clock.t += CF.SESH_PENDING_TTL_MS;
    const late = CF.applyVoiceConfirm(store, {
      text: "Yes, approve",
      actorId: CF.IDS.ava,
    });
    expect(late.ok).toBe(false);
    expect(store.get("p_rc06d")?.status).toBe("expired");
    expect(CF.characterForPendingStatus(store.get("p_rc06d")?.status)).not.toBe("done");
  });
});

describe("AF-RC-07 Viewer entitlement → time-limited downloads (≤45d; never extends)", () => {
  it("success: finalized Trip Viewer download within 45d MediaRef deadline", () => {
    const world = createOctoberWorld();
    const viewer = world.viewers[0]!;
    expect(VIEWER_MEDIA_MAX_DAYS).toBe(45);
    const deadline = mediaViewerDeadline(world.trip);
    expect(deadline.kind).toBe("media_45d");
    expect(viewer.downloadUntilIso).toBe(deadline.deadlineIso);
    const ok = canDownloadViewer(viewer, viewer.downloadUntilIso!);
    expect(ok.ok).toBe(true);
    // A2/A3: share/MediaRef never extends Trip deadline
    const anchor = Shared.tripToEndAnchor(world.trip);
    expect(anchor.ok).toBe(true);
    if (!anchor.ok) return;
    const shim = CF.mediaViewerDeadline(anchor.value);
    expect(shim.deadlineIso).toBe(deadline.deadlineIso);
  });

  it("denial: after deadline / revoked / projected (not finalized) denied", () => {
    const world = createOctoberWorld();
    const viewer = world.viewers[0]!;
    const after = canDownloadViewer(viewer, "2099-01-01T00:00:00Z");
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.reason).toBe("viewer_download_denied");
    const revoked = canDownloadViewer(
      { ...viewer, revokedAtIso: "2026-11-15T00:00:00Z" },
      "2026-11-16T00:00:00Z",
    );
    expect(revoked.ok).toBe(false);
    const sat = createSaturdayWorld();
    const projected = sat.viewers[0]!;
    expect(projected.downloadUntilIso).toBeNull();
    const projDeny = canDownloadViewer(projected, "2026-11-07T12:00:00Z");
    expect(projDeny.ok).toBe(false);
  });
});

describe("AF-RC-08 Trip extensions → Rider Pass expiry + grace", () => {
  it("success: extension moves scheduledEnd; pass lapse freezes graceUntilAt", () => {
    const world = createSaturdayWorld();
    const ext = approveExtension({
      trip: world.trip,
      memberships: world.memberships,
      passes: world.passes,
      actorId: ID.cole,
      revisedEndAt: "2026-11-08T23:59:00Z",
      extensionId: "ext-rc08" as ExtensionId,
      clock: fixedClock("2026-11-07T15:00:00Z"),
    });
    expect(ext.ok).toBe(true);
    if (!ext.ok) return;
    expect(ext.value.trip.scheduledEndAt).toBe("2026-11-08T23:59:00Z");
    // Media deadline follows Trip only (never share)
    const before = mediaViewerDeadline(world.trip).deadlineIso;
    const after = mediaViewerDeadline(ext.value.trip).deadlineIso;
    expect(after).not.toBe(before);

    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    const frozen = applyPassLapseToMembership(
      rio,
      ext.value.trip,
      "2026-11-07T16:00:00Z",
    );
    expect(frozen.graceUntilAt).toBe(ext.value.trip.scheduledEndAt);
    expect(
      inGrace(frozen, ext.value.trip, ext.value.trip.scheduledEndAt),
    ).toBe(true);
    expect(
      hasRiderAccessAt(frozen, ext.value.trip, [], ext.value.trip.scheduledEndAt),
    ).toBe(true);
  });

  it("denial: after graceUntilAt access ends; Day Sesh still needs Pass", () => {
    const world = createSaturdayWorld();
    const rio = world.memberships.find((m) => m.stomperId === ID.rio)!;
    const frozen = applyPassLapseToMembership(
      rio,
      world.trip,
      "2026-11-07T10:00:00Z",
    );
    const afterGrace = "2026-11-09T00:00:00Z";
    expect(hasRiderAccessAt(frozen, world.trip, [], afterGrace)).toBe(false);
    const ds = canJoinDaySesh(DS_ID.rio, createSunriseShredDaySesh(), [], FIXTURE_CREATED_AT);
    expect(ds.ok).toBe(false);
    if (!ds.ok) expect(ds.reason).toBe("pass_inactive");
  });
});

describe("AF-RC-09 Personal history/export → retention boundaries", () => {
  it("success: 12mo text / 90d standalone / Trip ≤45d clocks independent", () => {
    expect(CF.CAMPFIRE_TEXT_MAX_MONTHS).toBe(12);
    expect(CF.CAMPFIRE_MEDIA_MAX_DAYS).toBe(90);
    expect(VIEWER_MEDIA_MAX_DAYS).toBe(45);
    expect(VIEWER_ONLY_MONTHS).toBe(12);
    expect(RIDER_ARCHIVE_MONTHS).toBe(12);
    expect(PASS_EXPORT_ONLY_MONTHS).toBe(12);

    const textExp = CF.textExpiresAt("2026-01-01T00:00:00Z");
    expect(textExp).toBe("2027-01-01T00:00:00Z");
    const standalone = CF.standaloneMediaExpiresAt("2026-01-01T00:00:00Z");
    expect(standalone).toBe("2026-04-01T00:00:00Z");

    const oct = createOctoberWorld();
    const tripDl = mediaViewerDeadline(oct.trip);
    expect(tripDl.deadlineIso).toBeTruthy();
    // History remains after media soft-delete mark
    const marked = markMediaDeletedAtDeadline(oct.trip, tripDl.deadlineIso!);
    expect(marked.historyIntact).toBe(true);
    expect(marked.deletionJob.enabled).toBe(false);
    const hist = tripHistoryReadableAfterMediaDelete(oct.trip);
    expect(hist.id).toBe(oct.trip.id);
    expect(hist.officialEndDate).toBe(oct.trip.officialEndDate);
    expect(hist.status).toBe(oct.trip.status);

    const viewerClock = viewerOnlyAccountClock(ID.vik, "2026-01-01T00:00:00Z");
    expect(viewerClock.kind).toBe("viewer_only_12mo");
  });

  it("denial: soft-hide past expiry; no deletion jobs; Day Sesh G1 day_sesh_45d_max", () => {
    expect(CF.assertNoDeletionJob().enabled).toBe(false);
    const dsDeadline = CF.daySeshMediaDeadline();
    expect(dsDeadline.flag).toBe("day_sesh_45d_max");
    expect(dsDeadline.deadlineAt).toBeNull();
    expect(dsDeadline.maxDays).toBe(45);
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc09",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "old text",
      }),
    );
    const msg = w.messages.find((m) => m.id === "rc09")!;
    const past = "2099-01-01T00:00:00Z";
    expect(CF.messageRenderState(msg, past)).toBe("expired");
    // MediaRef never extends Trip 45d — share preview carries trip_drop_45d source
    w = v(
      CF.uploadMedia(w, {
        id: "rc09m",
        ownerId: CF.IDS.ava,
        origin: "trip_drop",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_rc09",
        actorId: CF.IDS.ava,
        mediaRefId: "rc09m",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_rc09")!;
    expect(intent.preview.expirySource).toBe("trip_drop_45d");
  });
});

describe("AF-RC-10 Blocking, reporting, deletion, permission revocation", () => {
  it("success: block collapses for blocker; report stub; author-delete own msg; leave revokes access", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc10",
        authorId: CF.IDS.cal,
        squadId: CF.IDS.sunrise,
        body: "cal says hi",
      }),
    );
    // Ava blocks Cal (same Squad)
    const block = CF.createBlock({
      id: "blk_rc10" as BlockId,
      blockerId: CF.IDS.ava,
      blockedId: CF.IDS.cal,
      createdAt: w.nowIso,
    });
    w = { ...w, blocks: [...w.blocks, block] };
    const render = CF.renderForViewer({
      message: w.messages.find((m) => m.id === "rc10")!,
      viewerId: CF.IDS.ava,
      blocks: w.blocks,
      revealedMessageIds: new Set(),
      nowIso: w.nowIso,
    });
    expect(render).toBe("collapsed_for_blocker");
    const report = CF.fileReport({
      id: "rpt_rc10" as ReportId,
      reporterId: CF.IDS.ava,
      target: { kind: "message", id: "rc10" },
      reason: "harassment_stub",
      evidenceRef: "rc10" as MediaRefId,
      createdAt: w.nowIso,
    });
    expect(report.state).toBe("queued");
    expect(report.route).toBe("stomp_moderation");
    expect(CF.reportPausesExpiry(report)).toBe(false);

    // Author delete own
    w = v(CF.deleteOwnMessage(w, CF.IDS.cal, "rc10" as MessageId));
    const deleted = w.messages.find((m) => m.id === "rc10")!;
    expect(deleted.body).toBeNull();

    // Permission revocation via leave
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const access = CF.canAccessCampfire({
      stomper: w.people.get(CF.IDS.ava)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
    });
    expect(access.ok).toBe(false);
  });

  it("denial: admin cannot delete others; blocked invite silent; youth Campfire disabled; A7 SPEC", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "rc10d",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "ava owned",
      }),
    );
    // Cal (member, not author) cannot delete Ava's message
    const del = CF.deleteOwnMessage(w, CF.IDS.cal, "rc10d" as MessageId);
    expect(del.ok).toBe(false);
    if (!del.ok) expect(del.error).toBe("not_author");

    // Block then invite → silently_denied (Ava blocks Gia who is not yet a member)
    const blk = CF.createBlock({
      id: "blk_rc10d" as BlockId,
      blockerId: CF.IDS.ava,
      blockedId: CF.IDS.gia,
      createdAt: w.nowIso,
    });
    w = { ...w, blocks: [...w.blocks, blk] };
    const inv = CF.inviteToSquad(w, {
      id: "inv_rc10d",
      squadId: CF.IDS.sunrise,
      fromId: CF.IDS.ava,
      toId: CF.IDS.gia,
    });
    expect(inv.ok).toBe(true);
    if (inv.ok) {
      const silent = inv.value.invites.find((i) => i.id === "inv_rc10d");
      expect(silent?.status).toBe("silently_denied");
    }

    // Youth still disabled (A7 SPEC — do not enable)
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    expect(Shared.ageBandToAccountStatus("grom")).toBe("youth");
    const youthGate = CF.accountAllowsCampfire("youth");
    expect(youthGate.ok).toBe(false);
    if (!youthGate.ok) expect(youthGate.error).toBe("youth_disabled");
  });
});

describe("AF-RC index + A1–A6 reuse (A7 SPEC untouched)", () => {
  it("exports trips + daysesh + campfireCf2 + shared; A6 facts drive denials", () => {
    const world = createPeakWorld();
    const factsViewer = Shared.participationFacts(ID.vik, world, null);
    expect(factsViewer.isTripViewer).toBe(true);
    expect(factsViewer.isTripRiderOrHost).toBe(false);
    const factsRider = Shared.participationFacts(ID.rio, world, null);
    expect(factsRider.isTripRiderOrHost).toBe(true);
    expect(factsRider.hasActivePassEntitlement).toBe(true);
    // A5 map still total
    expect(Shared.mapGuardReasonToDeny("pass_inactive")).not.toBe("ok");
    // A7 remains SPEC — grom→youth does not enable Campfire
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
  });
});
