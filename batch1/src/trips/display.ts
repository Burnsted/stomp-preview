/**
 * Pure Trip Drop display helpers (t1143u T2).
 * Injected `nowIso` only — no live wall-clock reads or timers.
 */
import { compareIso, isAtOrAfter, isBefore } from "./clock.js";
import { findMembership, hasRiderAccessAt, isHostOrCohost } from "./eligibility.js";
import { hasActivePass } from "./pass.js";
import { renewalPromptForRider } from "./renewal.js";
import { mediaViewerDeadline, viewerDownloadDeadline } from "./retention.js";
import { formatInTimeZone } from "./timezone.js";
import { tryEditOfficialEndDate, tryReopenTrip } from "./transitions.js";
import type {
  PassEntitlement,
  StomperId,
  Trip,
  TripMembership,
} from "./types.js";

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
}

export interface ViewerDeadlineLabel {
  iso: string | null;
  authoritative: boolean;
  projected: boolean;
  label: string;
}

export type TripControl =
  | "extend"
  | "early_end"
  | "cancel"
  | "reopen"
  | "edit_official_end";

function shortDate(utcIso: string, timeZone: string): string {
  return formatInTimeZone(utcIso, timeZone, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: undefined,
    minute: undefined,
    hour12: undefined,
    timeZoneName: undefined,
  });
}

/** AF21 — active: "Ends … · finalizes automatically"; completed: "Completed · Official end …". */
export function tripEndLabel(trip: Trip, nowIso: string, timeZone?: string): string {
  const tz = timeZone ?? trip.timeZone;
  if (trip.status === "cancelled") {
    return "Cancelled";
  }
  if (trip.status === "completed" || trip.status === "retention-expired") {
    const end = trip.officialEndDate ?? trip.scheduledEndAt;
    return `Completed · Official end ${shortDate(end, tz)}`;
  }
  if (isAtOrAfter(nowIso, trip.scheduledEndAt)) {
    return `Completed · Official end ${shortDate(trip.scheduledEndAt, tz)}`;
  }
  return `Ends ${formatInTimeZone(trip.scheduledEndAt, tz)} · finalizes automatically`;
}

/** Pure countdown from nowIso → scheduledEndAt (or officialEndDate if finalized). */
export function countdownParts(trip: Trip, nowIso: string): CountdownParts {
  const target = trip.officialEndDate ?? trip.scheduledEndAt;
  const totalMs = Date.parse(target) - Date.parse(nowIso);
  const past = totalMs <= 0;
  const abs = Math.abs(totalMs);
  const seconds = Math.floor(abs / 1000) % 60;
  const minutes = Math.floor(abs / (1000 * 60)) % 60;
  const hours = Math.floor(abs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  return { totalMs, days, hours, minutes, seconds, past };
}

export function tripStatusLabel(trip: Trip, nowIso: string): string {
  if (trip.status === "cancelled") return "Cancelled";
  if (trip.status === "draft") return "Draft";
  if (trip.status === "scheduled") {
    return isAtOrAfter(nowIso, trip.startIso) ? "Active" : "Scheduled";
  }
  if (trip.status === "active") {
    if (isAtOrAfter(nowIso, trip.scheduledEndAt)) return "Completed";
    return "Active";
  }
  if (trip.status === "completed") return "Completed";
  if (trip.status === "retention-expired") return "Retention expired";
  return trip.status;
}

/** AF13 — human-readable extension history. */
export function extensionHistoryLabel(trip: Trip): string {
  if (trip.extensions.length === 0) return "No extensions";
  const parts = trip.extensions.map(
    (e, i) =>
      `#${i + 1}: ${e.previousEndAt} → ${e.revisedEndAt} by ${e.approverRole} ${e.approverStomperId}`,
  );
  return `Extensions (${trip.extensions.length}): ${parts.join("; ")}`;
}

/** AF14 — host/cohost only, before deadline, active trip. */
export function canShowExtendControl(
  trip: Trip,
  actorId: StomperId,
  memberships: TripMembership[],
  nowIso: string,
): boolean {
  if (trip.status !== "active") return false;
  if (isAtOrAfter(nowIso, trip.scheduledEndAt)) return false;
  const m = findMembership(memberships, trip.id, actorId);
  return isHostOrCohost(m);
}

/** AF18 — completed/cancelled trips expose no extend/reopen/edit controls. */
export function tripControls(trip: Trip): TripControl[] {
  if (trip.status === "completed" || trip.status === "retention-expired") {
    return [];
  }
  if (trip.status === "cancelled") {
    return [];
  }
  if (trip.status === "active") {
    return ["extend", "early_end"];
  }
  if (trip.status === "draft" || trip.status === "scheduled") {
    return ["cancel"];
  }
  return [];
}

/** AF15 — chip for rider grace / active / ended. */
export function riderStatusChip(
  membership: TripMembership,
  trip: Trip,
  passes: PassEntitlement[],
  nowIso: string,
): string {
  if (membership.role === "viewer") return "Viewer";
  if (!hasRiderAccessAt(membership, trip, passes, nowIso)) {
    if (
      membership.graceUntilAt &&
      isAtOrAfter(nowIso, membership.graceUntilAt) &&
      nowIso !== membership.graceUntilAt
    ) {
      return "Access ended";
    }
    return "Pass inactive";
  }
  if (
    membership.graceUntilAt &&
    (isBefore(nowIso, membership.graceUntilAt) || nowIso === membership.graceUntilAt) &&
    !hasActivePass(passes, membership.stomperId, nowIso)
  ) {
    return "Grace";
  }
  return "Rider";
}

/** AF16 — renewal required label when frozen participation trails scheduled end. */
export function renewalRequiredLabel(
  trip: Trip,
  membership: TripMembership,
  nowIso: string,
): string | null {
  void nowIso;
  const prompt = renewalPromptForRider(trip, membership);
  if (!prompt) return null;
  return "Renewal required for newly extended days";
}

/**
 * AF19 — Viewer deadline label.
 * Projected from scheduledEndAt (authoritative:false) until finalize;
 * then officialEndDate+45d (authoritative:true).
 */
export function viewerDeadlineLabel(trip: Trip): ViewerDeadlineLabel {
  const clock = viewerDownloadDeadline(trip);
  const media = mediaViewerDeadline(trip);
  const authoritative = !media.projected && media.deadlineIso != null;
  const iso = media.deadlineIso;
  if (trip.status === "cancelled") {
    return {
      iso: null,
      authoritative: false,
      projected: false,
      label: "Viewer deadline POLICY_UNRESOLVED (cancelled)",
    };
  }
  if (authoritative && iso) {
    return {
      iso,
      authoritative: true,
      projected: false,
      label: `Viewer download until ${iso}`,
    };
  }
  return {
    iso,
    authoritative: false,
    projected: true,
    label: iso
      ? `Projected Viewer deadline ${iso} (non-authoritative)`
      : "Projected Viewer deadline pending",
  };
}

/** Convenience: reopen/edit remain rejected after finalize (AF18 wiring). */
export function completedTripMutationLabels(trip: Trip): {
  reopen: string;
  editOfficialEnd: string;
  controls: TripControl[];
} {
  const reopen = tryReopenTrip(trip);
  const edit = tryEditOfficialEndDate(trip, trip.scheduledEndAt);
  return {
    reopen: reopen.ok ? "allowed" : "rejected",
    editOfficialEnd: edit.ok ? "allowed" : "rejected",
    controls: tripControls(trip),
  };
}

/** Ordering helper for tests — pure, no clock. */
export function compareDeadline(a: string, b: string): number {
  return compareIso(a, b);
}
