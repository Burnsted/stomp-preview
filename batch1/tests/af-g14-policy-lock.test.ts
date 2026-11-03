/**
 * AF-G14-01..14 — Ted LOCKED G1–G4 policy regression (t1166u).
 * Fictional data only. NOT production deletion / real-user authz.
 *
 * Ted's 14 numbered cases (owner-approved Nov 2, 2026):
 *  1 Day Sesh media window (flag locked; deadline null until official end)
 *  2 45d max after official Day Sesh end
 *  3 Campfire link/share NEVER resets DS media clock
 *  4 Revoked / expired link → deny access
 *  5 Leave terminates membership-based access
 *  6 Rejoin requires NEW approved membership
 *  7 Rejoin does NOT auto-expose prior Campfire history
 *  8 Ownership transfer completes ONLY after nominee accepts
 *  9 Unresolved owner → no auto-elevation / fallback admin
 * 10 Unresolved owner → members + moderation paths intact
 * 11 Account deletion → deny new auth actions (logical revoke)
 * 12 Deletion does NOT erase other members' content
 * 13 Trip Drop + Campfire retention regressions stay green
 * 14 SV-0 share confirm / authz recheck / Squad isolation no regression
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";
import * as Shared from "../src/shared/index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-G14 G1 Day Sesh media retention", () => {
  it("AF-G14-01 Day Sesh media window — flag day_sesh_45d_max; deadline null before official end", () => {
    expect(CF.UNRESOLVED_GATES.day_sesh_media_deadline.status).toBe("locked");
    expect(CF.DAY_SESH_MEDIA_MAX_DAYS).toBe(45);
    const before = CF.daySeshMediaDeadline();
    expect(before.flag).toBe("day_sesh_45d_max");
    expect(before.deadlineAt).toBeNull();
    expect(before.maxDays).toBe(45);
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "g14_01",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshId: CF.IDS.ds1,
        tripBoundIso: null,
      }),
    );
    expect(w.assets.get("g14_01")!.flag).toBe("day_sesh_45d_max");
    expect(w.assets.get("g14_01")!.expiresAt).toBeNull();
  });

  it("AF-G14-02 45d max after official Day Sesh end", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "g14_02",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshId: CF.IDS.ds1,
        tripBoundIso: null,
      }),
    );
    const closed = CF.closeLinkedDaySesh(w);
    w = closed.world;
    const official = w.daySesh.officialEndedAt!;
    const expected = CF.daySeshMediaExpiresAt(official);
    expect(w.assets.get("g14_02")!.expiresAt).toBe(expected);
    expect(w.assets.get("g14_02")!.flag).toBe("day_sesh_45d_max");
    const dl = CF.daySeshMediaDeadline(official);
    expect(dl.deadlineAt).toBe(expected);
    // max = official + 45d
    const ms = new Date(expected).getTime() - new Date(official).getTime();
    expect(ms).toBe(45 * 24 * 60 * 60 * 1000);
  });

  it("AF-G14-03 Campfire link/share NEVER resets or extends DS media clock", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "g14_03",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshId: CF.IDS.ds1,
        daySeshOfficialEndedAt: "2026-01-01T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    const before = { ...w.assets.get("g14_03")! };
    expect(before.expiresAt).toBe(CF.daySeshMediaExpiresAt("2026-01-01T00:00:00.000Z"));
    w = v(
      CF.postMediaToSquad(w, {
        linkId: "lg14_03",
        mediaRefId: "g14_03",
        squadId: CF.IDS.sunrise,
        postedBy: CF.IDS.ava,
      }),
    );
    const afterLink = w.assets.get("g14_03")!;
    expect(CF.assertShareDoesNotExtendMediaClock(before, afterLink)).toBe(true);
    w = CF.advanceClock(w, "2026-01-10T00:00:00.000Z");
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_g14_03",
        actorId: CF.IDS.ava,
        mediaRefId: "g14_03",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const afterShare = w.assets.get("g14_03")!;
    expect(afterShare.expiresAt).toBe(before.expiresAt);
    expect(afterShare.uploadedAt).toBe(before.uploadedAt);
  });

  it("AF-G14-04 revoked / expired media access denied on recheck", () => {
    // FIXTURE_NOW = 2026-03-01 — use official end still inside the 45d window
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "g14_04",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshOfficialEndedAt: "2026-02-15T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    expect(w.assets.get("g14_04")!.expiresAt).toBe(
      CF.daySeshMediaExpiresAt("2026-02-15T00:00:00.000Z"),
    );
    // Within window — allow
    expect(
      CF.recheckMediaAccess(w, {
        actorId: CF.IDS.ava,
        mediaRefId: "g14_04",
        squadId: CF.IDS.sunrise,
      }).ok,
    ).toBe(true);
    // Past 45d — deny expired (official+45d = 2026-04-01)
    w = CF.advanceClock(w, "2026-04-02T00:00:00.000Z");
    const past = CF.recheckMediaAccess(w, {
      actorId: CF.IDS.ava,
      mediaRefId: "g14_04",
      squadId: CF.IDS.sunrise,
    });
    expect(past.ok).toBe(false);
    if (!past.ok) expect(past.error).toBe("expired");

    // Separate fixture — leave → membership deny on media recheck
    let w2 = CF.createWorld();
    w2 = v(
      CF.uploadMedia(w2, {
        id: "g14_04b",
        ownerId: CF.IDS.ben,
        origin: "campfire",
      }),
    );
    w2 = v(CF.leaveSquad(w2, CF.IDS.ben, CF.IDS.sunrise));
    const left = CF.recheckMediaAccess(w2, {
      actorId: CF.IDS.ben,
      mediaRefId: "g14_04b",
      squadId: CF.IDS.sunrise,
    });
    expect(left.ok).toBe(false);
  });
});

describe("AF-G14 G2 Squad leave / rejoin", () => {
  it("AF-G14-05 leave terminates current membership-based access", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "g14_05",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "hello",
      }),
    );
    expect(v(CF.readRecentMessages(w, CF.IDS.ben, CF.IDS.sunrise)).items.length).toBeGreaterThan(0);
    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise));
    const mem = w.memberships.find(
      (m) => m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.sunrise && m.state === "left",
    );
    expect(mem).toBeTruthy();
    const denied = CF.readRecentMessages(w, CF.IDS.ben, CF.IDS.sunrise);
    expect(denied.ok).toBe(false);
  });

  it("AF-G14-06 rejoin requires NEW approved membership (no auto reentry)", () => {
    let w = CF.createWorld();
    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise));
    // Former membership does not restore access
    expect(CF.readRecentMessages(w, CF.IDS.ben, CF.IDS.sunrise).ok).toBe(false);
    // Approve NEW membership row
    w = v(
      CF.approveSquadRejoin(w, {
        squadId: CF.IDS.sunrise,
        stomperId: CF.IDS.ben,
        joinedAt: "2026-06-01T00:00:00.000Z",
      }),
    );
    const actives = w.memberships.filter(
      (m) => m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.sunrise && m.state === "active",
    );
    expect(actives).toHaveLength(1);
    expect(actives[0]!.joinedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(actives[0]!.historyCutoffAt).toBe("2026-06-01T00:00:00.000Z");
    // Left row still present — not revived
    expect(
      w.memberships.some(
        (m) => m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.sunrise && m.state === "left",
      ),
    ).toBe(true);
  });

  it("AF-G14-07 rejoin does NOT auto-expose prior Campfire history; clocks unchanged", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "g14_07_old",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "before leave",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    w = v(
      CF.uploadMedia(w, {
        id: "g14_07m",
        ownerId: CF.IDS.ava,
        origin: "day_sesh",
        daySeshOfficialEndedAt: "2026-01-01T00:00:00.000Z",
        tripBoundIso: null,
      }),
    );
    const mediaExp = w.assets.get("g14_07m")!.expiresAt;
    w = v(CF.leaveSquad(w, CF.IDS.ben, CF.IDS.sunrise, "2026-02-01T00:00:00.000Z"));
    w = v(
      CF.approveSquadRejoin(w, {
        squadId: CF.IDS.sunrise,
        stomperId: CF.IDS.ben,
        joinedAt: "2026-06-01T00:00:00.000Z",
      }),
    );
    expect(CF.canViewerSeeMessage(w, CF.IDS.ben, "g14_07_old")).toBe(false);
    w = v(
      CF.postMessage(w, {
        id: "g14_07_new",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "after rejoin",
        createdAt: "2026-06-02T00:00:00.000Z",
      }),
    );
    expect(CF.canViewerSeeMessage(w, CF.IDS.ben, "g14_07_new")).toBe(true);
    // Rejoin does not reset historical media deletion clocks
    expect(w.assets.get("g14_07m")!.expiresAt).toBe(mediaExp);
    expect(CF.CAMPFIRE_POLICY.rejoinExposesHistory).toBe(false);
  });
});

describe("AF-G14 G3 Squad owner departure", () => {
  it("AF-G14-08 ownership transfer completes ONLY after nominee accepts", () => {
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
    expect(w.squads.get(CF.IDS.sunrise)!.ownerId).toBe(CF.IDS.ava);
    // Wrong acceptor denied
    expect(CF.acceptSquadOwnerTransfer(w, nom.transfer, CF.IDS.cal).ok).toBe(false);
    w = v(CF.acceptSquadOwnerTransfer(w, nom.transfer, CF.IDS.ben));
    expect(w.squads.get(CF.IDS.sunrise)!.ownerId).toBe(CF.IDS.ben);
    expect(w.squads.get(CF.IDS.sunrise)!.ownershipState).toBe("resolved");
    expect(
      w.memberships.find(
        (m) => m.stomperId === CF.IDS.ben && m.squadId === CF.IDS.sunrise && m.state === "active",
      )!.role,
    ).toBe("owner");
  });

  it("AF-G14-09 unresolved owner → no auto-elevate / no fallback owner-admin", () => {
    let w = CF.createWorld();
    w = v(
      CF.departSquadOwner(w, {
        squadId: CF.IDS.sunrise,
        ownerId: CF.IDS.ava,
        remainAsMember: false,
      }),
    );
    const squad = w.squads.get(CF.IDS.sunrise)!;
    expect(squad.ownershipState).toBe("unresolved");
    expect(CF.canElevateToOwner(squad).ok).toBe(false);
    expect(CF.CAMPFIRE_POLICY.autoPromoteOwner).toBe(false);
    // No auto-promote of oldest/most-active (Cal is admin — stays admin, not owner)
    expect(
      w.memberships.find(
        (m) => m.stomperId === CF.IDS.cal && m.squadId === CF.IDS.sunrise && m.state === "active",
      )!.role,
    ).toBe("admin");
    expect(
      w.memberships.every(
        (m) =>
          !(m.squadId === CF.IDS.sunrise && m.state === "active" && m.role === "owner"),
      ),
    ).toBe(true);
  });

  it("AF-G14-10 unresolved owner → members + reporting/blocking intact", () => {
    let w = CF.createWorld();
    w = v(
      CF.departSquadOwner(w, {
        squadId: CF.IDS.sunrise,
        ownerId: CF.IDS.ava,
        remainAsMember: false,
      }),
    );
    // Existing members still active (except departed owner)
    expect(
      w.memberships.filter((m) => m.squadId === CF.IDS.sunrise && m.state === "active").length,
    ).toBeGreaterThanOrEqual(3);
    // Campfire post still works for remaining member
    w = v(
      CF.postMessage(w, {
        id: "g14_10",
        authorId: CF.IDS.ben,
        squadId: CF.IDS.sunrise,
        body: "still here",
      }),
    );
    expect(w.messages.some((m) => m.id === "g14_10")).toBe(true);
    // Report / block paths intact
    w = CF.reportTarget(w, {
      id: "rpt_g14_10",
      reporterId: CF.IDS.ben,
      target: { kind: "message", id: "g14_10" },
      reason: "spam",
      evidenceRef: "g14_10" as CF.MessageId,
    });
    expect(w.reports.some((r) => r.id === "rpt_g14_10")).toBe(true);
    w = CF.blockUser(w, CF.IDS.ben, CF.IDS.dee);
    expect(w.blocks.some((b) => b.blockerId === CF.IDS.ben && b.blockedId === CF.IDS.dee)).toBe(
      true,
    );
  });
});

describe("AF-G14 G4 account deletion", () => {
  it("AF-G14-11 confirmed deletion → immediate logical revoke; new auth actions denied", () => {
    let w = CF.createWorld();
    w = CF.eraseStomper(w, CF.IDS.ben);
    expect(w.people.get(CF.IDS.ben)!.accountStatus).toBe("erased");
    expect(
      w.memberships
        .filter((m) => m.stomperId === CF.IDS.ben && m.state === "active")
        .length,
    ).toBe(0);
    const post = CF.postMessage(w, {
      id: "g14_11",
      authorId: CF.IDS.ben,
      squadId: CF.IDS.sunrise,
      body: "should fail",
    });
    expect(post.ok).toBe(false);
    const del = CF.ownerAccountDeletionAllowed(CF.IDS.ava);
    expect(del.allowed).toBe(true);
    expect(del.physicalWipeGuaranteed).toBe(false);
    expect(CF.assertNoDeletionJob().enabled).toBe(false);
  });

  it("AF-G14-12 deletion does NOT erase other members' content", () => {
    let w = CF.createWorld();
    w = v(
      CF.postMessage(w, {
        id: "g14_12a",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "ava keeps",
      }),
    );
    w = v(
      CF.postMessage(w, {
        id: "g14_12b",
        authorId: CF.IDS.ben,
        squadId: CF.IDS.sunrise,
        body: "ben goes",
      }),
    );
    w = CF.eraseStomper(w, CF.IDS.ben);
    expect(w.messages.find((m) => m.id === "g14_12a")!.body).toBe("ava keeps");
    expect(w.messages.find((m) => m.id === "g14_12a")!.state).toBe("live");
    expect(w.messages.find((m) => m.id === "g14_12b")!.state).toBe("erased");
    expect(w.messages.find((m) => m.id === "g14_12b")!.body).toBeNull();
  });
});

describe("AF-G14 retention + SV-0 regression locks", () => {
  it("AF-G14-13 Trip Drop + Campfire retention policies unchanged / green", () => {
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "g14_13_cf",
        ownerId: CF.IDS.ava,
        origin: "campfire",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const cfExp = w.assets.get("g14_13_cf")!.expiresAt!;
    expect(new Date(cfExp).getTime() - new Date("2026-01-01T00:00:00.000Z").getTime()).toBe(
      90 * 24 * 60 * 60 * 1000,
    );
    w = v(
      CF.uploadMedia(w, {
        id: "g14_13_td",
        ownerId: CF.IDS.ava,
        origin: "trip_drop",
      }),
    );
    const td = w.assets.get("g14_13_td")!;
    expect(td.flag).toBeUndefined();
    expect(td.origin).toBe("trip_drop");
    // Text retention still 12 months
    w = v(
      CF.postMessage(w, {
        id: "g14_13_txt",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "text",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const msg = w.messages.find((m) => m.id === "g14_13_txt")!;
    expect(CF.messageRenderState(msg, "2026-06-01T00:00:00.000Z")).toBe("live");
    expect(CF.messageRenderState(msg, "2027-02-01T00:00:00.000Z")).toBe("expired");
    expect(CF.CAMPFIRE_POLICY.textRetentionMonths).toBe(12);
    expect(CF.CAMPFIRE_POLICY.standaloneMediaDays).toBe(90);
    expect(CF.CAMPFIRE_POLICY.tripMediaMaxDays).toBe(45);
    expect(CF.CAMPFIRE_POLICY.resetOn).toBe("never");
  });

  it("AF-G14-14 SV-0 share confirm / authz recheck / Squad isolation no regression", () => {
    expect(CF.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(20_000);
    expect(Shared.RIDER_HUB_SHARE_MS).toBe(CF.SESH_PENDING_TTL_MS);
    // Single-Squad share prepare still required
    let w = CF.createWorld();
    w = v(
      CF.uploadMedia(w, {
        id: "g14_14",
        ownerId: CF.IDS.ava,
        origin: "campfire",
      }),
    );
    const multi = CF.beginQuickShare(w, {
      intentId: "si_g14_14m",
      actorId: CF.IDS.ava,
      mediaRefId: "g14_14",
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
    });
    expect(multi.ok).toBe(false);
    w = v(
      CF.beginQuickShare(w, {
        intentId: "si_g14_14",
        actorId: CF.IDS.ava,
        mediaRefId: "g14_14",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    expect(w.shareIntents.some((i) => i.id === "si_g14_14")).toBe(true);
    // Squad isolation: Powder member cannot read Sunrise-only without membership
    const iso = CF.readRecentMessages(w, CF.IDS.vik, CF.IDS.sunrise);
    expect(iso.ok).toBe(false);
    // Authz envelope still deny-by-default
    const deny = Shared.authorizeOwnStomper({
      actorId: "ava",
      accountOwnerId: "ben",
    });
    expect(deny.allow).toBe(false);
  });
});
