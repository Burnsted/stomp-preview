/**
 * AF-CF3-* — Campfire CF-3 client adapter acceptance (t1190u).
 * Fictional-data only against CampfireClient. AF-G14 regressions stay separate.
 */
import { describe, expect, it } from "vitest";
import * as CF from "../src/campfire/cf2-index.js";

const v = <T, E extends string>(r: { ok: boolean; value?: T; error?: E }): T => {
  if (!r.ok) throw new Error(String((r as { error?: E }).error));
  return (r as { value: T }).value;
};

describe("AF-CF3 client adapter — list / thread / tombstone", () => {
  it("AF-CF3-01 listMyCampfires — one Campfire per active Squad; no cross-Squad leak", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    const list = client.listMyCampfires();
    expect(list).toHaveLength(2);
    expect(list.map((c) => c.squadName).sort()).toEqual(["Powder Pals", "Sunrise"]);
    expect(new Set(list.map((c) => c.campfireId)).size).toBe(2);

    const cal = CF.createCampfireClient(CF.IDS.cal);
    const calList = cal.listMyCampfires();
    expect(calList.some((c) => c.squadId === CF.IDS.powder)).toBe(false);
    expect(calList.some((c) => c.squadId === CF.IDS.frost)).toBe(true);
  });

  it("AF-CF3-02 soft cap notice at 20", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    client.world = CF.seedMembersToSoftCap(client.world, CF.IDS.sunrise, 20);
    const row = client.listMyCampfires().find((c) => c.squadId === CF.IDS.sunrise)!;
    expect(row.memberCount).toBeGreaterThanOrEqual(20);
    expect(row.softCapNotice).toBe(true);
  });

  it("AF-CF3-03 readCampfire thread — live + tombstone states", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    v(client.postMessage({ id: "cf3_live", squadId: CF.IDS.sunrise, body: "hello sunrise" }));
    v(client.postMessage({ id: "cf3_del", squadId: CF.IDS.sunrise, body: "bye" }));
    v(client.deleteOwnMessage("cf3_del"));

    // expired via past expiresAt (keep createdAt after membership joinedAt so G2 cutoff still shows it)
    client.world = v(
      CF.postMessage(client.world, {
        id: "cf3_exp",
        authorId: CF.IDS.ben,
        squadId: CF.IDS.sunrise,
        body: "old",
      }),
    );
    client.world = {
      ...client.world,
      messages: client.world.messages.map((m) =>
        m.id === "cf3_exp" ? { ...m, expiresAt: "2020-01-01T00:00:00.000Z" } : m,
      ),
    };

    const page = v(client.readCampfire(CF.IDS.cfSunrise));
    const byId = Object.fromEntries(page.items.map((r) => [r.message.id, r]));
    expect(byId.cf3_live.render).toBe("visible");
    expect(byId.cf3_live.body).toBe("hello sunrise");
    expect(byId.cf3_del.tombstoneKind).toBe("author_removed");
    expect(byId.cf3_del.body).toBe(CF.AUTHOR_REMOVED_TOMBSTONE);
    expect(byId.cf3_exp.tombstoneKind).toBe("expired");
  });

  it("AF-CF3-04 erased author → Former STOMPER (G4 logical)", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    v(client.postMessage({ id: "cf3_er", squadId: CF.IDS.sunrise, body: "will erase" }));
    client.world = CF.eraseStomper(client.world, CF.IDS.ava);
    const other = CF.createCampfireClient(CF.IDS.ben);
    other.world = client.world;
    const page = v(other.readCampfire(CF.IDS.cfSunrise));
    const row = page.items.find((r) => r.message.id === "cf3_er")!;
    expect(row.tombstoneKind).toBe("erased");
    expect(row.authorLabel).toBe(CF.FORMER_STOMPER_LABEL);
  });
});

