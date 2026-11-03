/**
 * AF-CF3 phone bridge smoke — adapter wired through woz-bridge (t1190u).
 * Full AF-CF3 matrix lives in batch1/tests/af-cf3-client-shell.test.ts.
 */
import { describe, expect, it } from "vitest";
import * as cf3 from "@/lib/stomp/woz-bridge/cf3-client";
import { postMessage } from "@woz/campfire/world.js";

describe("AF-CF3 gb-phone bridge", () => {
  it("AF-CF3-P01 exports client + contract status", () => {
    expect(cf3.CF3_CLIENT_STATUS).toBe("PREVIEW_WIRED");
    expect(cf3.CF3_CLIENT_SHELL_STATUS).toBe("PREVIEW_WIRED");
    expect(cf3.GROK_BUILD_CAMPFIRE_BRIDGE_STATUS).toBe("HELD");
    expect(cf3.YOUTH_CAMPFIRE_ENABLED).toBe(false);
    expect(cf3.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(cf3.GB_CAMPFIRE_CONTRACT_METHODS).toContain("listMyCampfires");
  });

  it("AF-CF3-P02 list → thread → tombstone → block reveal via adapter", () => {
    const client = cf3.createCampfireClient(cf3.CF3_IDS.ava);
    expect(client.listMyCampfires().length).toBe(2);

    expect(client.postMessage({ id: "p_live", squadId: cf3.CF3_IDS.sunrise, body: "hi" }).ok).toBe(true);
    expect(client.deleteOwnMessage("p_live").ok).toBe(true);
    const page = client.readCampfire(cf3.CF3_IDS.cfSunrise);
    expect(page.ok).toBe(true);
    if (!page.ok) return;
    const tomb = page.value.items.find((r) => r.message.id === "p_live")!;
    expect(tomb.tombstoneKind).toBe("author_removed");

    // block collapse
    const posted = postMessage(client.world, {
      id: "p_ben",
      authorId: cf3.CF3_IDS.ben,
      squadId: cf3.CF3_IDS.sunrise,
      body: "ben",
    });
    if (posted.ok) client.world = posted.value;
    client.block(cf3.CF3_IDS.ben);
    expect(client.renderForViewer("p_ben")).toBe("collapsed_for_blocker");
    client.revealCollapsed("p_ben");
    expect(client.renderForViewer("p_ben")).toBe("revealed_by_blocker");
  });

  it("AF-CF3-P03 leave / rejoin / unresolved-owner / share / youth", () => {
    const ben = cf3.createCampfireClient(cf3.CF3_IDS.ben);
    expect(ben.leaveSquad(cf3.CF3_IDS.sunrise).ok).toBe(true);
    expect(ben.readCampfire(cf3.CF3_IDS.cfSunrise).ok).toBe(false);
    expect(ben.approveRejoin(cf3.CF3_IDS.sunrise, "2026-07-01T00:00:00.000Z").ok).toBe(true);

    const dee = cf3.createCampfireClient(cf3.CF3_IDS.dee);
    expect(dee.departOwnerUnresolved(cf3.CF3_IDS.powder).ok).toBe(true);
    expect(dee.ownershipBanner(cf3.CF3_IDS.powder)).toMatch(/unresolved/i);

    const ava = cf3.createCampfireClient(cf3.CF3_IDS.ava);
    expect(ava.seedMedia("m1").ok).toBe(true);
    expect(
      ava.prepareShare({
        intentId: "s1",
        mediaRefId: "m1",
        squadIds: [cf3.CF3_IDS.sunrise, cf3.CF3_IDS.powder],
      }).ok,
    ).toBe(false);
    expect(
      ava.prepareShare({
        intentId: "s2",
        mediaRefId: "m1",
        squadIds: [cf3.CF3_IDS.sunrise],
      }).ok,
    ).toBe(true);
    expect(ava.cancelShare("s2").ok).toBe(true);

    const gia = cf3.createCampfireClient(cf3.CF3_IDS.gia);
    expect(gia.snapshot().youthDisabled).toBe(true);
    expect(gia.listMyCampfires()).toEqual([]);

    const closed = ava.closeDaySesh();
    expect(closed.campfireEffects).toEqual([]);
  });
});
