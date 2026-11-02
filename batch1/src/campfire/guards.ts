/**
 * Campfire CF-2 permission guards — pure functions.
 */
import { YOUTH_CAMPFIRE_ENABLED } from "./policy.js";
import type {
  AccountStatus,
  Block,
  Campfire,
  DenyReason,
  Membership,
  Message,
  Squad,
  Stomper,
  StomperId,
} from "./cf2-types.js";
import { err, ok, type Result } from "../core/result.js";

export function isActiveMember(
  memberships: readonly Membership[],
  squadId: string,
  stomperId: StomperId,
): boolean {
  return memberships.some(
    (m) =>
      m.squadId === squadId &&
      m.stomperId === stomperId &&
      m.state === "active",
  );
}

export function membershipOf(
  memberships: readonly Membership[],
  squadId: string,
  stomperId: StomperId,
): Membership | undefined {
  return memberships.find(
    (m) => m.squadId === squadId && m.stomperId === stomperId,
  );
}

export function accountAllowsCampfire(status: AccountStatus): Result<true, DenyReason> {
  if (status === "youth" && !YOUTH_CAMPFIRE_ENABLED) {
    return err("youth_disabled", "Youth Campfire disabled");
  }
  if (status === "erased") return err("account_erased");
  return ok(true);
}

export function canAccessCampfire(args: {
  stomper: Stomper;
  campfire: Campfire;
  memberships: readonly Membership[];
}): Result<true, DenyReason> {
  const acct = accountAllowsCampfire(args.stomper.accountStatus);
  if (!acct.ok) return acct;
  if (!isActiveMember(args.memberships, args.campfire.squadId, args.stomper.id)) {
    return err("not_member");
  }
  return ok(true);
}

export const canRead = canAccessCampfire;
export const canPost = canAccessCampfire;
export const canReact = canAccessCampfire;

export function canInvite(args: {
  actor: Stomper;
  squad: Squad;
  memberships: readonly Membership[];
}): Result<true, DenyReason> {
  const acct = accountAllowsCampfire(args.actor.accountStatus);
  if (!acct.ok) return acct;
  const m = membershipOf(args.memberships, args.squad.id, args.actor.id);
  if (!m || m.state !== "active") return err("not_member");
  if (m.role !== "owner" && m.role !== "admin") {
    return err("not_squad_admin");
  }
  return ok(true);
}

export function canDeleteMessage(args: {
  actor: Stomper;
  message: Message;
}): Result<true, DenyReason> {
  const acct = accountAllowsCampfire(args.actor.accountStatus);
  if (!acct.ok) return acct;
  if (args.message.authorId !== args.actor.id) {
    return err("not_author", "Owners/admins cannot delete others' messages");
  }
  return ok(true);
}

/** Block is directional person-level; applies in every shared Squad. */
export function isBlockedEitherWay(
  blocks: readonly Block[],
  a: StomperId,
  b: StomperId,
): boolean {
  return blocks.some(
    (x) =>
      !x.inert &&
      ((x.blockerId === a && x.blockedId === b) ||
        (x.blockerId === b && x.blockedId === a)),
  );
}

export function blockEdge(
  blocks: readonly Block[],
  blockerId: StomperId,
  blockedId: StomperId,
): Block | undefined {
  return blocks.find(
    (x) =>
      !x.inert && x.blockerId === blockerId && x.blockedId === blockedId,
  );
}

/** Targeted DM / mention / reply / invite / reaction-notify across a block. */
export function canDirectInteract(
  blocks: readonly Block[],
  actorId: StomperId,
  targetId: StomperId,
): Result<true, DenyReason> {
  if (isBlockedEitherWay(blocks, actorId, targetId)) {
    return err("blocked_target");
  }
  return ok(true);
}

export function sharedSquadIds(
  memberships: readonly Membership[],
  a: StomperId,
  b: StomperId,
): string[] {
  const aSet = new Set(
    memberships
      .filter((m) => m.stomperId === a && m.state === "active")
      .map((m) => m.squadId as string),
  );
  return memberships
    .filter((m) => m.stomperId === b && m.state === "active" && aSet.has(m.squadId))
    .map((m) => m.squadId as string);
}
