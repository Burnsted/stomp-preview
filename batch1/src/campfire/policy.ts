/**
 * Campfire CF-2 LOCKED policy constants (t1147u).
 * Source of truth: CF-DECISION-CLOSURE.md — fictional data only.
 * No production deletion jobs, no live moderation, no legal-hold infra.
 */

export const CAMPFIRE_TEXT_MAX_MONTHS = 12;
export const CAMPFIRE_MEDIA_MAX_DAYS = 90;
/** G1 LOCKED — Day Sesh-hosted media max retention after official Day Sesh end. */
export const DAY_SESH_MEDIA_MAX_DAYS = 45;
/** Re-exported contract value — trip Drop media ≤45d from officialEndDate. */
export { VIEWER_MEDIA_MAX_DAYS } from "./trip-shim.js";

export const FORMER_STOMPER_LABEL = "Former STOMPER" as const;
export const AUTHOR_REMOVED_TOMBSTONE = "removed" as const;

/** Youth Campfire stays DISABLED this phase. */
export const YOUTH_CAMPFIRE_ENABLED = false;

/** Soft soft-cap for Squad size notice (invite still allowed). */
export const SQUAD_SOFT_CAP = 20;

export const CAMPFIRE_POLICY = {
  textRetentionMonths: CAMPFIRE_TEXT_MAX_MONTHS,
  standaloneMediaDays: CAMPFIRE_MEDIA_MAX_DAYS,
  tripMediaMaxDays: 45,
  daySeshMediaMaxDays: DAY_SESH_MEDIA_MAX_DAYS,
  /** Lazy read-time expiry only — no sweeper / production deletion jobs. */
  deletionJobs: false,
  liveModerationProvider: false,
  legalHoldInfra: false,
  youthCampfire: false,
  discretionaryArchive: false,
  reportPausesRetention: false,
  /** Activity / Squad / repost / Campfire link never resets clocks. */
  resetOn: "never" as const,
  /** G2 — rejoin is prospective only. */
  rejoinExposesHistory: false,
  /** G3 — no auto-promote on owner departure. */
  autoPromoteOwner: false,
} as const;

/**
 * Gates: G1–G3 product rules LOCKED (t1166u). Remaining = legal/infra activation.
 */
export type UnresolvedGate =
  | "day_sesh_media_deadline"
  | "rejoin_history"
  | "owner_leave_transfer"
  | "owner_account_deletion"
  | "legal_preservation_infra"
  | "live_moderation_provider"
  | "production_deletion_job"
  | "account_erasure_legal_confirm"
  | "sesh_animation_gb";

export const UNRESOLVED_GATES: Record<
  UnresolvedGate,
  { status: "disabled" | "unresolved" | "locked"; note: string }
> = {
  day_sesh_media_deadline: {
    status: "locked",
    note: "G1 LOCKED t1166u — Day Sesh media max 45d after official end; Campfire link never extends clock.",
  },
  rejoin_history: {
    status: "locked",
    note: "G2 LOCKED t1166u / AF-CF-35 — rejoin requires new approval; history not auto-exposed.",
  },
  owner_leave_transfer: {
    status: "locked",
    note: "G3 LOCKED t1166u / AF-CF-36 — nominate+accept only; else unresolved-owner; no auto-promote.",
  },
  owner_account_deletion: {
    status: "locked",
    note: "G3/G4 LOCKED t1166u / AF-CF-59 — owner may depart; unresolved-owner safe; no forced stay.",
  },
  legal_preservation_infra: {
    status: "disabled",
    note: "AF-CF-79 — type-only LegalPreservation; infra not activated.",
  },
  live_moderation_provider: {
    status: "disabled",
    note: "AF-CF-80 — STOMP moderation stub only; no live provider.",
  },
  production_deletion_job: {
    status: "disabled",
    note: "AF-CF-81 / G4 — logical revoke + soft hide only; no production purge job.",
  },
  account_erasure_legal_confirm: {
    status: "unresolved",
    note: "G4 — fictional logical revoke LOCKED; physical storage erasure schedules need tech+legal review before live.",
  },
  sesh_animation_gb: {
    status: "disabled",
    note: "AF-CF-51 — Sesh animation needs GB; bridge HELD.",
  },
};