describe("AF-CF3 compose / delete / membership deny", () => {
  it("AF-CF3-05 compose + author-delete → tombstone; non-member denied", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    expect(client.postMessage({ id: "cf3_p1", squadId: CF.IDS.sunrise, body: "post" }).ok).toBe(true);
    v(client.deleteOwnMessage("cf3_p1"));
    const page = v(client.readCampfire(CF.IDS.cfSunrise));
    expect(page.items.find((r) => r.message.id === "cf3_p1")!.tombstoneKind).toBe("author_removed");

    const vik = CF.createCampfireClient(CF.IDS.vik);
    vik.world = client.world;
    expect(vik.postMessage({ id: "x", squadId: CF.IDS.sunrise, body: "nope" }).ok).toBe(false);
    expect(vik.readCampfire(CF.IDS.cfSunrise).ok).toBe(false);
  });

  it("AF-CF3-06 non-author cannot delete", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    v(client.postMessage({ id: "cf3_own", squadId: CF.IDS.sunrise, body: "mine" }));
    const ben = CF.createCampfireClient(CF.IDS.ben);
    ben.world = client.world;
    expect(ben.deleteOwnMessage("cf3_own").ok).toBe(false);
    expect(ben.lastDeny).toBe("not_author");
  });
});

describe("AF-CF3 block collapse + reveal", () => {
  it("AF-CF3-07 blocker-only collapse + explicit reveal; others unchanged", () => {
    const ava = CF.createCampfireClient(CF.IDS.ava);
    ava.world = v(
      CF.postMessage(ava.world, {
        id: "cf3_blk",
        authorId: CF.IDS.ben,
        squadId: CF.IDS.sunrise,
        body: "ben says hi",
      }),
    );
    ava.block(CF.IDS.ben);
    expect(ava.renderForViewer("cf3_blk")).toBe("collapsed_for_blocker");
    const collapsed = v(ava.readCampfire(CF.IDS.cfSunrise)).items.find((r) => r.message.id === "cf3_blk")!;
    expect(collapsed.canReveal).toBe(true);
    expect(collapsed.body).toBeNull();

    ava.revealCollapsed("cf3_blk");
    expect(ava.renderForViewer("cf3_blk")).toBe("revealed_by_blocker");

    const cal = CF.createCampfireClient(CF.IDS.cal);
    cal.world = ava.world;
    expect(cal.renderForViewer("cf3_blk")).toBe("visible");
    const calRow = v(cal.readCampfire(CF.IDS.cfSunrise)).items.find((r) => r.message.id === "cf3_blk")!;
    expect(calRow.body).toBe("ben says hi");

    // no notify to blocked
    expect(ava.world.notifications.every((n) => n.recipientId !== CF.IDS.ben || n.suppressed)).toBe(true);
  });
});

