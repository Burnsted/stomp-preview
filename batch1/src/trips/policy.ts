/**
 * PolicyDecision stubs — conditional areas Ted has NOT finalized.
 * Never silently choose irreversible refund / deletion / paid-access outcomes.
 */

export type PolicyArea =
  | "cancellation_refunds"
  | "cancellation_cleanup_deadline"
  | "cancelled_trip_media_viewer_retention"
  | "early_end_paid_viewer_access"
  | "live_admin_correction_permissions"
  | "deletion_retention_jobs"
  | "renewal_purchase_price_duration";

export interface PolicyDecision {
  area: PolicyArea;
  status: "POLICY_UNRESOLVED";
  /** Why this batch must not invent a final outcome. */
  why: string;
  /** Safe local representation only — never executes side effects. */
  interfaceDisabled: true;
}

export const POLICY_STUBS: readonly PolicyDecision[] = [
  {
    area: "cancellation_refunds",
    status: "POLICY_UNRESOLVED",
    why: "F1 — refunds/credits for Passes or Viewer purchases on cancelled trips undefined; do not invent financial outcomes.",
    interfaceDisabled: true,
  },
  {
    area: "cancellation_cleanup_deadline",
    status: "POLICY_UNRESOLVED",
    why: "F1 — cancelled-trip cleanup deadline has no owner-approved anchor (officialEndDate stays null).",
    interfaceDisabled: true,
  },
  {
    area: "cancelled_trip_media_viewer_retention",
    status: "POLICY_UNRESOLVED",
    why: "F1 — LOCKED officialEndDate+45d cannot apply when officialEndDate is null; separate retention rule pending.",
    interfaceDisabled: true,
  },
  {
    area: "early_end_paid_viewer_access",
    status: "POLICY_UNRESOLVED",
    why: "F3/authorized scope — effects of early-end on paid Viewer access not finalized; stub only.",
    interfaceDisabled: true,
  },
  {
    area: "live_admin_correction_permissions",
    status: "POLICY_UNRESOLVED",
    why: "D4 — live admin support tooling + reviewer roster out of band; record shape only, no live permissions.",
    interfaceDisabled: true,
  },
  {
    area: "deletion_retention_jobs",
    status: "POLICY_UNRESOLVED",
    why: "Actual media/account deletion jobs unauthorized; clocks compute deadlines only, never purge.",
    interfaceDisabled: true,
  },
  {
    area: "renewal_purchase_price_duration",
    status: "POLICY_UNRESOLVED",
    why: "D8/F5 — mid-trip renewal prompt is optional/non-transactional; price/duration/payment not authorized.",
    interfaceDisabled: true,
  },
] as const;

export function getPolicyStub(area: PolicyArea): PolicyDecision {
  const found = POLICY_STUBS.find((p) => p.area === area);
  if (!found) {
    return {
      area,
      status: "POLICY_UNRESOLVED",
      why: "Unknown policy area — default unresolved.",
      interfaceDisabled: true,
    };
  }
  return found;
}

/** Disabled purchase interface — never auto-buys. */
export interface DisabledPurchaseInterface {
  enabled: false;
  reason: "POLICY_UNRESOLVED";
  area: PolicyArea;
  message: string;
}

export function disabledPurchaseInterface(
  area: PolicyArea = "renewal_purchase_price_duration",
): DisabledPurchaseInterface {
  const stub = getPolicyStub(area);
  return {
    enabled: false,
    reason: "POLICY_UNRESOLVED",
    area,
    message: stub.why,
  };
}
