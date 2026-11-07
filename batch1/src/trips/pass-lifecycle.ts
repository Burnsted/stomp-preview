/**
 * Pass access lifecycle — FICTIONAL / DEMO ONLY (t1208u D2).
 *
 * State machine (account / Pass access):
 *   Active → Expired/locked → Export-only (12mo) → Deletion lifecycle
 *
 * - No immediate delete on expiry.
 * - Deletion jobs remain OFF (warnings / clocks only).
 * - Renewal restores Active going forward; does NOT silently restore purged history.
 * - Fictional Pass states are NOT real entitlements / payments.
 * - G1 Day Sesh media ≤45d stays separate (DAY_SESH_MEDIA_MAX_DAYS).
 */

import { addUtcMonths, isAtOrAfter, isBefore } from "./clock.js";
import { getPolicyStub } from "./policy.js";
import {
  PASS_EXPORT_ONLY_MONTHS,
  passExportOnlyClock,
} from "./retention.js";
import type { RetentionClock, StomperId } from "./types.js";

export type PassAccessState =
  | "active"
  | "expired_locked"
  | "export_only"
  | "deletion_lifecycle";

export const PASS_LIFECYCLE_POLICY = {
  exportOnlyMonths: PASS_EXPORT_ONLY_MONTHS,
  deletionJobsEnabled: false as const,
  fictionalOnly: true as const,
  /** Product meaning of prior 6mo Rider Archive is SUPERSEDED (D2). */
  supersededArchiveMonths: 6 as const,
} as const;

export type PassLifecycleInput = {
  stomperId: StomperId | string;
  /** Latest Pass end ISO (when Pass became/becomes invalid). Null = never had Pass / still active if end in future. */
  passEndIso: string | null;
  /** Injected "now" — no live wall clock. */
  nowIso: string;
  /**
   * Content already purged under deletion lifecycle.
   * Renewal must NOT resurrect these ids.
   */
  purgedHistoryIds?: readonly string[];
  /**
   * Demo/UI: once true, Expired/locked advances to Export-only surface
   * (same 12mo window privileges — Report Card + export). Default false →
   * first post-expiry resolve returns expired_locked; call enterExportOnly().
   */
  exportOnlyEntered?: boolean;
};

export type PassLifecycleSnapshot = {
  state: PassAccessState;
  passEndIso: string | null;
  exportOnlyDeadlineIso: string | null;
  /** Full profile/history browse — Active only. */
  canBrowseFullHistory: boolean;
  /** Join / host / post as Rider — Active only. */
  canJoinOrPostAsRider: boolean;
  /** Personal Report Card + export/offload — Active or within 12mo export window. */
  canAccessReportCardExport: boolean;
  profileLocked: boolean;
  deletionJobs: { enabled: false; reason: "POLICY_UNRESOLVED" | "OFF_UNTIL_OWNER_GO" };
  notice: string;
  exportClock: RetentionClock | null;
};

function deletionOff(): PassLifecycleSnapshot["deletionJobs"] {
  const stub = getPolicyStub("deletion_retention_jobs");
  return {
    enabled: false,
    reason: stub.interfaceDisabled ? "OFF_UNTIL_OWNER_GO" : "POLICY_UNRESOLVED",
  };
}

function lockedExportSnapshot(
  state: "expired_locked" | "export_only",
  passEndIso: string,
  exportClock: RetentionClock,
  jobs: PassLifecycleSnapshot["deletionJobs"],
): PassLifecycleSnapshot {
  return {
    state,
    passEndIso,
    exportOnlyDeadlineIso: exportClock.deadlineIso,
    canBrowseFullHistory: false,
    canJoinOrPostAsRider: false,
    canAccessReportCardExport: true,
    profileLocked: true,
    deletionJobs: jobs,
    notice:
      state === "expired_locked"
        ? "Pass expired — full profile/history locked. Report Card + export still available (fictional)."
        : "Export-only window (12 calendar months). Report Card + export; no full-history browse or new Rider participation (fictional).",
    exportClock,
  };
}

