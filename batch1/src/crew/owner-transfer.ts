import { findMembership, listActiveMembers } from "../stompers/membership.js";
import type {
  CrewId,
  LocalCrewStoreSnapshot,
  StomperId,
} from "../stompers/types.js";

/**
 * Local-only owner transfer — required before an owner can Unlink while
 * other members remain active. Does not touch Grok Build Crew Invite.
 */

export type OwnerTransferPhase =
  | "idle"
  | "confirming"
  | "transferred"
  | "error";

export interface OwnerTransferState {
  phase: OwnerTransferPhase;
  crewId: CrewId | null;
  fromOwnerId: StomperId | null;
  toMemberId: StomperId | null;
  crewName: string | null;
  message: string | null;
  confirmRequired: string;
}

export const OWNER_TRANSFER_CONFIRM_PHRASE = "TRANSFER";

export function createOwnerTransferState(): OwnerTransferState {
  return {
    phase: "idle",
    crewId: null,
    fromOwnerId: null,
    toMemberId: null,
    crewName: null,
    message: null,
    confirmRequired: OWNER_TRANSFER_CONFIRM_PHRASE,
  };
}

export function listTransferCandidates(
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
  fromOwnerId: StomperId,
): StomperId[] {
  return listActiveMembers(snapshot, crewId)
    .filter((m) => m.stomperId !== fromOwnerId && m.role === "member")
    .map((m) => m.stomperId);
}

export function beginOwnerTransferConfirm(
  state: OwnerTransferState,
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
  fromOwnerId: StomperId,
  toMemberId: StomperId,
): OwnerTransferState {
  const crew = snapshot.crews.find((c) => c.id === crewId);
  const owner = findMembership(snapshot, crewId, fromOwnerId);
  const target = findMembership(snapshot, crewId, toMemberId);

  if (!crew || crew.ownerId !== fromOwnerId) {
    return {
      ...state,
      phase: "error",
      message: "Only the current crew owner can transfer ownership (local).",
      crewId,
      fromOwnerId,
      toMemberId,
      crewName: crew?.name ?? null,
    };
  }
  if (!owner || owner.status !== "active" || owner.role !== "owner") {
    return {
      ...state,
      phase: "error",
      message: "From-owner is not an active owner membership (local).",
      crewId,
      fromOwnerId,
      toMemberId,
      crewName: crew.name,
    };
  }
  if (!target || target.status !== "active" || target.role !== "member") {
    return {
      ...state,
      phase: "error",
      message: "Transfer target must be an active non-owner member (local).",
      crewId,
      fromOwnerId,
      toMemberId,
      crewName: crew.name,
    };
  }

  return {
    ...state,
    phase: "confirming",
    crewId,
    fromOwnerId,
    toMemberId,
    crewName: crew.name,
    message: `Confirm transfer of “${crew.name}” ownership. Local-only; type ${OWNER_TRANSFER_CONFIRM_PHRASE}.`,
  };
}

export function cancelOwnerTransfer(
  state: OwnerTransferState,
): OwnerTransferState {
  return createOwnerTransferState();
}

export interface OwnerTransferResult {
  state: OwnerTransferState;
  snapshot: LocalCrewStoreSnapshot;
}

/**
 * Apply local ownership transfer after confirmation.
 * Updates crew.ownerId and membership roles. Does not unlink anyone.
 */
export function confirmOwnerTransfer(
  state: OwnerTransferState,
  snapshot: LocalCrewStoreSnapshot,
  typedConfirm: string,
): OwnerTransferResult {
  if (
    state.phase !== "confirming" ||
    !state.crewId ||
    !state.fromOwnerId ||
    !state.toMemberId
  ) {
    return {
      state: {
        ...state,
        phase: "error",
        message: "Owner transfer not in confirming phase.",
      },
      snapshot,
    };
  }
  if (typedConfirm.trim() !== state.confirmRequired) {
    return {
      state: {
        ...state,
        phase: "confirming",
        message: `Type ${state.confirmRequired} exactly to confirm.`,
      },
      snapshot,
    };
  }

  const crewId = state.crewId;
  const fromOwnerId = state.fromOwnerId;
  const toMemberId = state.toMemberId;

  const crews = snapshot.crews.map((c) =>
    c.id === crewId ? { ...c, ownerId: toMemberId } : c,
  );
  const memberships = snapshot.memberships.map((m) => {
    if (m.crewId !== crewId) return m;
    if (m.stomperId === fromOwnerId) {
      return { ...m, role: "member" as const };
    }
    if (m.stomperId === toMemberId) {
      return { ...m, role: "owner" as const };
    }
    return m;
  });

  return {
    snapshot: { ...snapshot, crews, memberships },
    state: {
      ...state,
      phase: "transferred",
      message: `Ownership of “${state.crewName}” transferred locally. Former owner may now Unlink.`,
    },
  };
}
