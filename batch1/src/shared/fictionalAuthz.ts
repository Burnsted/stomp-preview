/**
 * FICTIONAL SERVER AUTHORIZATION (t1165u) — TEST / DEMO DESIGN ONLY.
 *
 * BANNER: Client permission checks (including Rider Hub social.ts flags) are
 * NEVER production security. This module is an in-process deny-by-default
 * envelope over existing batch1 guards. It does NOT activate live auth,
 * credentials, storage, or network. Production activation requires owner Go
 * via docs/core-completion-t1165u/SERVER-AUTHZ-PACKET.md.
 */
import { err, ok, type Result } from "../core/result.js";
import type { DenyReason } from "../campfire/cf2-types.js";
import {
  accountAllowsCampfire,
  canAccessCampfire,
  canInvite,
  canReact,
  isActiveMember,
} from "../campfire/guards.js";
import { YOUTH_CAMPFIRE_ENABLED } from "../campfire/policy.js";
import {
  assertSingleSquad,
  confirmShare,
  type ConfirmShareRecheck,
} from "../campfire/share.js";
import type {
  Campfire,
  Membership,
  ShareIntent,
  Squad,
  Stomper,
  StomperId,
} from "../campfire/cf2-types.js";
import {
  canDownloadViewer,
  canJoinAsRider,
  hasActivePass,
  hasRiderAccessAt,
  type PassEntitlement,
  type Trip,
  type TripMembership,
  type ViewerEntitlement,
} from "../trips/index.js";
import { canJoinDaySesh } from "../daysesh/index.js";
import type { DaySesh } from "../daysesh/types.js";
import { mapGuardReasonToDeny } from "./guardResult.js";
import { participationFacts } from "./participationFacts.js";
import type { TripWorld } from "../trips/types.js";

/** Deny-by-default action catalog for AF-AUTH matrix. */
export type AuthzAction =
  | "own_stomper_account"
  | "join_trip_as_rider"
  | "act_as_cohost"
  | "access_squad_campfire"
  | "post_campfire"
  | "react_as_viewer"
  | "download_as_viewer"
  | "prepare_single_squad_share"
  | "confirm_share_rechecked"
  | "join_day_sesh"
  | "retain_after_expiry"
  /** t1170u — logical account / youth gate (fictional only; no live auth). */
  | "active_non_erased_account"
  | "adult_campfire_enrollment";

export type AuthzDenyCode = DenyReason | "account_mismatch" | "pass_inactive" | "not_host_or_cohost";

export type AuthzDecision =
  | { allow: true; action: AuthzAction; code: "ok" }
  | { allow: false; action: AuthzAction; code: AuthzDenyCode; message?: string };

function deny(action: AuthzAction, code: AuthzDenyCode, message?: string): AuthzDecision {
  return { allow: false, action, code, message };
}
function allow(action: AuthzAction): AuthzDecision {
  return { allow: true, action, code: "ok" };
}

/** STOMPER identity ↔ account ownership (fictional actor binding). */
export function authorizeOwnStomper(args: {
  actorId: string;
  accountOwnerId: string;
}): AuthzDecision {
  const action: AuthzAction = "own_stomper_account";
  if (!args.actorId || !args.accountOwnerId) {
    return deny(action, "not_member", "Missing actor or account owner");
  }
  if (args.actorId !== args.accountOwnerId) {
    return deny(action, "account_mismatch", "Actor does not own this STOMPER");
  }
  return allow(action);
}

/** Rider Pass eligibility + Trip join. */
export function authorizeJoinTripAsRider(args: {
  stomperId: StomperId | string;
  trip: Trip;
  passes: PassEntitlement[];
  atIso: string;
  existing?: TripMembership;
}): AuthzDecision {
  const action: AuthzAction = "join_trip_as_rider";
  const gate = canJoinAsRider(
    args.stomperId as Parameters<typeof canJoinAsRider>[0],
    args.trip,
    args.passes,
    args.atIso,
    args.existing,
  );
  if (!gate.ok) {
    const mapped = mapGuardReasonToDeny(gate.reason);
    return deny(
      action,
      mapped === "ok" ? "pass_inactive" : mapped,
      gate.message,
    );
  }
  return allow(action);
}

/** Co-host / host action gate (Trip membership role). */
export function authorizeCohostAction(args: {
  actorId: string;
  memberships: readonly TripMembership[];
  tripId: string;
}): AuthzDecision {
  const action: AuthzAction = "act_as_cohost";
  const mem = args.memberships.find(
    (m) =>
      m.tripId === args.tripId &&
      String(m.stomperId) === args.actorId &&
      m.status === "active" &&
      (m.role === "host" || m.role === "cohost"),
  );
  if (!mem) return deny(action, "not_host_or_cohost");
  return allow(action);
}

/** Squad membership + Campfire access / post. */
export function authorizeCampfireAccess(args: {
  stomper: Stomper;
  campfire: Campfire;
  memberships: readonly Membership[];
  forPost?: boolean;
}): AuthzDecision {
  const action: AuthzAction = args.forPost ? "post_campfire" : "access_squad_campfire";
  const gate = canAccessCampfire({
    stomper: args.stomper,
    campfire: args.campfire,
    memberships: args.memberships,
  });
  if (!gate.ok) return deny(action, gate.error);
  return allow(action);
}

