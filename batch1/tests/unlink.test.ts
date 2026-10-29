import { describe, expect, it } from "vitest";
import { createFixtureSnapshot } from "../src/stompers/fixtures.js";
import { isActiveMember, listActiveMembers } from "../src/stompers/membership.js";
import {
  beginUnlinkConfirm,
  cancelUnlink,
  confirmUnlink,
  createUnlinkState,
  relinkLocally,
  UNLINK_CONFIRM_PHRASE,
} from "../src/crew/unlink.js";
import {
  CREW_INVITE_STATUS,
  crewInviteMergeReminder,
} from "../src/crew/invite-stub.js";
import type { StomperId } from "../src/stompers/types.js";

describe("Crew Unlink (local-only)", () => {
  it("starts in idle and opens confirmation for an active member", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const jax = "stomper_jax" as StomperId;
    let state = createUnlinkState();
    state = beginUnlinkConfirm(state, snapshot, crewId, jax);
    expect(state.phase).toBe("confirming");
    expect(state.crewName).toBe("Demo Ridge Crew");
  });

  it("rejects wrong confirmation phrase without mutating membership", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const jax = "stomper_jax" as StomperId;
    let state = beginUnlinkConfirm(createUnlinkState(), snapshot, crewId, jax);
    const result = confirmUnlink(state, snapshot, "nope");
    expect(result.state.phase).toBe("confirming");
    expect(isActiveMember(result.snapshot, crewId, jax)).toBe(true);
    expect(listActiveMembers(result.snapshot, crewId)).toHaveLength(3);
  });

  it("unlinks locally after exact confirmation and preserves history row", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const jax = "stomper_jax" as StomperId;
    let state = beginUnlinkConfirm(createUnlinkState(), snapshot, crewId, jax);
    const at = "2026-10-29T22:00:00.000Z";
    const result = confirmUnlink(state, snapshot, UNLINK_CONFIRM_PHRASE, at);
    expect(result.state.phase).toBe("unlinked");
    expect(isActiveMember(result.snapshot, crewId, jax)).toBe(false);
    const row = result.snapshot.memberships.find(
      (m) => m.stomperId === jax && m.crewId === crewId,
    );
    expect(row?.status).toBe("left");
    expect(row?.leftAtIso).toBe(at);
    expect(listActiveMembers(result.snapshot, crewId)).toHaveLength(2);
  });

  it("cancels confirmation without changes", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const nes = "stomper_nes" as StomperId;
    let state = beginUnlinkConfirm(createUnlinkState(), snapshot, crewId, nes);
    state = cancelUnlink(state);
    expect(state.phase).toBe("idle");
    expect(isActiveMember(snapshot, crewId, nes)).toBe(true);
  });

  it("blocks owner unlink while other members are active", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const state = beginUnlinkConfirm(createUnlinkState(), snapshot, crewId, ria);
    expect(state.phase).toBe("error");
    expect(state.message).toMatch(/Owner unlink blocked/i);
  });

  it("supports local relink path after unlink", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const jax = "stomper_jax" as StomperId;
    let state = beginUnlinkConfirm(createUnlinkState(), snapshot, crewId, jax);
    let result = confirmUnlink(state, snapshot, UNLINK_CONFIRM_PHRASE);
    result = relinkLocally(result.state, result.snapshot, "2026-10-29T23:00:00.000Z");
    expect(result.state.phase).toBe("relink_ready");
    expect(isActiveMember(result.snapshot, crewId, jax)).toBe(true);
  });

  it("documents that Crew Invite is GB-owned and absent from this tip", () => {
    expect(CREW_INVITE_STATUS.presentInThisTip).toBe(false);
    expect(CREW_INVITE_STATUS.owner).toBe("Grok Build");
    expect(crewInviteMergeReminder()).toMatch(/greet\.tsx/);
  });
});
