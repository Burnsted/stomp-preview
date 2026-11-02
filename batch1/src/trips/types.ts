/**
 * Trip Drop state machine — fictional-data types only (t1138u).
 * Pure local models; no live auth, payments, or deletion jobs.
 * Governing: TRIP-STATE-MACHINE-CONSOLIDATED-SPEC (t1137u) + timing/contract.
 */

export type StomperId = string & { readonly __brand: "StomperId" };
export type TripId = string & { readonly __brand: "TripId" };
export type PassId = string & { readonly __brand: "PassId" };
export type ExtensionId = string & { readonly __brand: "ExtensionId" };
export type AdminCorrectionId = string & { readonly __brand: "AdminCorrectionId" };

/** Trip Drop only — Day Sesh is a separate type under `daysesh/` (t1143u). */
export type TripKind = "trip";
export type TripStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled"
  | "retention-expired";

export type TripRole = "host" | "cohost" | "rider" | "viewer";
export type MembershipStatus = "invited" | "active" | "left" | "removed";
export type FinalizedBy = "auto" | "manual_early_end";
export type PassStatus = "active" | "lapsed" | "revoked";
export type PassSource = "fixture" | "purchase" | "comp";

export interface PassEvent {
  kind: "activated" | "extended" | "lapsed" | "revoked";
  atIso: string;
  tripId?: TripId;
}

export interface PassEntitlement {
  id: PassId;
  stomperId: StomperId;
  status: PassStatus;
  startIso: string;
  endIso: string;
  source: PassSource;
  history: PassEvent[];
}

/** Locked extension fields (t1134u). */
export interface ExtensionRecord {
  id: ExtensionId;
  previousEndAt: string;
  revisedEndAt: string;
  approverStomperId: StomperId;
  approverRole: "host" | "cohost";
  approvedAt: string;
  requestedBy?: StomperId;
}

export interface EarlyEndAudit {
  actorId: StomperId;
  actorRole: "host" | "cohost";
  confirmedAt: string;
  reason?: string;
}

export interface CancelAudit {
  actorId: StomperId;
  actorRole: "host" | "cohost";
  confirmedAt: string;
  reason?: string;
}

/**
 * Admin correction — out-of-band support only (D4).
 * Live admin tooling / reviewer roster = POLICY_UNRESOLVED.
 */
export interface AdminCorrection {
  id: AdminCorrectionId;
  field: string;
  old: unknown;
  new: unknown;
  requestedBy: StomperId;
  reviewedBy: StomperId;
  reason: string;
  at: string;
}

export interface Trip {
  id: TripId;
  name: string;
  kind: TripKind;
  /** IANA resort-local zone for display/authoring (D3). Instants stored UTC. */
  timeZone: string;
  startIso: string;
  /** Immutable after creation. */
  originalEndAt: string;
  /** Current scheduled end (original or last approved extension). */
  scheduledEndAt: string;
  /** Null until finalize; then immutable. Cancelled stays null forever (D1). */
  officialEndDate: string | null;
  extensions: ExtensionRecord[];
  hostId: StomperId;
  status: TripStatus;
  datesLabel?: string;
  finalizedBy?: FinalizedBy;
  cancelledAt?: string;
  cancelledBy?: StomperId;
  cancelAudit?: CancelAudit;
  endedEarly?: EarlyEndAudit;
  adminCorrections: AdminCorrection[];
  /**
   * Fixture/test flag for "entitlement rules satisfied".
   * Exact production entitlement rules remain OUTSTANDING — do not invent.
   */
  entitlementOk: boolean;
}

export interface TripMembership {
  tripId: TripId;
  stomperId: StomperId;
  role: TripRole;
  status: MembershipStatus;
  approvedBy?: StomperId;
  joinedAtIso: string;
  /** Frozen at scheduledEndAt when Pass lapses mid-trip (t1135u/t1136u). */
  graceUntilAt?: string;
  /**
   * Per-Rider authorized participation end — independent of trip.scheduledEndAt
   * and officialEndDate (D9 / t1136u).
   */
  participationEndsAt: string;
  appointedBy?: StomperId;
  appointedAt?: string;
  /** Intact prior grace window record (not rewritten on later extension). */
  priorGraceWindow?: { fromIso: string; untilIso: string };
}

export interface ViewerEntitlement {
  tripId: TripId;
  stomperId: StomperId;
  grantedAtIso: string;
  /** ≤ officialEndDate + 45d when trip finalized. */
  downloadUntilIso: string | null;
  projectedDownloadUntilIso?: string;
  revokedAtIso?: string;
}

export type RetentionKind =
  | "media_45d"
  | "viewer_download_45d"
  | "viewer_only_12mo"
  | "pass_archive_6mo"
  | "never_rider"
  | "founder";

export interface RetentionClock {
  stomperId?: StomperId;
  tripId?: TripId;
  kind: RetentionKind;
  anchorIso: string;
  deadlineIso: string | null;
  /**
   * When true, deadline is not authoritative yet (e.g. projected from
   * scheduledEndAt before finalize).
   */
  projected?: boolean;
  /**
   * POLICY_UNRESOLVED markers — never invent irreversible cleanup outcomes.
   */
  policyUnresolved?: string;
  noticeSentIso?: string;
  exportOfferedIso?: string;
}

export type GuardReason =
  | "ok"
  | "not_host_or_cohost"
  | "pass_inactive"
  | "approver_pass_inactive"
  | "after_deadline"
  | "trip_not_active"
  | "trip_not_scheduled_or_draft"
  | "trip_already_finalized"
  | "trip_cancelled"
  | "confirmation_required"
  | "entitlement_not_satisfied"
  | "revised_end_not_after_previous"
  | "extension_fields_incomplete"
  | "day_sesh_no_extension"
  | "day_sesh_no_viewers"
  | "day_sesh_expired"
  | "cannot_cancel_active"
  | "cannot_remove_host"
  | "admin_same_actor"
  | "admin_not_two_person"
  | "participation_ended"
  | "renewal_required"
  | "viewer_download_denied"
  | "policy_unresolved"
  | "invalid_timezone"
  | "invalid_publish"
  | "role_cannot_join";

export type GuardResult<T = undefined> =
  | { ok: true; value: T; reason?: GuardReason }
  | { ok: false; reason: GuardReason; message?: string };

export interface TripWorld {
  trip: Trip;
  memberships: TripMembership[];
  passes: PassEntitlement[];
  viewers: ViewerEntitlement[];
  clocks: RetentionClock[];
}

export interface Clock {
  nowIso(): string;
}