/** Viewer reactions — Campfire react requires membership; Trip viewer alone is denied. */
export function authorizeViewerReact(args: {
  stomper: Stomper;
  campfire: Campfire;
  memberships: readonly Membership[];
  tripWorld?: TripWorld | null;
}): AuthzDecision {
  const action: AuthzAction = "react_as_viewer";
  const facts = participationFacts(args.stomper.id, args.tripWorld, null);
  if (facts.isTripViewer && !isActiveMember(args.memberships, args.campfire.squadId, args.stomper.id)) {
    return deny(action, "not_member", "Trip Viewer cannot react on Squad Campfire");
  }
  const gate = canReact({
    stomper: args.stomper,
    campfire: args.campfire,
    memberships: args.memberships,
  });
  if (!gate.ok) return deny(action, gate.error);
  return allow(action);
}

/** Viewer download within MediaRef deadline; revoked denies. */
export function authorizeViewerDownload(args: {
  viewer: ViewerEntitlement;
  atIso: string;
}): AuthzDecision {
  const action: AuthzAction = "download_as_viewer";
  const gate = canDownloadViewer(args.viewer, args.atIso);
  if (!gate.ok) {
    const mapped = mapGuardReasonToDeny(gate.reason);
    return deny(action, mapped === "ok" ? "expired" : mapped, gate.message);
  }
  return allow(action);
}

/** Quick Share prepare — exactly one Squad. */
export function authorizePrepareShare(args: {
  actorId: StomperId;
  squadIds: readonly string[];
  memberships: readonly Membership[];
}): AuthzDecision {
  const action: AuthzAction = "prepare_single_squad_share";
  const single = assertSingleSquad(args.squadIds);
  if (!single.ok) return deny(action, single.error);
  if (!isActiveMember(args.memberships, single.value, args.actorId)) {
    return deny(action, "not_member");
  }
  return allow(action);
}

/**
 * Confirm share with recipient + permissions rechecked (SV-0).
 * Wraps confirmShare; deny-by-default when recheck omitted on locked paths.
 */
export function authorizeConfirmShare(args: {
  intent: ShareIntent;
  nowIso: string;
  recheck: ConfirmShareRecheck;
}): AuthzDecision {
  const action: AuthzAction = "confirm_share_rechecked";
  const result = confirmShare(args.intent, {
    nowIso: args.nowIso,
    recheck: args.recheck,
  });
  if (!result.ok) return deny(action, result.error as AuthzDenyCode);
  return allow(action);
}

/** Day Sesh join — Pass required; Trip grace alone insufficient. */
export function authorizeJoinDaySesh(args: {
  stomperId: string;
  sesh: DaySesh;
  passes: PassEntitlement[];
  atIso: string;
}): AuthzDecision {
  const action: AuthzAction = "join_day_sesh";
  const gate = canJoinDaySesh(
    args.stomperId as Parameters<typeof canJoinDaySesh>[0],
    args.sesh,
    args.passes,
    args.atIso,
  );
  if (!gate.ok) {
    const mapped = mapGuardReasonToDeny(gate.reason);
    return deny(action, mapped === "ok" ? "pass_inactive" : mapped, gate.message);
  }
  return allow(action);
}

/** Squad invite admin gate (isolation). */
export function authorizeSquadInvite(args: {
  actor: Stomper;
  squad: Squad;
  memberships: readonly Membership[];
}): AuthzDecision {
  const action: AuthzAction = "access_squad_campfire";
  const gate = canInvite(args);
  if (!gate.ok) return deny(action, gate.error);
  return allow(action);
}

/** Rider access after Pass expiry / grace — retention of access entitlement. */
export function authorizeRiderAccessAt(args: {
  membership: TripMembership;
  trip: Trip;
  passes: PassEntitlement[];
  atIso: string;
}): AuthzDecision {
  const action: AuthzAction = "retain_after_expiry";
  if (hasRiderAccessAt(args.membership, args.trip, args.passes, args.atIso)) {
    return allow(action);
  }
  if (!hasActivePass(args.passes, args.membership.stomperId, args.atIso)) {
    return deny(action, "pass_inactive");
  }
  return deny(action, "expired");
}

/**
 * t1170u — deny when account is logically erased (G4). Fictional only.
 * Does NOT activate deletion jobs or physical wipe.
 */
export function authorizeNonErasedAccount(args: {
  stomper: Stomper;
}): AuthzDecision {
  const action: AuthzAction = "active_non_erased_account";
  const gate = accountAllowsCampfire(args.stomper.accountStatus);
  if (!gate.ok) return deny(action, gate.error);
  return allow(action);
}

/**
 * t1170u — youth Campfire enrollment remains HELD (flag false).
 * Adult accounts still pass; youth always deny while flag is off.
 */
export function authorizeAdultCampfireEnrollment(args: {
  stomper: Stomper;
}): AuthzDecision {
  const action: AuthzAction = "adult_campfire_enrollment";
  if (args.stomper.accountStatus === "youth") {
    if (!YOUTH_CAMPFIRE_ENABLED) {
      return deny(action, "youth_disabled", "Youth Campfire enrollment HELD");
    }
  }
  if (args.stomper.accountStatus === "erased") {
    return deny(action, "account_erased");
  }
  return allow(action);
}

/** Result-shaped wrapper for callers that prefer Result. */
export function decisionToResult(d: AuthzDecision): Result<true, AuthzDenyCode> {
  return d.allow ? ok(true) : err(d.code, d.message);
}
