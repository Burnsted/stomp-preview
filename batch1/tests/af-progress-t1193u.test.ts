/**
 * AF-PROGRESS-t1193u — expand thin AF-RC / AF-JOURNEY / deny-path / authz matrix
 * + export rehearsal fixtures. Fictional only. No live auth / Pages / youth / wipe.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import {
  ID,
  applyPassLapseToMembership,
  createOctoberWorld,
  createPass,
  createPeakWorld,
  createSaturdayWorld,
  type StomperId,
} from "../src/trips/index.js";
import type { MediaRefId } from "../src/campfire/cf2-types.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-JOURNEY-t1193u expanded denial paths", () => {
  it("session_locked confirm share denied via authorizeConfirmShare", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "j1193_lock",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_j1193_lock",
        actorId: CF.IDS.ava,
        mediaRefId: "j1193_lock",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const intent = w.shareIntents.find((i) => i.id === "si_j1193_lock")!;
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

  it("Trip Viewer alone cannot Campfire-react; Squad member can", () => {
    const trip = createPeakWorld();
    let w = CF.createWorld();
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    // Vik is Trip viewer in peak world; not a Sunrise Squad member here
    const vik = {
      ...w.people.get(CF.IDS.vik)!,
      id: ID.vik,
    };
    const deny = Shared.authorizeViewerReact({
      stomper: vik,
      campfire,
      memberships: w.memberships,
      tripWorld: trip,
    });
    expect(deny.allow).toBe(false);
    if (!deny.allow) expect(deny.code).toBe("not_member");

    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizeViewerReact({
        stomper: ava,
        campfire,
        memberships: w.memberships,
        tripWorld: trip,
      }).allow,
    ).toBe(true);
  });

  it("non-admin Squad member denied invite; owner/admin allowed", () => {
    const w = CF.createWorld();
    const squad = w.squads.get(CF.IDS.sunrise)!;
    // Sunrise: Ava owner, Cal admin, Ben/Eli/Dee members
    const ben = w.people.get(CF.IDS.ben)!;
    const deny = Shared.authorizeSquadInvite({
      actor: ben,
      squad,
      memberships: w.memberships,
    });
    expect(deny.allow).toBe(false);
    if (!deny.allow) expect(deny.code).toBe("not_squad_admin");

    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizeSquadInvite({
        actor: ava,
        squad,
        memberships: w.memberships,
      }).allow,
    ).toBe(true);
    const cal = w.people.get(CF.IDS.cal)!;
    expect(
      Shared.authorizeSquadInvite({
        actor: cal,
        squad,
        memberships: w.memberships,
      }).allow,
    ).toBe(true);
  });

  it("youth enrollment + Campfire post remain denied (HELD)", () => {
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    const w = CF.createWorld();
    const youth = {
      ...w.people.get(CF.IDS.ben)!,
      accountStatus: "youth" as const,
    };
    expect(Shared.authorizeAdultCampfireEnrollment({ stomper: youth }).allow).toBe(
      false,
    );
    const deny = Shared.authorizeCampfireAccess({
      stomper: youth,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
      forPost: true,
    });
    expect(deny.allow).toBe(false);
  });
});

describe("AF-RC-t1193u deny-path matrix (audited)", () => {
  it("compose Pass lapse · leave · multi-share · TTL · erase into append-only audit", () => {
    const audit = Shared.createAuthzAuditLog();
    const sat = createSaturdayWorld();
    const rio = sat.memberships.find((m) => m.stomperId === ID.rio)!;
    const frozen = applyPassLapseToMembership(rio, sat.trip, "2026-11-07T10:00:00Z");
    const passDeny = Shared.authorizeRiderAccessAt({
      membership: frozen,
      trip: sat.trip,
      passes: [],
      atIso: "2026-11-09T00:00:00Z",
    });
    audit.recordDecision({
      actorId: String(ID.rio),
      resource: "trip:retain",
      decision: passDeny,
      timestamp: "2026-11-09T00:00:00Z",
    });
    expect(passDeny.allow).toBe(false);

    let w = CF.createWorld();
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const leaveDeny = Shared.authorizeCampfireAccess({
      stomper: w.people.get(CF.IDS.ava)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
      forPost: true,
    });
    audit.recordDecision({
      actorId: CF.IDS.ava,
      resource: "campfire:post",
      decision: leaveDeny,
      timestamp: w.nowIso,
    });
    expect(leaveDeny.allow).toBe(false);

    const multi = Shared.authorizePrepareShare({
      actorId: CF.IDS.ben,
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
      memberships: w.memberships,
    });
    audit.recordDecision({
      actorId: CF.IDS.ben,
      resource: "share:prepare:multi",
      decision: multi,
      timestamp: w.nowIso,
    });
    expect(multi.allow).toBe(false);
    if (!multi.allow) expect(multi.code).toBe("multi_recipient");

    const clock = { t: 9_000_000 };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_rc1193_ttl",
      actorId: CF.IDS.ben,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "x",
      mediaRefId: "x" as MediaRefId,
      readbackText: "Share",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    clock.t += CF.SESH_PENDING_TTL_MS + 1;
    const late = CF.claimPendingConfirmation(store, {
      pendingId: "p_rc1193_ttl",
      actorId: CF.IDS.ben,
      channel: "tap",
      sessionUnlocked: true,
    });
    expect(late.ok).toBe(false);
    audit.append({
      actorId: CF.IDS.ben,
      resource: "share:confirm:ttl",
      action: "confirm_share_rechecked",
      reasonCode: "expired",
      timestamp: new Date(clock.t).toISOString(),
      outcome: "deny",
    });

    w = CF.eraseStomper(w, CF.IDS.ben);
    const eraseDeny = Shared.authorizePersonalExport({
      actorId: CF.IDS.ben,
      stomper: w.people.get(CF.IDS.ben)!,
    });
    audit.recordDecision({
      actorId: CF.IDS.ben,
      resource: "export:personal",
      decision: eraseDeny,
      timestamp: w.nowIso,
    });
    expect(eraseDeny.allow).toBe(false);

    const snap = audit.snapshot();
    expect(snap.length).toBe(5);
    expect(snap.every((e) => e.outcome === "deny")).toBe(true);
    expect(audit.tryClear()).toEqual({ ok: false, reason: "append_only" });
  });

  it("host/cohost allow; plain rider denied on cohost action", () => {
    const peak = createPeakWorld();
    const hostId = String(peak.memberships.find((m) => m.role === "host")!.stomperId);
    expect(
      Shared.authorizeCohostAction({
        actorId: hostId,
        memberships: peak.memberships,
        tripId: peak.trip.id,
      }).allow,
    ).toBe(true);
    const cohost = peak.memberships.find((m) => m.role === "cohost");
    if (cohost) {
      expect(
        Shared.authorizeCohostAction({
          actorId: String(cohost.stomperId),
          memberships: peak.memberships,
          tripId: peak.trip.id,
        }).allow,
      ).toBe(true);
    }
    const rider = peak.memberships.find((m) => m.role === "rider");
    if (rider) {
      const deny = Shared.authorizeCohostAction({
        actorId: String(rider.stomperId),
        memberships: peak.memberships,
        tripId: peak.trip.id,
      });
      expect(deny.allow).toBe(false);
      if (!deny.allow) expect(deny.code).toBe("not_host_or_cohost");
    }
  });
});

describe("AF-AUTHZ-MATRIX-t1193u session + rate + export composition", () => {
  it("alive session allows export under rate budget; kill then session_killed", () => {
    const sessions = Shared.createSessionStore();
    const limiter = Shared.createRateLimiter({
      personal_export: { maxPerWindow: 2, windowMs: 60_000 },
    });
    const w = CF.createWorld();
    const ava = w.people.get(CF.IDS.ava)!;
    sessions.issue({
      sessionId: "sess_t1193",
      actorId: CF.IDS.ava,
      createdAt: w.nowIso,
    });

    const ok1 = Shared.authorizePersonalExportWithSession({
      sessionStore: sessions,
      sessionId: "sess_t1193",
      actorId: CF.IDS.ava,
      stomper: ava,
    });
    expect(ok1.allow).toBe(true);

    expect(
      Shared.authorizePersonalExportRateLimited({
        limiter,
        actorId: CF.IDS.ava,
        stomper: ava,
        nowMs: 10,
      }).allow,
    ).toBe(true);

    sessions.kill("sess_t1193", w.nowIso);
    const dead = Shared.authorizePersonalExportWithSession({
      sessionStore: sessions,
      sessionId: "sess_t1193",
      actorId: CF.IDS.ava,
      stomper: ava,
    });
    expect(dead.allow).toBe(false);
    if (!dead.allow) expect(dead.code).toBe("session_killed");
  });

  it("Viewer download deny after revoke; MediaRef deny after leave (matrix)", () => {
    const oct = createOctoberWorld();
    const viewer = oct.viewers[0]!;
    expect(
      Shared.authorizeViewerDownload({
        viewer: { ...viewer, revokedAtIso: "2026-11-15T00:00:00Z" },
        atIso: "2026-11-16T00:00:00Z",
      }).allow,
    ).toBe(false);

    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "mx1193",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshOfficialEndedAt: "2026-02-15T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const deny = Shared.authorizeMediaRefAccess({
      stomper: w.people.get(CF.IDS.ava)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
      asset: w.assets.get("mx1193")!,
      nowIso: w.nowIso,
    });
    expect(deny.allow).toBe(false);
    if (!deny.allow) expect(deny.code).toBe("not_member");
  });
});

describe("AF-EXPORT-REHEARSAL-t1193u fixtures", () => {
  it("fixture table covers allow + deny codes; schema lock holds", () => {
    expect(Shared.EXPORT_REHEARSAL_FIXTURES.length).toBeGreaterThanOrEqual(4);
    for (const row of Shared.EXPORT_REHEARSAL_FIXTURES) {
      expect(row.id).toBeTruthy();
      if (row.expectOk) {
        expect(row.sampleExport).toBeTruthy();
        expect(
          Shared.assertFictionalExportSchemaLock(
            row.sampleExport!.schema,
            row.sampleExport!.fictionalOnly,
            row.sampleExport!.physicalWipeGuaranteed,
          ),
        ).toBe(true);
      } else {
        expect(row.expectDenyCode).toBeTruthy();
      }
    }
    expect(Shared.exportRehearsalById("actor_mismatch_deny").expectDenyCode).toBe(
      "export_actor_mismatch",
    );
  });

  it("owner_allow_minimal builds real fictional export matching fixture schema", () => {
    const fixture = Shared.exportRehearsalById("owner_allow_minimal");
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "reh_media",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const result = Shared.buildRiderPersonalExport({
      actorId: CF.IDS.ava,
      stomper: w.people.get(CF.IDS.ava)!,
      squads: [...w.squads.values()],
      campfires: [...w.campfires.values()],
      memberships: w.memberships,
      messages: w.messages,
      ownedMedia: [...w.assets.values()],
      exportedAtIso: w.nowIso,
    });
    expect(result.ok).toBe(fixture.expectOk);
    if (!result.ok) return;
    expect(
      Shared.assertFictionalExportSchemaLock(
        result.export.schema,
        result.export.fictionalOnly,
        result.export.physicalWipeGuaranteed,
      ),
    ).toBe(true);
    expect(result.export.ownedMediaRefs.some((m) => m.id === "reh_media")).toBe(true);
  });

  it("actor_mismatch_deny + account_erased_deny match fixture codes", () => {
    const w = CF.createWorld();
    const mismatch = Shared.buildRiderPersonalExport({
      actorId: CF.IDS.ben,
      stomper: w.people.get(CF.IDS.ava)!,
      squads: [...w.squads.values()],
      campfires: [...w.campfires.values()],
      memberships: w.memberships,
      messages: w.messages,
      ownedMedia: [...w.assets.values()],
      exportedAtIso: w.nowIso,
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok && !mismatch.decision.allow) {
      expect(mismatch.decision.code).toBe(
        Shared.exportRehearsalById("actor_mismatch_deny").expectDenyCode,
      );
    }

    const { exportDecision } = Shared.revokeThenDenyExport({
      stomper: w.people.get(CF.IDS.ben)!,
      memberships: [...w.memberships],
      invites: [],
      nowIso: w.nowIso,
      actorId: CF.IDS.ben,
    });
    expect(exportDecision.allow).toBe(false);
    if (!exportDecision.allow) {
      expect(exportDecision.code).toBe(
        Shared.exportRehearsalById("account_erased_deny").expectDenyCode,
      );
    }
  });

  it("post_leave_membership_slice: export ok but left Squad history omitted", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "reh_leave_msg",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "before leave",
      }),
    );
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const result = Shared.buildRiderPersonalExport({
      actorId: CF.IDS.ava,
      stomper: w.people.get(CF.IDS.ava)!,
      squads: [...w.squads.values()],
      campfires: [...w.campfires.values()],
      memberships: w.memberships,
      messages: w.messages,
      ownedMedia: [...w.assets.values()],
      exportedAtIso: w.nowIso,
    });
    expect(result.ok).toBe(
      Shared.exportRehearsalById("post_leave_membership_slice").expectOk,
    );
    if (!result.ok) return;
    expect(result.export.visibleMessages.some((m) => m.id === "reh_leave_msg")).toBe(
      false,
    );
    expect(result.export.memberships.every((m) => m.state !== "active" || m.squadId !== CF.IDS.sunrise)).toBe(
      true,
    );
  });
});

describe("AF-JOURNEY-t1193u locks preserved", () => {
  it("SHARE_MS / youth / deletion-job locks; branded Pass join still works", () => {
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(20_000);
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    expect(CF.assertNoDeletionJob().enabled).toBe(false);

    const peak = createPeakWorld();
    const branded = Shared.toStomperId("t1193_rider") as StomperId;
    const pass = createPass({
      id: "pass-t1193",
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
  });
});
