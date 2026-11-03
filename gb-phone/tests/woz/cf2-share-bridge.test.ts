/**
 * t1165u — CF-2 share bridge smoke (preview). DEMO ONLY ≠ server security.
 */
import { describe, expect, it } from "vitest";
import * as cf2Share from "@/lib/stomp/woz-bridge/cf2-share";

describe("woz-bridge cf2-share", () => {
  it("exposes SHARE_MS lock and single-squad assert", () => {
    expect(cf2Share.CF2_SHARE_MS).toBe(20_000);
    expect(cf2Share.SESH_PENDING_TTL_MS).toBe(20_000);
    expect(cf2Share.RIDER_HUB_SHARE_MS).toBe(20_000);
    const multi = cf2Share.assertSingleSquad(["a", "b"]);
    expect(multi.ok).toBe(false);
    const one = cf2Share.assertSingleSquad(["sunrise"]);
    expect(one.ok).toBe(true);
  });

  it("owns-stomper authz helper is deny-by-default across accounts", () => {
    expect(
      cf2Share.authorizeOwnStomper({ actorId: "a", accountOwnerId: "a" }).allow,
    ).toBe(true);
    expect(
      cf2Share.authorizeOwnStomper({ actorId: "a", accountOwnerId: "b" }).allow,
    ).toBe(false);
  });

  it("Rider Hub bridge table is present", () => {
    expect(cf2Share.RIDER_HUB_BRIDGE_TABLE.length).toBeGreaterThan(5);
    expect(cf2Share.adviceFor("confirm_share").batch1Surface).toBe("campfireCf2.sesh");
  });
});
