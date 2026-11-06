/**
 * t1238u — Spot Keeper permissions matrix (fictional preview).
 * Founder attribution stays separate from Keeper role.
 * Keeper does not own the physical location or other riders' clips.
 */
import type {
  ContributorPermission,
  CrewAclEntry,
  PinVisibility,
  SpotPin,
  SpotRole,
  StomperId,
} from "./types.js";

export type SpotAction =
  | "view_pin"
  | "view_clips"
  | "add_clip"
  | "react"
  | "export_own_clip"
  | "create_pin"
  | "rename"
  | "correct_pin_location"
  | "edit_description"
  | "select_authorized_crew"
  | "manage_contributor_permissions"
  | "archive_or_remove_pin"
  | "update_feature_status"
  | "transfer_keeper"
  | "accept_keeper_transfer"
  | "discover_publicly"
  | "see_on_public_profile";

export type PermissionDecision = {
  allowed: boolean;
  reason: string;
};

const DENY = (reason: string): PermissionDecision => ({ allowed: false, reason });
const ALLOW = (reason = "ok"): PermissionDecision => ({ allowed: true, reason });

export function resolveRole(
  pin: SpotPin,
  actorId: StomperId,
  opts?: {
    /** Crews the actor belongs to (for stash ACL). */
    actorCrewIds?: string[];
    /** Whether actor is an authorized public rider (signed-in fiction). */
    authorizedPublicRider?: boolean;
  },
): SpotRole {
  if (pin.founderId === actorId && pin.keeperId === actorId) return "keeper";
  if (pin.keeperId === actorId) return "keeper";
  if (pin.founderId === actorId) return "founder";

  if (pin.visibility === "private_stash") {
    const actorCrews = new Set(opts?.actorCrewIds ?? []);
    const hit = pin.crewAcl.find((e) => actorCrews.has(e.crewId));
    if (!hit) return "unauthorized";
    return hit.permission === "contributor" ? "crew_contributor" : "crew_viewer";
  }

  // Public Spot
  if (opts?.authorizedPublicRider === false) return "unauthorized";
  return "public_rider";
}

/** Static matrix for docs / tests — roles × actions. */
export const PERMISSIONS_MATRIX: Record<
  SpotRole,
  Record<SpotAction, boolean>
> = {
  founder: {
    view_pin: true,
    view_clips: true,
    add_clip: true,
    react: true,
    export_own_clip: true,
    create_pin: true,
    rename: false, // only Keeper (unless also Keeper)
    correct_pin_location: false,
    edit_description: false,
    select_authorized_crew: false,
    manage_contributor_permissions: false,
    archive_or_remove_pin: false,
    update_feature_status: false,
    transfer_keeper: false,
    accept_keeper_transfer: false,
    discover_publicly: true,
    see_on_public_profile: true, // founder credit may show; not stash coords
  },
  keeper: {
    view_pin: true,
    view_clips: true,
    add_clip: true,
    react: true,
    export_own_clip: true,
    create_pin: true,
    rename: true,
    correct_pin_location: true,
    edit_description: true,
    select_authorized_crew: true,
    manage_contributor_permissions: true,
    archive_or_remove_pin: true,
    update_feature_status: true,
    transfer_keeper: true,
    accept_keeper_transfer: false,
    discover_publicly: true,
    see_on_public_profile: true,
  },
  crew_contributor: {
    view_pin: true,
    view_clips: true,
    add_clip: true,
    react: true,
    export_own_clip: true,
    create_pin: false,
    rename: false,
    correct_pin_location: false,
    edit_description: false,
    select_authorized_crew: false,
    manage_contributor_permissions: false,
    archive_or_remove_pin: false,
    update_feature_status: false,
    transfer_keeper: false,
    accept_keeper_transfer: true, // if offered
    discover_publicly: false,
    see_on_public_profile: false,
  },
  crew_viewer: {
    view_pin: true,
    view_clips: true,
    add_clip: false,
    react: true,
    export_own_clip: true,
    create_pin: false,
    rename: false,
    correct_pin_location: false,
    edit_description: false,
    select_authorized_crew: false,
    manage_contributor_permissions: false,
    archive_or_remove_pin: false,
    update_feature_status: false,
    transfer_keeper: false,
    accept_keeper_transfer: true,
    discover_publicly: false,
    see_on_public_profile: false,
  },
  public_rider: {
    view_pin: true,
    view_clips: true,
    add_clip: true,
    react: true,
    export_own_clip: true,
    create_pin: true,
    rename: false,
    correct_pin_location: false,
    edit_description: false,
    select_authorized_crew: false,
    manage_contributor_permissions: false,
    archive_or_remove_pin: false,
    update_feature_status: false,
    transfer_keeper: false,
    accept_keeper_transfer: false,
    discover_publicly: true,
    see_on_public_profile: true,
  },
  unauthorized: {
    view_pin: false,
    view_clips: false,
    add_clip: false,
    react: false,
    export_own_clip: false,
    create_pin: false,
    rename: false,
    correct_pin_location: false,
    edit_description: false,
    select_authorized_crew: false,
    manage_contributor_permissions: false,
    archive_or_remove_pin: false,
    update_feature_status: false,
    transfer_keeper: false,
    accept_keeper_transfer: false,
    discover_publicly: false,
    see_on_public_profile: false,
  },
};

