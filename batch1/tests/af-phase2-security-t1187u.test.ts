/**
 * AF Phase 2 security readiness (t1187u) — audit · session kill · rate limits.
 * Fictional only. No Better Auth / live WAF / Pages.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import {
  createOctoberWorld,
  createPass,
  createPeakWorld,
  type StomperId,
} from "../src/trips/index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-P2-AUDIT fictionalAuthzAudit", () => {
  it("appends allow + deny for MediaRef, Quick Share prepare, export; append-only", () => {
    const audit = Shared.createAuthzAuditLog();
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "p2_audit_mr",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshOfficialEndedAt: "2026-02-15T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    const ava = w.people.get(CF.IDS.ava)!;
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    const asset = w.assets.get("p2_audit_mr")!;

    const allowMr = Shared.authorizeMediaRefAccess({
      stomper: ava,
      campfire,
      memberships: w.memberships,
      asset,
      nowIso: w.nowIso,
    });
    audit.recordDecision({
      actorId: CF.IDS.ava,
      resource: "media:p2_audit_mr",
      decision: allowMr,
      timestamp: w.nowIso,
    });
    expect(allowMr.allow).toBe(true);

    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const denyMr = Shared.authorizeMediaRefAccess({
      stomper: ava,
      campfire,
      memberships: w.memberships,
      asset,
      nowIso: w.nowIso,
    });
    audit.recordDecision({
      actorId: CF.IDS.ava,
      resource: "media:p2_audit_mr",
      decision: denyMr,
      timestamp: w.nowIso,
    });
    expect(denyMr.allow).toBe(false);

    const prep = Shared.authorizePrepareShare({
      actorId: CF.IDS.ben,
      squadIds: [CF.IDS.sunrise],
      memberships: w.memberships,
    });
    audit.recordDecision({
      actorId: CF.IDS.ben,
      resource: "share:prepare:sunrise",
      decision: prep,
      timestamp: w.nowIso,
    });

    const exportOk = Shared.authorizePersonalExport({
      actorId: CF.IDS.ben,
      stomper: w.people.get(CF.IDS.ben)!,
    });
    audit.recordDecision({
      actorId: CF.IDS.ben,
      resource: "export:personal",
      decision: exportOk,
      timestamp: w.nowIso,
    });

    const snap = audit.snapshot();
    expect(snap.length).toBe(4);
    expect(snap[0]!.outcome).toBe("allow");
    expect(snap[1]!.outcome).toBe("deny");
    expect(snap[1]!.reasonCode).toBe("not_member");
    expect(snap.every((e, i) => e.seq === i + 1)).toBe(true);
    expect(audit.tryRewrite(1)).toEqual({ ok: false, reason: "append_only" });
    expect(audit.tryClear()).toEqual({ ok: false, reason: "append_only" });
    expect(audit.length()).toBe(4);
  });

  it("erased actor denials are audited (G4 aftermath)", () => {
    const audit = Shared.createAuthzAuditLog();
    let w = CF.createWorld();
    w = CF.eraseStomper(w, CF.IDS.ben);
    const erased = w.people.get(CF.IDS.ben)!;
    const denyPrep = Shared.authorizePrepareShare({
      actorId: CF.IDS.ben,
      squadIds: [CF.IDS.sunrise],
      memberships: w.memberships,
      actor: erased,
    });
    audit.recordDecision({
      actorId: CF.IDS.ben,
      resource: "share:prepare",
      decision: denyPrep,
      timestamp: w.nowIso,
    });
    const denyExp = Shared.authorizePersonalExport({
      actorId: CF.IDS.ben,
      stomper: erased,
    });
    audit.recordDecision({
      actorId: CF.IDS.ben,
      resource: "export:personal",
      decision: denyExp,
      timestamp: w.nowIso,
    });
    expect(denyPrep.allow).toBe(false);
    expect(denyExp.allow).toBe(false);
    const denies = audit.snapshot().filter((e) => e.outcome === "deny");
    expect(denies).toHaveLength(2);
    expect(denies.every((e) => e.reasonCode === "account_erased")).toBe(true);
  });
});

describe("AF-P2-SESSION fictional session kill on G4", () => {
  it("kills session on revoke; Pass/Viewer/Campfire/export then session_killed", () => {
    const store = Shared.createSessionStore();
    let w = CF.createWorld();
    const ben = w.people.get(CF.IDS.ben)!;
    const sess = store.issue({
      sessionId: "sess_ben_1",
      actorId: CF.IDS.ben,
      createdAt: w.nowIso,
    });
    expect(sess.status).toBe("active");
    expect(store.isAlive("sess_ben_1")).toBe(true);

    const { revoked, killedSessions } = Shared.revokeAccountAndKillSessions({
      stomper: ben,
      memberships: [...w.memberships],
      invites: [],
      nowIso: w.nowIso,
      sessionStore: store,
      sessionIds: ["sess_ben_1"],
    });
    expect(revoked.physicalWipeGuaranteed).toBe(false);
    expect(killedSessions).toHaveLength(1);
    expect(killedSessions[0]!.status).toBe("killed");
    expect(store.isAlive("sess_ben_1")).toBe(false);

    const peak = createPeakWorld();
    const branded = Shared.toStomperId("p2_sess") as StomperId;
    const pass = createPass({
      id: "pass-p2",
      stomperId: branded,
      startIso: "2026-10-01T00:00:00Z",
      endIso: "2027-06-01T00:00:00Z",
    });
    const tripDeny = Shared.authorizeJoinTripWithSession({
      sessionStore: store,
      sessionId: "sess_ben_1",
      stomperId: branded,
      trip: peak.trip,
      passes: [...peak.passes, pass],
      atIso: peak.trip.startIso,
    });
    expect(tripDeny.allow).toBe(false);
    if (!tripDeny.allow) expect(tripDeny.code).toBe("session_killed");

    const oct = createOctoberWorld();
    const viewer = oct.viewers[0]!;
    const vDeny = Shared.authorizeViewerDownloadWithSession({
      sessionStore: store,
      sessionId: "sess_ben_1",
      viewer,
      atIso: viewer.downloadUntilIso!,
    });
    expect(vDeny.allow).toBe(false);
    if (!vDeny.allow) expect(vDeny.code).toBe("session_killed");

    const cfDeny = Shared.authorizeCampfireWithSession({
      sessionStore: store,
      sessionId: "sess_ben_1",
      stomper: revoked.stomper,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: revoked.memberships,
    });
    expect(cfDeny.allow).toBe(false);
    if (!cfDeny.allow) expect(cfDeny.code).toBe("session_killed");

    const expDeny = Shared.authorizePersonalExportWithSession({
      sessionStore: store,
      sessionId: "sess_ben_1",
      actorId: CF.IDS.ben,
      stomper: revoked.stomper,
    });
    expect(expDeny.allow).toBe(false);
    if (!expDeny.allow) expect(expDeny.code).toBe("session_killed");
  });
});

describe("AF-P2-RATE fictional rate limits", () => {
  it("Quick Share prepare under limit allow; over limit rate_limited; authz still applies", () => {
    const limiter = Shared.createRateLimiter({
      quick_share_prepare: { maxPerWindow: 3, windowMs: 60_000 },
    });
    const w = CF.createWorld();
    let now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      const d = Shared.authorizePrepareShareRateLimited({
        limiter,
        actorId: CF.IDS.ava,
        squadIds: [CF.IDS.sunrise],
        memberships: w.memberships,
        nowMs: now + i,
      });
      expect(d.allow).toBe(true);
    }
    const over = Shared.authorizePrepareShareRateLimited({
      limiter,
      actorId: CF.IDS.ava,
      squadIds: [CF.IDS.sunrise],
      memberships: w.memberships,
      nowMs: now + 10,
    });
    expect(over.allow).toBe(false);
    if (!over.allow) expect(over.code).toBe("rate_limited");

    // Rate limit does not bypass authz: non-member still not_member when under budget
    const limiter2 = Shared.createRateLimiter({
      quick_share_prepare: { maxPerWindow: 5, windowMs: 60_000 },
    });
    const iso = Shared.authorizePrepareShareRateLimited({
      limiter: limiter2,
      actorId: CF.IDS.vik,
      squadIds: [CF.IDS.sunrise],
      memberships: w.memberships,
      nowMs: now,
    });
    expect(iso.allow).toBe(false);
    if (!iso.allow) expect(iso.code).toBe("not_member");
  });

  it("personal export rate limit + authz not bypassed", () => {
    const limiter = Shared.createRateLimiter({
      personal_export: { maxPerWindow: 2, windowMs: 60_000 },
    });
    const w = CF.createWorld();
    const ava = w.people.get(CF.IDS.ava)!;
    expect(
      Shared.authorizePersonalExportRateLimited({
        limiter,
        actorId: CF.IDS.ava,
        stomper: ava,
        nowMs: 50,
      }).allow,
    ).toBe(true);
    expect(
      Shared.authorizePersonalExportRateLimited({
        limiter,
        actorId: CF.IDS.ava,
        stomper: ava,
        nowMs: 51,
      }).allow,
    ).toBe(true);
    const over = Shared.authorizePersonalExportRateLimited({
      limiter,
      actorId: CF.IDS.ava,
      stomper: ava,
      nowMs: 52,
    });
    expect(over.allow).toBe(false);
    if (!over.allow) expect(over.code).toBe("rate_limited");

    const limiter3 = Shared.createRateLimiter({
      personal_export: { maxPerWindow: 5, windowMs: 60_000 },
    });
    const mismatch = Shared.authorizePersonalExportRateLimited({
      limiter: limiter3,
      actorId: CF.IDS.ben,
      stomper: ava,
      nowMs: 100,
    });
    expect(mismatch.allow).toBe(false);
    if (!mismatch.allow) expect(mismatch.code).toBe("export_actor_mismatch");
  });
});
