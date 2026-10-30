import { describe, expect, it } from "vitest";
import { createFixtureSnapshot } from "../src/stompers/fixtures.js";
import {
  findMembership,
  isActiveMember,
  listActiveMembers,
} from "../src/stompers/membership.js";
import {
  beginOwnerTransferConfirm,
  cancelOwnerTransfer,
  confirmOwnerTransfer,
  createOwnerTransferState,
  listTransferCandidates,
  OWNER_TRANSFER_CONFIRM_PHRASE,
} from "../src/crew/owner-transfer.js";
import {
  beginUnlinkConfirm,
  confirmUnlink,
  createUnlinkState,
  UNLINK_CONFIRM_PHRASE,
} from "../src/crew/unlink.js";
import type { StomperId } from "../src/stompers/types.js";

describe("Crew owner transfer (local-only)", () => {
  it("lists active non-owner members as transfer candidates", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const candidates = listTransferCandidates(snapshot, crewId, ria);
    expect(candidates).toEqual(
      expect.arrayContaining([
        "stomper_jax",
        "stomper_nes",
      ]),
    );
    expect(candidates).toHaveLength(2);
  });

  it("requires confirmation phrase and does not mutate on wrong input", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const jax = "stomper_jax" as StomperId;
    let state = beginOwnerTransferConfirm(
      createOwnerTransferState(),
      snapshot,
      crewId,
      ria,
      jax,
    );
    expect(state.phase).toBe("confirming");
    const result = confirmOwnerTransfer(state, snapshot, "nope");
    expect(result.state.phase).toBe("confirming");
    expect(result.snapshot.crews[0].ownerId).toBe(ria);
    expect(findMembership(result.snapshot, crewId, ria)?.role).toBe("owner");
  });

  it("transfers ownership locally after exact confirmation", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const jax = "stomper_jax" as StomperId;
    const state = beginOwnerTransferConfirm(
      createOwnerTransferState(),
      snapshot,
      crewId,
      ria,
      jax,
    );
    const result = confirmOwnerTransfer(
      state,
      snapshot,
      OWNER_TRANSFER_CONFIRM_PHRASE,
    );
    expect(result.state.phase).toBe("transferred");
    expect(result.snapshot.crews[0].ownerId).toBe(jax);
    expect(findMembership(result.snapshot, crewId, jax)?.role).toBe("owner");
    expect(findMembership(result.snapshot, crewId, ria)?.role).toBe("member");
    expect(listActiveMembers(result.snapshot, crewId)).toHaveLength(3);
  });

  it("cancels transfer without changes", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const nes = "stomper_nes" as StomperId;
    let state = beginOwnerTransferConfirm(
      createOwnerTransferState(),
      snapshot,
      crewId,
      ria,
      nes,
    );
    state = cancelOwnerTransfer(state);
    expect(state.phase).toBe("idle");
    expect(snapshot.crews[0].ownerId).toBe(ria);
  });

  it("rejects transfer to a non-member target", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const ghost = "stomper_ghost" as StomperId;
    const state = beginOwnerTransferConfirm(
      createOwnerTransferState(),
      snapshot,
      crewId,
      ria,
      ghost,
    );
    expect(state.phase).toBe("error");
  });

  it("allows former owner to unlink after transfer", () => {
    const snapshot = createFixtureSnapshot();
    const crewId = snapshot.crews[0].id;
    const ria = "stomper_ria" as StomperId;
    const jax = "stomper_jax" as StomperId;

    const blocked = beginUnlinkConfirm(
      createUnlinkState(),
      snapshot,
      crewId,
      ria,
    );
    expect(blocked.phase).toBe("error");

    const xfer = confirmOwnerTransfer(
      beginOwnerTransferConfirm(
        createOwnerTransferState(),
        snapshot,
        crewId,
        ria,
        jax,
      ),
      snapshot,
      OWNER_TRANSFER_CONFIRM_PHRASE,
    );

    const unlinkState = beginUnlinkConfirm(
      createUnlinkState(),
      xfer.snapshot,
      crewId,
      ria,
    );
    expect(unlinkState.phase).toBe("confirming");
    const unlinked = confirmUnlink(
      unlinkState,
      xfer.snapshot,
      UNLINK_CONFIRM_PHRASE,
    );
    expect(unlinked.state.phase).toBe("unlinked");
    expect(isActiveMember(unlinked.snapshot, crewId, ria)).toBe(false);
    expect(unlinked.snapshot.crews[0].ownerId).toBe(jax);
    expect(isActiveMember(unlinked.snapshot, crewId, jax)).toBe(true);
  });
});
