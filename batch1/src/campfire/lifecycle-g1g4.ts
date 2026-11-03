/**
 * G1–G4 LOCKED product policies (t1166u) — fictional-data only.
 * Ted owner-approved Nov 2, 2026. NOT authorization for production deletion jobs
 * or real-user data changes. Client demo ≠ server authority.
 */
import { err, ok, type Result } from "../core/result.js";
import { addUtcDays } from "./trip-shim.js";
import {
  DAY_SESH_MEDIA_MAX_DAYS,
  FORMER_STOMPER_LABEL,
} from "./policy.js";
import type {
  Campfire,
  DenyReason,
  MediaAsset,
  Membership,
  Message,
  Squad,
  Stomper,
  StomperId,
} from "./cf2-types.js";
import { isActiveMember, canAccessCampfire } from "./guards.js";
import { isPast } from "./retention.js";

/** G1 — max retention after official Day Sesh end (maximum, not guaranteed access). */
export function daySeshMediaExpiresAt(officialEndedAt: string): string {
  return addUtcDays(officialEndedAt, DAY_SESH_MEDIA_MAX_DAYS);
}

export function daySeshMediaDeadlineLocked(officialEndedAt: string | null | undefined): {
  kind: "session_policy";
  deadlineAt: string | null;
  flag: "day_sesh_45d_max";
  maxDays: typeof DAY_SESH_MEDIA_MAX_DAYS;
} {
  return {
    kind: "session_policy",
    deadlineAt: officialEndedAt ? daySeshMediaExpiresAt(officialEndedAt) : null,
    flag: "day_sesh_45d_max",
    maxDays: DAY_SESH_MEDIA_MAX_DAYS,
  };
}

/**
 * G1 — linking/sharing Day Sesh media into Campfire MUST NEVER rewrite expiresAt.
 * Returns a copy of the asset unchanged (assert helper for tests/callers).
 */
export function assertShareDoesNotExtendMediaClock(
  before: MediaAsset,
  after: MediaAsset,
): boolean {
  return before.expiresAt === after.expiresAt && before.uploadedAt === after.uploadedAt;
}

/** Recheck media access: membership + not past expiresAt + account active. */
export function authorizeMediaAccess(args: {
  stomper: Stomper;
  campfireSquadId: string;
  memberships: readonly Membership[];
  asset: MediaAsset;
  nowIso: string;
  campfire: Campfire;
}): Result<true, DenyReason> {
  if (args.stomper.accountStatus === "erased") return err("account_erased");
  const access = canAccessCampfire({
    stomper: args.stomper,
    campfire: args.campfire,
    memberships: args.memberships,
  });
  if (!access.ok) return access;
  if (args.asset.expiresAt && isPast(args.nowIso, args.asset.expiresAt)) {
    return err("expired", "Media past retention maximum");
  }
  if (args.asset.localUri == null && args.asset.origin === "campfire") {
    return err("not_found", "Media not served");
  }
  return ok(true);
}

/**
 * G2 — active membership for read: only messages at/after historyCutoffAt
 * (defaults to joinedAt). Prior history is NOT automatically exposed after rejoin.
 */
export function messageVisibleToMembership(
  msg: Message,
  membership: Membership | undefined,
): boolean {
  if (!membership || membership.state !== "active") return false;
  const cutoff = membership.historyCutoffAt ?? membership.joinedAt;
  return new Date(msg.createdAt).getTime() >= new Date(cutoff).getTime();
}

export function activeMembership(
  memberships: readonly Membership[],
  squadId: string,
  stomperId: StomperId,
): Membership | undefined {
  return memberships.find(
    (m) =>
      m.squadId === squadId &&
      m.stomperId === stomperId &&
      m.state === "active",
  );
}

/**
 * G2 — approve a NEW membership after leave. Does not revive left row.
 * historyCutoffAt = joinedAt (prospective access only).
 */
export function approveNewMembership(args: {
  memberships: Membership[];
  squadId: string;
  stomperId: StomperId;
  joinedAt: string;
  role?: Membership["role"];
}): Result<Membership[], DenyReason> {
  if (isActiveMember(args.memberships, args.squadId, args.stomperId)) {
    return err("duplicate", "Already an active member");
  }
  const next: Membership = {
    squadId: args.squadId as Membership["squadId"],
    stomperId: args.stomperId,
    role: args.role ?? "member",
    state: "active",
    joinedAt: args.joinedAt,
    historyCutoffAt: args.joinedAt,
  };
  return ok([...args.memberships, next]);
}

export type OwnershipState = "resolved" | "pending_transfer" | "unresolved";

export interface OwnerTransferPending {
  squadId: string;
  fromOwnerId: StomperId;
  nomineeId: StomperId;
  nominatedAt: string;
  status: "pending_accept";
}

/**
 * G3 — nominate eligible existing adult active member. No auto-promote.
 */
