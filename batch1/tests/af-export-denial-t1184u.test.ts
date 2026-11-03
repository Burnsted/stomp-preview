/**
 * AF-EXPORT + access-denial matrix (t1184u).
 * Fictional personal JSON export + expired-pass / leave / rejoin / revoke denies.
 * Both permitted AND denied actions covered. No live services.
 */
import { describe, expect, it } from "vitest";
import * as Shared from "../src/shared/index.js";
import * as CF from "../src/campfire/cf2-index.js";
import {
  ID,
  applyPassLapseToMembership,
  createSaturdayWorld,
} from "../src/trips/index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-EXPORT-01 permitted personal JSON export", () => {
  it("owner exports own fictional profile slice with memberships + media refs", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "exp_msg",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "exportable",
      }),
    );
    w = v(
      CF.uploadMedia(w, {
        id: "exp_media",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const ava = w.people.get(CF.IDS.ava)!;
    const result = Shared.buildRiderPersonalExport({
      actorId: CF.IDS.ava,
      stomper: ava,
      squads: [...w.squads.values()],
      campfires: [...w.campfires.values()],
      memberships: w.memberships,
      messages: w.messages,
      ownedMedia: [...w.assets.values()],
      exportedAtIso: w.nowIso,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.export.schema).toBe("stomp.rider.personal.export.v1.fictional");
    expect(result.export.fictionalOnly).toBe(true);
    expect(result.export.physicalWipeGuaranteed).toBe(false);
    expect(result.export.subject.stomperId).toBe(CF.IDS.ava);
    expect(result.export.memberships.some((m) => m.state === "active")).toBe(true);
    expect(result.export.ownedMediaRefs.some((m) => m.id === "exp_media")).toBe(true);
    expect(result.export.visibleMessages.some((m) => m.id === "exp_msg")).toBe(true);
  });
});

describe("AF-EXPORT-02 deny actor mismatch", () => {
  it("Ben cannot export Ava's personal JSON", () => {
    const w = CF.createWorld();
    const ava = w.people.get(CF.IDS.ava)!;
    const result = Shared.buildRiderPersonalExport({
      actorId: CF.IDS.ben,
      stomper: ava,
      squads: [...w.squads.values()],
      campfires: [...w.campfires.values()],
      memberships: w.memberships,
      messages: w.messages,
      ownedMedia: [...w.assets.values()],
      exportedAtIso: w.nowIso,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.decision.allow).toBe(false);
    if (!result.decision.allow) {
      expect(result.decision.code).toBe("export_actor_mismatch");
    }
  });
});

describe("AF-EXPORT-03 G4 revoke then deny export", () => {
  it("logical revoke immediately denies personal export; wipe not guaranteed", () => {
    const w = CF.createWorld();
    const ben = w.people.get(CF.IDS.ben)!;
    const { revoked, exportDecision } = Shared.revokeThenDenyExport({
      stomper: ben,
      memberships: [...w.memberships],
      invites: [],
      nowIso: w.nowIso,
      actorId: CF.IDS.ben,
    });
    expect(revoked.stomper.accountStatus).toBe("erased");
    expect(revoked.physicalWipeGuaranteed).toBe(false);
    expect(exportDecision.allow).toBe(false);
    if (!exportDecision.allow) expect(exportDecision.code).toBe("account_erased");

    const rebuild = Shared.buildRiderPersonalExport({
      actorId: CF.IDS.ben,
      stomper: revoked.stomper,
      squads: [...w.squads.values()],
      campfires: [...w.campfires.values()],
      memberships: revoked.memberships,
      messages: w.messages,
      ownedMedia: [...w.assets.values()],
      exportedAtIso: w.nowIso,
    });
    expect(rebuild.ok).toBe(false);
  });
});

describe("AF-DENY-01 expired / lapsed Rider Pass restrictions", () => {
  it("deny trip retain after grace", () => {
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
        atIso: "2026-11-09T00:00:00Z",
      }).allow,
    ).toBe(false);
  });
});

describe("AF-DENY-02 Squad leave ends access", () => {
  it("post + Campfire access denied after leave", () => {
    let w = CF.createWorld();
    const ava = w.people.get(CF.IDS.ava)!;
    const campfire = w.campfires.get(CF.IDS.cfSunrise)!;
    expect(
      Shared.authorizeCampfireAccess({
        stomper: ava,
        campfire,
        memberships: w.memberships,
        forPost: true,
      }).allow,
    ).toBe(true);
    w = v(CF.leaveSquad(w, CF.IDS.ava, CF.IDS.sunrise));
    const deny = Shared.authorizeCampfireAccess({
      stomper: ava,
      campfire,
      memberships: w.memberships,
      forPost: true,
    });
    expect(deny.allow).toBe(false);
    if (!deny.allow) expect(deny.code).toBe("not_member");
  });
});

describe("AF-DENY-03 rejoin approval required + history restricted", () => {
  it("cannot auto-rejoin; prior history cutoff after approved rejoin", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "deny_hist",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "secret prior",
      }),
    );
    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise));
    // No auto history / access
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
        joinedAt: "2026-07-01T00:00:00.000Z",
      }),
    );
    const old = w.messages.find((m) => m.id === "deny_hist")!;
    const hist = Shared.authorizeCampfireHistoryRead({
      stomper: w.people.get(CF.IDS.ben)!,
      campfire: w.campfires.get(CF.IDS.cfSunrise)!,
      memberships: w.memberships,
      message: old,
    });
    expect(hist.allow).toBe(false);
    if (!hist.allow) expect(hist.code).toBe("history_cutoff");
  });
});

describe("AF-DENY-04 account revocation blocks share prepare + export", () => {
  it("erased actor denied prepare share and personal export", () => {
    let w = CF.createWorld();
    w = CF.eraseStomper(w, CF.IDS.ben);
    const erased = w.people.get(CF.IDS.ben)!;
    expect(
      Shared.authorizePrepareShare({
        actorId: CF.IDS.ben,
        squadIds: [CF.IDS.sunrise],
        memberships: w.memberships,
        actor: erased,
      }).allow,
    ).toBe(false);
    expect(Shared.authorizePersonalExport({ actorId: CF.IDS.ben, stomper: erased }).allow).toBe(
      false,
    );
  });
});

describe("AF-DENY-05 Quick Share 20s confirm window", () => {
  it("explicit confirm required; claim past SHARE_MS denied", () => {
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(20_000);
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);
    const clock = { t: 5_000_000 };
    const store = new CF.PendingStore(() => clock.t);
    store.prepare({
      pendingId: "p_exp_ttl",
      actorId: CF.IDS.ava,
      kind: "share_media",
      squadId: CF.IDS.sunrise,
      contentHash: "exp",
      mediaRefId: "exp" as CF.MediaRefId,
      readbackText: "Share",
      ttlMs: CF.SESH_PENDING_TTL_MS,
    });
    clock.t += CF.SESH_PENDING_TTL_MS + 1;
    const late = CF.claimPendingConfirmation(store, {
      pendingId: "p_exp_ttl",
      actorId: CF.IDS.ava,
      channel: "tap",
      sessionUnlocked: true,
    });
    expect(late.ok).toBe(false);
  });
});
