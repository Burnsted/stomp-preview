import { findMembership, setMembershipStatus } from "../stompers/membership.js";
import type {
  CrewId,
  LocalCrewStoreSnapshot,
  StomperId,
} from "../stompers/types.js";

export type UnlinkPhase =
  | "idle"
  | "confirming"
  | "unlinked"
  | "relink_ready"
  | "error";

export interface UnlinkState {
  phase: UnlinkPhase;
  crewId: CrewId | null;
  stomperId: StomperId | null;
  crewName: string | null;
  message: string | null;
  /** Confirmation token must match typed confirm string. */
  confirmRequired: string;
}

export const UNLINK_CONFIRM_PHRASE = "UNLINK";

export function createUnlinkState(): UnlinkState {
  return {
    phase: "idle",
    crewId: null,
    stomperId: null,
    crewName: null,
    message: null,
    confirmRequired: UNLINK_CONFIRM_PHRASE,
  };
}

export function beginUnlinkConfirm(
  state: UnlinkState,
  snapshot: LocalCrewStoreSnapshot,
  crewId: CrewId,
  stomperId: StomperId,
): UnlinkState {
  const crew = snapshot.crews.find((c) => c.id === crewId);
  const membership = findMembership(snapshot, crewId, stomperId);
  if (!crew || !membership || membership.status !== "active") {
    return {
      ...state,
      phase: "error",
      message: "Cannot unlink: not an active member of this crew (local store).",
      crewId,
      stomperId,
      crewName: crew?.name ?? null,
    };
  }
  if (membership.role === "owner" || crew.ownerId === stomperId) {
    const activeOthers = snapshot.memberships.filter(
      (m) =>
        m.crewId === crewId &&
        m.status === "active" &&
        m.stomperId !== stomperId,
    );
    if (activeOthers.length > 0) {
      return {
        ...state,
        phase: "error",
        message:
          "Owner unlink blocked while other members are active (local rule). Transfer ownership first (see owner-transfer).",
        crewId,
        stomperId,
        crewName: crew.name,
      };
    }
  }
  return {
    ...state,
    phase: "confirming",
    crewId,
    stomperId,
    crewName: crew.name,
    message: `Confirm unlink from “${crew.name}”. Local-only; no cloud.`,
  };
}

export function cancelUnlink(state: UnlinkState): UnlinkState {
  return createUnlinkState();
}

export interface UnlinkResult {
  state: UnlinkState;
  snapshot: LocalCrewStoreSnapshot;
}

/**
 * Local-only Crew Unlink after confirmation.
 * Removes active membership → status "left". Does not delete historical rows.
 * Does not touch Grok Build Crew Invite.
 */
export function confirmUnlink(
  state: UnlinkState,
  snapshot: LocalCrewStoreSnapshot,
  typedConfirm: string,
  atIso: string = new Date().toISOString(),
): UnlinkResult {
  if (state.phase !== "confirming" || !state.crewId || !state.stomperId) {
    return {
      state: {
        ...state,
        phase: "error",
        message: "Unlink not in confirming phase.",
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

  const next = setMembershipStatus(
    snapshot,
    state.crewId,
    state.stomperId,
    "left",
    atIso,
  );

  return {
    snapshot: next,
    state: {
      ...state,
      phase: "unlinked",
      message: `Unlinked from “${state.crewName}” (local store only). You can relink locally.`,
    },
  };
}

/**
 * Relink path: restore local membership to active without cloud Invite.
 * When GB Invite arrives, real invites should go through greet.tsx — this is
 * a local fixture/dev path only.
 */
export function relinkLocally(
  state: UnlinkState,
  snapshot: LocalCrewStoreSnapshot,
  atIso: string = new Date().toISOString(),
): UnlinkResult {
  if (!state.crewId || !state.stomperId) {
    return {
      state: {
        ...state,
        phase: "error",
        message: "No crew/stomper context for relink.",
      },
      snapshot,
    };
  }
  const membership = findMembership(snapshot, state.crewId, state.stomperId);
  if (!membership || membership.status === "active") {
    return {
      state: {
        ...state,
        phase: "error",
        message: "Relink requires a previously left/removed local membership.",
      },
      snapshot,
    };
  }

  const next = setMembershipStatus(
    snapshot,
    state.crewId,
    state.stomperId,
    "active",
    atIso,
  );

  return {
    snapshot: next,
    state: {
      ...state,
      phase: "relink_ready",
      message: `Relinked to “${state.crewName}” locally. GB Crew Invite still required for real invites.`,
    },
  };
}