export function nominateOwnerSuccessor(args: {
  squad: Squad;
  memberships: readonly Membership[];
  people: ReadonlyMap<string, Stomper>;
  fromOwnerId: StomperId;
  nomineeId: StomperId;
  nowIso: string;
}): Result<{ squad: Squad; transfer: OwnerTransferPending }, DenyReason> {
  if (args.squad.ownerId !== args.fromOwnerId) {
    return err("not_squad_admin", "Only current owner may nominate");
  }
  if (args.nomineeId === args.fromOwnerId) {
    return err("intent_invalid", "Cannot nominate self as successor");
  }
  const nomineeMem = activeMembership(args.memberships, args.squad.id, args.nomineeId);
  if (!nomineeMem) return err("not_member", "Nominee must be an active Squad member");
  const nominee = args.people.get(args.nomineeId);
  if (!nominee) {
    return err("not_member", "Nominee must be an eligible adult active account");
  }
  if (nominee.accountStatus === "youth") {
    return err("youth_disabled", "Youth cannot become Squad owner");
  }
  if (nominee.accountStatus !== "active") {
    return err("not_member", "Nominee must be an eligible adult active account");
  }
  const transfer: OwnerTransferPending = {
    squadId: args.squad.id,
    fromOwnerId: args.fromOwnerId,
    nomineeId: args.nomineeId,
    nominatedAt: args.nowIso,
    status: "pending_accept",
  };
  const squad: Squad = {
    ...args.squad,
    ownershipState: "pending_transfer",
    pendingNomineeId: args.nomineeId,
  };
  return ok({ squad, transfer });
}

export interface OwnerTransferAccepted {
  squadId: string;
  fromOwnerId: StomperId;
  nomineeId: StomperId;
  nominatedAt: string;
  status: "accepted";
  acceptedAt: string;
}

/** G3 — transfer completes ONLY after nominee explicitly accepts. */
export function acceptOwnerTransfer(args: {
  squad: Squad;
  memberships: Membership[];
  transfer: OwnerTransferPending;
  acceptorId: StomperId;
  nowIso: string;
}): Result<{ squad: Squad; memberships: Membership[]; transfer: OwnerTransferAccepted }, DenyReason> {
  if (args.transfer.status !== "pending_accept") return err("intent_invalid");
  if (args.acceptorId !== args.transfer.nomineeId) {
    return err("not_squad_admin", "Only the nominated successor may accept");
  }
  if (!activeMembership(args.memberships, args.squad.id, args.acceptorId)) {
    return err("not_member");
  }
  const memberships = args.memberships.map((m) => {
    if (m.squadId !== args.squad.id) return m;
    if (m.stomperId === args.transfer.fromOwnerId && m.state === "active") {
      return { ...m, role: "member" as const };
    }
    if (m.stomperId === args.acceptorId && m.state === "active") {
      return { ...m, role: "owner" as const };
    }
    return m;
  });
  const squad: Squad = {
    ...args.squad,
    ownerId: args.acceptorId,
    ownershipState: "resolved",
    pendingNomineeId: undefined,
  };
  const transfer: OwnerTransferAccepted = {
    squadId: args.transfer.squadId,
    fromOwnerId: args.transfer.fromOwnerId,
    nomineeId: args.transfer.nomineeId,
    nominatedAt: args.transfer.nominatedAt,
    status: "accepted",
    acceptedAt: args.nowIso,
  };
  return ok({ squad, memberships, transfer });
}

/**
 * G3 — owner departs without accepted successor → unresolved-owner.
 * Does NOT destroy members or Campfire activity. Does NOT auto-promote.
 * Departing owner is not forced to remain an active participant.
 */
export function departOwnerWithoutSuccessor(args: {
  squad: Squad;
  memberships: Membership[];
  ownerId: StomperId;
  leftAt: string;
  remainAsMember?: boolean;
}): Result<{ squad: Squad; memberships: Membership[] }, DenyReason> {
  if (args.squad.ownerId !== args.ownerId) return err("not_squad_admin");
  const memberships = args.memberships.map((m) => {
    if (m.squadId !== args.squad.id || m.stomperId !== args.ownerId) return m;
    if (args.remainAsMember) {
      return { ...m, role: "member" as const };
    }
    return { ...m, state: "left" as const, leftAt: args.leftAt, role: "member" as const };
  });
  const squad: Squad = {
    ...args.squad,
    ownershipState: "unresolved",
    pendingNomineeId: undefined,
    // ownerId retained as last-known for audit; unresolved blocks owner-only elevation
    unresolvedSince: args.leftAt,
  };
  return ok({ squad, memberships });
}

/** Owner-only admin elevation blocked while unresolved. Existing admins unchanged. */
export function canElevateToOwner(squad: Squad): Result<true, DenyReason> {
  if (squad.ownershipState === "unresolved" || squad.ownershipState === "pending_transfer") {
    return err("unresolved_policy", "Ownership unresolved — no auto-elevation");
  }
  return ok(true);
}

/**
 * G4 — immediate logical revocation after confirmed deletion (fictional).
 * Does not promise physical wipe of backups/third parties.
 */
export function revokeAccountAccess(args: {
  stomper: Stomper;
  memberships: Membership[];
  invites: Array<{ toStomperId: StomperId; status: string; id: string }>;
  nowIso: string;
}): {
  stomper: Stomper;
  memberships: Membership[];
  invites: Array<{ toStomperId: StomperId; status: string; id: string }>;
  sessionsRevoked: true;
  grantsRevoked: true;
  physicalWipeGuaranteed: false;
  note: string;
} {
  const stomper: Stomper = {
    ...args.stomper,
    accountStatus: "erased",
    displayName: FORMER_STOMPER_LABEL,
    handle: "former_stomper",
  };
  const memberships = args.memberships.map((m) =>
    m.stomperId === args.stomper.id && m.state === "active"
      ? { ...m, state: "revoked" as const, leftAt: args.nowIso }
      : m,
  );
  const invites = args.invites.map((i) =>
    i.toStomperId === args.stomper.id && i.status === "pending"
      ? { ...i, status: "revoked" }
      : i,
  );
  return {
    stomper,
    memberships,
    invites,
    sessionsRevoked: true,
    grantsRevoked: true,
    physicalWipeGuaranteed: false,
    note: "Logical revoke only. Physical deletion from all backups/third parties is NOT guaranteed.",
  };
}
