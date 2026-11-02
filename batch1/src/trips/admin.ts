import { getPolicyStub } from "./policy.js";
import type {
  AdminCorrection,
  AdminCorrectionId,
  Clock,
  GuardResult,
  StomperId,
  Trip,
} from "./types.js";

export interface AdminCorrectionInput {
  trip: Trip;
  field: string;
  old: unknown;
  new: unknown;
  requestedBy: StomperId;
  reviewedBy: StomperId;
  reason: string;
  correctionId: AdminCorrectionId;
  clock: Clock;
  /**
   * Live admin UI path — always false in this batch.
   * Corrections are record-only; not reachable from trip-management UI.
   */
  fromTripManagementUi?: boolean;
}

/**
 * Append-only admin correction (D4): two-person review, requestedBy ≠ reviewedBy.
 * Live permissions / reviewer roster = POLICY_UNRESOLVED (disabled interface).
 * Never silently rewrites history — prior values preserved in the record.
 */
export function appendAdminCorrection(
  input: AdminCorrectionInput,
): GuardResult<{ trip: Trip; correction: AdminCorrection; liveAdminDisabled: true }> {
  if (input.fromTripManagementUi) {
    return {
      ok: false,
      reason: "policy_unresolved",
      message: "Admin correction not reachable from trip-management UI",
    };
  }
  if (input.requestedBy === input.reviewedBy) {
    return { ok: false, reason: "admin_same_actor", message: "requestedBy must ≠ reviewedBy" };
  }

  const stub = getPolicyStub("live_admin_correction_permissions");
  const correction: AdminCorrection = {
    id: input.correctionId,
    field: input.field,
    old: input.old,
    new: input.new,
    requestedBy: input.requestedBy,
    reviewedBy: input.reviewedBy,
    reason: input.reason,
    at: input.clock.nowIso(),
  };

  // Preserve prior officialEndDate in history via correction.old; do not erase.
  const next: Trip = {
    ...input.trip,
    adminCorrections: [...input.trip.adminCorrections, correction],
  };

  // Optional field apply for non-locked demo fields only; officialEndDate history preserved
  if (input.field === "scheduledEndAt" && input.trip.status === "active") {
    next.scheduledEndAt = String(input.new);
  }
  // Never silently rewrite officialEndDate without recording — record already appended.
  // Applying officialEndDate change still keeps prior in correction.old.
  if (input.field === "officialEndDate") {
    next.officialEndDate = input.new == null ? null : String(input.new);
  }

  void stub; // documented unresolved live permissions
  return {
    ok: true,
    value: { trip: next, correction, liveAdminDisabled: true },
  };
}

export function liveAdminInterfaceDisabled(): {
  enabled: false;
  reason: "POLICY_UNRESOLVED";
  why: string;
} {
  const stub = getPolicyStub("live_admin_correction_permissions");
  return { enabled: false, reason: "POLICY_UNRESOLVED", why: stub.why };
}