/**
 * Resolve Pass access state at `nowIso`.
 * Export-only window = [passEnd, passEnd + PASS_EXPORT_ONLY_MONTHS).
 * After that window → deletion_lifecycle (warnings only; jobs OFF).
 */
export function resolvePassAccess(input: PassLifecycleInput): PassLifecycleSnapshot {
  const { stomperId, passEndIso, nowIso } = input;
  const jobs = deletionOff();

  if (!passEndIso || isBefore(nowIso, passEndIso)) {
    return {
      state: "active",
      passEndIso,
      exportOnlyDeadlineIso: passEndIso
        ? addUtcMonths(passEndIso, PASS_EXPORT_ONLY_MONTHS)
        : null,
      canBrowseFullHistory: true,
      canJoinOrPostAsRider: true,
      canAccessReportCardExport: true,
      profileLocked: false,
      deletionJobs: jobs,
      notice: "Active Pass — full authorized STOMPER access (fictional).",
      exportClock: null,
    };
  }

  const exportClock = passExportOnlyClock(stomperId as StomperId, passEndIso);
  const exportDeadline = exportClock.deadlineIso;

  if (exportDeadline && isBefore(nowIso, exportDeadline)) {
    const state: "expired_locked" | "export_only" = input.exportOnlyEntered
      ? "export_only"
      : "expired_locked";
    return lockedExportSnapshot(state, passEndIso, exportClock, jobs);
  }

  return {
    state: "deletion_lifecycle",
    passEndIso,
    exportOnlyDeadlineIso: exportDeadline,
    canBrowseFullHistory: false,
    canJoinOrPostAsRider: false,
    canAccessReportCardExport: false,
    profileLocked: true,
    deletionJobs: jobs,
    notice:
      "Export-only window ended — deletion lifecycle warnings only. Physical deletion jobs OFF until separate owner Go.",
    exportClock,
  };
}

/** Advance Expired/locked → Export-only within the same 12mo window (demo/UI). */
export function enterExportOnly(input: PassLifecycleInput): PassLifecycleSnapshot {
  return resolvePassAccess({ ...input, exportOnlyEntered: true });
}

/**
 * Renewal restores Active going forward.
 * Does NOT silently restore purged history ids.
 */
export function renewPassAccess(args: {
  stomperId: StomperId | string;
  newPassEndIso: string;
  nowIso: string;
  purgedHistoryIds?: readonly string[];
}): {
  access: PassLifecycleSnapshot;
  restoredHistoryIds: readonly string[];
  stillPurgedIds: readonly string[];
  exportClockAfterFutureExpiry: RetentionClock;
} {
  const purged = [...(args.purgedHistoryIds ?? [])];
  const access = resolvePassAccess({
    stomperId: args.stomperId,
    passEndIso: args.newPassEndIso,
    nowIso: args.nowIso,
    purgedHistoryIds: purged,
  });
  // Sanity: renewal while still before new end must be Active.
  if (!isAtOrAfter(args.nowIso, args.newPassEndIso) && access.state !== "active") {
    // Defensive — resolvePassAccess should already return active.
  }
  return {
    access: {
      ...access,
      state: "active",
      canBrowseFullHistory: true,
      canJoinOrPostAsRider: true,
      canAccessReportCardExport: true,
      profileLocked: false,
      notice:
        "Renewal restores Active going forward. Previously purged history stays purged (D2).",
    },
    restoredHistoryIds: [],
    stillPurgedIds: purged,
    exportClockAfterFutureExpiry: passExportOnlyClock(
      args.stomperId as StomperId,
      args.newPassEndIso,
    ),
  };
}

/** Personal Report Card / export gate after Pass expiry (still in export-only window). */
export function canAccessReportCard(input: PassLifecycleInput): boolean {
  return resolvePassAccess(input).canAccessReportCardExport;
}
