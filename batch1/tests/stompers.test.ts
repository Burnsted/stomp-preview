import { describe, expect, it } from "vitest";
import { createFixtureSnapshot } from "../src/stompers/fixtures.js";
import {
  findMembership,
  listActiveMembers,
  setMembershipStatus,
} from "../src/stompers/membership.js";
import type { StomperId } from "../src/stompers/types.js";

describe("STOMPERS foundation", () => {
  it("loads fictional profiles, private crew, and memberships", () => {
    const snap = createFixtureSnapshot();
    expect(snap.profiles).toHaveLength(3);
    expect(snap.crews[0].privacy).toBe("private");
    expect(snap.memberships.every((m) => m.status === "active")).toBe(true);
    expect(snap.invitations[0].status).toBe("pending");
  });

  it("lists active members and finds membership", () => {
    const snap = createFixtureSnapshot();
    const crewId = snap.crews[0].id;
    expect(listActiveMembers(snap, crewId)).toHaveLength(3);
    const m = findMembership(snap, crewId, "stomper_nes" as StomperId);
    expect(m?.role).toBe("member");
  });

  it("updates membership locally without cloud side effects", () => {
    const snap = createFixtureSnapshot();
    const crewId = snap.crews[0].id;
    const id = "stomper_nes" as StomperId;
    const next = setMembershipStatus(
      snap,
      crewId,
      id,
      "left",
      "2026-10-29T12:00:00.000Z",
    );
    expect(listActiveMembers(next, crewId)).toHaveLength(2);
    expect(findMembership(next, crewId, id)?.leftAtIso).toBe(
      "2026-10-29T12:00:00.000Z",
    );
    // Original snapshot untouched
    expect(listActiveMembers(snap, crewId)).toHaveLength(3);
  });

  it("invitation records are interface/fixture only (no invite UI)", () => {
    const snap = createFixtureSnapshot();
    expect(snap.invitations[0]).toMatchObject({
      toDisplayLabel: "Ski Buddy (fictional)",
      status: "pending",
    });
  });
});
