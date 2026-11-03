/**
 * A5 — GuardResult (#13) ↔ Result+DenyReason (#14) + total reason map.
 * Unmapped GuardReason values compile-time exhaustiveness-checked where possible;
 * residual trip-only reasons map to unresolved_policy (no `ok` leak on deny).
 */
import { err, ok, type Result } from "../core/result.js";
import type { DenyReason } from "../campfire/cf2-types.js";
import type { GuardReason, GuardResult } from "../trips/types.js";

/** Total map: every GuardReason appears exactly once. */
export const GUARD_TO_DENY: Record<GuardReason, DenyReason | "ok"> = {
  ok: "ok",
  not_host_or_cohost: "not_squad_admin",
  pass_inactive: "not_member",
  approver_pass_inactive: "not_member",
  after_deadline: "expired",
  trip_not_active: "intent_invalid",
  trip_not_scheduled_or_draft: "intent_invalid",
  trip_already_finalized: "intent_invalid",
  trip_cancelled: "intent_invalid",
  confirmation_required: "needs_confirm",
  entitlement_not_satisfied: "not_member",
  revised_end_not_after_previous: "intent_invalid",
  extension_fields_incomplete: "intent_invalid",
  day_sesh_no_extension: "intent_invalid",
  day_sesh_no_viewers: "not_member",
  day_sesh_expired: "expired",
  cannot_cancel_active: "intent_invalid",
  cannot_remove_host: "not_squad_admin",
  admin_same_actor: "intent_invalid",
  admin_not_two_person: "intent_invalid",
  participation_ended: "expired",
  renewal_required: "not_member",
  viewer_download_denied: "not_member",
  policy_unresolved: "unresolved_policy",
  invalid_timezone: "intent_invalid",
  invalid_publish: "intent_invalid",
  role_cannot_join: "not_member",
};

/** Inverse for DenyReason → preferred GuardReason (lossy where many→one). */
export const DENY_TO_GUARD: Record<DenyReason, GuardReason> = {
  not_member: "entitlement_not_satisfied",
  not_author: "not_host_or_cohost",
  not_squad_admin: "not_host_or_cohost",
  blocked_target: "policy_unresolved",
  youth_disabled: "policy_unresolved",
  account_erased: "policy_unresolved",
  multi_recipient: "invalid_publish",
  needs_confirm: "confirmation_required",
  expired: "after_deadline",
  not_found: "policy_unresolved",
  duplicate: "invalid_publish",
  intent_invalid: "invalid_publish",
  campfire_disabled: "policy_unresolved",
  unresolved_policy: "policy_unresolved",
  // SV-0 DenyReasons (t1159u cherry-pick) — map without inventing new GuardReasons
  session_locked: "confirmation_required",
  media_deleted: "after_deadline",
  already_handled: "invalid_publish",
};

export function mapGuardReasonToDeny(reason: GuardReason): DenyReason | "ok" {
  return GUARD_TO_DENY[reason];
}

export function mapDenyReasonToGuard(reason: DenyReason): GuardReason {
  return DENY_TO_GUARD[reason];
}

/** Convert #13 GuardResult → #14 Result. Never leaks `ok` as a DenyReason. */
export function guardToResult<T>(g: GuardResult<T>): Result<T, DenyReason> {
  if (g.ok) {
    return ok(g.value as T);
  }
  const mapped = GUARD_TO_DENY[g.reason];
  if (mapped === "ok") {
    // Safety: a deny path must never surface ok
    return err("unresolved_policy", g.message ?? "guard deny mapped to ok — blocked");
  }
  return err(mapped, g.message);
}

/** Convert #14 Result → #13 GuardResult. */
export function resultToGuard<T>(r: Result<T, DenyReason>): GuardResult<T> {
  if (r.ok) {
    return { ok: true, value: r.value, reason: "ok" };
  }
  return {
    ok: false,
    reason: DENY_TO_GUARD[r.error],
    message: r.message,
  };
}

/** Compile-time / runtime completeness check for the GuardReason map. */
export function assertGuardReasonMapTotal(
  reasons: readonly GuardReason[],
): boolean {
  for (const r of reasons) {
    if (!(r in GUARD_TO_DENY)) return false;
    if (r !== "ok" && GUARD_TO_DENY[r] === "ok") return false;
  }
  return true;
}