export function can(
  pin: SpotPin,
  actorId: StomperId,
  action: SpotAction,
  opts?: {
    actorCrewIds?: string[];
    authorizedPublicRider?: boolean;
  },
): PermissionDecision {
  // Private stash never discoverable / never on public profile metadata
  if (
    pin.visibility === "private_stash" &&
    (action === "discover_publicly" || action === "see_on_public_profile")
  ) {
    return DENY("stash_never_public");
  }

  const role = resolveRole(pin, actorId, opts);

  // Founder who is also Keeper gets Keeper powers
  if (pin.founderId === actorId && pin.keeperId === actorId) {
    const keeper = PERMISSIONS_MATRIX.keeper[action];
    return keeper ? ALLOW("founder_and_keeper") : DENY("founder_keeper_denied");
  }

  // Founder (non-keeper) keeps credit + ride actions only
  if (role === "founder") {
    return PERMISSIONS_MATRIX.founder[action]
      ? ALLOW("founder")
      : DENY("only_keeper_manages");
  }

  const allowed = PERMISSIONS_MATRIX[role][action];
  if (!allowed) {
    return DENY(role === "unauthorized" ? "unauthorized" : `role_${role}_denied`);
  }
  return ALLOW(role);
}

/** Stashes must never appear in public discovery — ACL/saveState irrelevant. */
export function assertStashNotPublic(pin: SpotPin): boolean {
  if (pin.visibility !== "private_stash") return true;
  // Even an authorized public rider cannot discover a stash.
  return (
    can(pin, "public-rider-probe", "discover_publicly", {
      authorizedPublicRider: true,
    }).allowed === false
  );
}

/** Stash shared only with explicitly selected crew — never auto-public. */
export function canBecomePublicAutomatically(visibility: PinVisibility): false {
  void visibility;
  return false;
}

export function revokeCrewAccess(
  pin: SpotPin,
  crewId: string,
): SpotPin {
  if (pin.visibility !== "private_stash") return pin;
  return {
    ...pin,
    crewAcl: pin.crewAcl.filter((e) => e.crewId !== crewId),
  };
}

export function setCrewPermission(
  pin: SpotPin,
  entry: CrewAclEntry,
  actorId: StomperId,
): { ok: true; pin: SpotPin } | { ok: false; error: string } {
  const decision = can(pin, actorId, "manage_contributor_permissions");
  if (!decision.allowed) return { ok: false, error: decision.reason };
  if (pin.visibility !== "private_stash") {
    return { ok: false, error: "public_spot_has_no_crew_acl" };
  }
  const rest = pin.crewAcl.filter((e) => e.crewId !== entry.crewId);
  return { ok: true, pin: { ...pin, crewAcl: [...rest, entry] } };
}

export function listPermissionsMatrixRows(): Array<{
  role: SpotRole;
  action: SpotAction;
  allowed: boolean;
}> {
  const rows: Array<{ role: SpotRole; action: SpotAction; allowed: boolean }> = [];
  for (const role of Object.keys(PERMISSIONS_MATRIX) as SpotRole[]) {
    for (const action of Object.keys(PERMISSIONS_MATRIX[role]) as SpotAction[]) {
      rows.push({ role, action, allowed: PERMISSIONS_MATRIX[role][action] });
    }
  }
  return rows;
}

export type { ContributorPermission };
