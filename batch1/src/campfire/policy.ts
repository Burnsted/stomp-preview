/**
 * Campfire CF-2 LOCKED policy constants (t1147u).
 * Source of truth: CF-DECISION-CLOSURE.md — fictional data only.
 * No production deletion jobs, no live moderation, no legal-hold infra.
 */

export const CAMPFIRE_TEXT_MAX_MONTHS = 12;
export const CAMPFIRE_MEDIA_MAX_DAYS = 90;
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
  /** Lazy read-time expiry only — no sweeper. */
  deletionJobs: false,
  liveModerationProvider: false,
  legalHoldInfra: false,
  youthCampfire: false,
  discretionaryArchive: false,
  reportPausesRetention: false,
  /** Activity / Squad / repost never resets clocks. */
  resetOn: "never" as const,
} as const;

/**
 * Gates that remain disabled / unresolved (do not invent final behavior).
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

export const UNRESOLVED_GATES: Record<UnresolvedGate, { status: "disabled" | "unresolved"; note: string }> = {
  day_sesh_media_deadline: {
    status: "unresolved",
    note: "G1 — Day Sesh media exact deletion deadline FLAGGED; use DEADLINE_UNSPECIFIED.",
  },
  rejoin_history: {
    status: "unresolved",
    note: "G2 / AF-CF-35 — historical access after rejoin not locked.",
  },
  owner_leave_transfer: {
    status: "unresolved",
    note: "G3 / AF-CF-36 — Squad owner leave / ownership transfer not locked.",
  },
  owner_account_deletion: {
    status: "unresolved",
    note: "G3 / AF-CF-59 — owner account deletion succession not locked.",
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
    note: "AF-CF-81 — expiry is soft hide at read; no purge job.",
  },
  account_erasure_legal_confirm: {
    status: "unresolved",
    note: "G4 — AF-CF-57 fictional sim ready; counsel confirm before live.",
  },
  sesh_animation_gb: {
    status: "disabled",
    note: "AF-CF-51 — Sesh animation needs GB; bridge HELD.",
  },
};