describe("AF-CF3 Quick Share confirm sheet", () => {
  it("AF-CF3-08 one Squad + confirm posts; cancel/discard does not; multi deny", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    v(client.seedMedia("cf3_med"));
    const multi = client.prepareShare({
      intentId: "si_multi",
      mediaRefId: "cf3_med",
      squadIds: [CF.IDS.sunrise, CF.IDS.powder],
    });
    expect(multi.ok).toBe(false);
    if (!multi.ok) expect(multi.error).toBe("multi_recipient");

    const draft = v(
      client.prepareShare({
        intentId: "si_ok",
        mediaRefId: "cf3_med",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    expect(draft.state).toBe("previewing");
    expect(draft.squadName).toBe("Sunrise");
    expect(client.world.links).toHaveLength(0);

    v(client.cancelShare("si_ok"));
    expect(client.world.links).toHaveLength(0);

    const draft2 = v(
      client.prepareShare({
        intentId: "si_ok2",
        mediaRefId: "cf3_med",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    expect(draft2.intentId).toBe("si_ok2");
    v(client.confirmShare("si_ok2", "link_cf3"));
    expect(client.world.links.some((l) => l.id === "link_cf3")).toBe(true);

    // discard path
    v(client.seedMedia("cf3_med2"));
    v(
      client.prepareShare({
        intentId: "si_bg",
        mediaRefId: "cf3_med2",
        squadIds: [CF.IDS.sunrise],
      }),
    );
    const before = client.world.links.length;
    v(client.discardShare("si_bg"));
    expect(client.world.links.length).toBe(before);
  });
});

describe("AF-CF3 leave / rejoin (G2)", () => {
  it("AF-CF3-09 leave ends access; rejoin needs approval; historyCutoff prospective-only", () => {
    const ben = CF.createCampfireClient(CF.IDS.ben);
    ben.world = v(
      CF.postMessage(ben.world, {
        id: "cf3_old",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "before",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    v(ben.leaveSquad(CF.IDS.sunrise));
    expect(ben.readCampfire(CF.IDS.cfSunrise).ok).toBe(false);

    // no auto reentry
    expect(ben.listMyCampfires().some((c) => c.squadId === CF.IDS.sunrise)).toBe(false);

    v(ben.approveRejoin(CF.IDS.sunrise, "2026-06-01T00:00:00.000Z"));
    expect(ben.listMyCampfires().some((c) => c.squadId === CF.IDS.sunrise)).toBe(true);
    expect(CF.canViewerSeeMessage(ben.world, CF.IDS.ben, "cf3_old")).toBe(false);

    ben.world = v(
      CF.postMessage(ben.world, {
        id: "cf3_new",
        authorId: CF.IDS.ava,
        squadId: CF.IDS.sunrise,
        body: "after",
        createdAt: "2026-06-02T00:00:00.000Z",
      }),
    );
    const page = v(ben.readCampfire(CF.IDS.cfSunrise));
    expect(page.items.some((r) => r.message.id === "cf3_old")).toBe(false);
    expect(page.items.some((r) => r.message.id === "cf3_new")).toBe(true);
  });
});

describe("AF-CF3 unresolved owner (G3)", () => {
  it("AF-CF3-10 nominate+accept only; unresolved banner; members still read/post", () => {
    const ava = CF.createCampfireClient(CF.IDS.ava);
    v(ava.nominateOwner(CF.IDS.sunrise, CF.IDS.cal));
    expect(ava.world.squads.get(CF.IDS.sunrise)!.ownershipState).toBe("pending_transfer");
    expect(ava.ownershipBanner(CF.IDS.sunrise)).toMatch(/pending/i);

    // accept as Cal
    const cal = CF.createCampfireClient(CF.IDS.cal);
    cal.world = ava.world;
    cal.pendingTransfer = ava.pendingTransfer;
    v(cal.acceptOwnerTransfer(CF.IDS.cal));
    expect(cal.world.squads.get(CF.IDS.sunrise)!.ownerId).toBe(CF.IDS.cal);
    expect(cal.world.squads.get(CF.IDS.sunrise)!.ownershipState).toBe("resolved");

    // unresolved path
    const dee = CF.createCampfireClient(CF.IDS.dee);
    v(dee.departOwnerUnresolved(CF.IDS.powder));
    expect(dee.world.squads.get(CF.IDS.powder)!.ownershipState).toBe("unresolved");
    expect(dee.ownershipBanner(CF.IDS.powder)).toMatch(/unresolved/i);

    const ava2 = CF.createCampfireClient(CF.IDS.ava);
    ava2.world = dee.world;
    expect(ava2.listMyCampfires().some((c) => c.squadId === CF.IDS.powder)).toBe(true);
    v(ava2.postMessage({ id: "cf3_uo", squadId: CF.IDS.powder, body: "still posting" }));
    expect(v(ava2.readCampfire(CF.IDS.cfPowder)).items.some((r) => r.message.id === "cf3_uo")).toBe(true);
  });
});

describe("AF-CF3 Day Sesh + youth", () => {
  it("AF-CF3-11 Day Sesh close → campfireEffects:[]", () => {
    const client = CF.createCampfireClient(CF.IDS.ava);
    const closed = client.closeDaySesh();
    expect(closed.campfireEffects).toEqual([]);
    expect(closed.untouched).toBe(true);
  });

  it("AF-CF3-12 youth Campfire DISABLED (negative path)", () => {
    expect(CF.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    const gia = CF.createCampfireClient(CF.IDS.gia);
    expect(gia.snapshot().youthDisabled).toBe(true);
    expect(gia.listMyCampfires()).toEqual([]);
    expect(gia.readCampfire(CF.IDS.cfSunrise).ok).toBe(false);
    expect(gia.postMessage({ id: "y", squadId: CF.IDS.sunrise, body: "no" }).ok).toBe(false);
  });
});

describe("AF-CF3 contract surface", () => {
  it("AF-CF3-13 adapter exposes GB contract methods; CF3 preview status", () => {
    const snap = CF.createCampfireClient().snapshot();
    expect(snap.bridgeStatus).toBe("PREVIEW_WIRED");
    expect(snap.contractMethods).toContain("listMyCampfires");
    expect(snap.contractMethods).toContain("prepareShare");
    expect(snap.contractMethods).toContain("revealCollapsed");
    expect(CF.CF3_CLIENT_SHELL_STATUS).toBe("PREVIEW_WIRED");
    expect(CF.GROK_BUILD_CAMPFIRE_BRIDGE_STATUS).toBe("HELD");
  });
});
