import { addUtcDays, addUtcMonths, isAtOrAfter } from "./clock.js";
import { getPolicyStub } from "./policy.js";
import type {
  RetentionClock,
  RetentionKind,
  StomperId,
  Trip,
  TripId,
} from "./types.js";

export const VIEWER_MEDIA_MAX_DAYS = 45;
export const RIDER_ARCHIVE_MONTHS = 6;
export const VIEWER_ONLY_MONTHS = 12;

/**
 * Viewer download + media delete from officialEndDate + ≤45d [LOCKED].
 * Before finalize: projected from scheduledEndAt (non-authoritative).
 * Cancelled: POLICY_UNRESOLVED (officialEndDate null — F1).
 */
export function mediaViewerDeadline(trip: Trip): RetentionClock {
  if (trip.status === "cancelled") {
    const stub = getPolicyStub("cancelled_trip_media_viewer_retention");
    return {
      tripId: trip.id,
      kind: "media_45d",
      anchorIso: trip.cancelledAt ?? trip.startIso,
      deadlineIso: null,
      policyUnresolved: stub.why,
    };
  }
  if (trip.officialEndDate) {
    return {
      tripId: trip.id,
      kind: "media_45d",
      anchorIso: trip.officialEndDate,
      deadlineIso: addUtcDays(trip.officialEndDate, VIEWER_MEDIA_MAX_DAYS),
      projected: false,
    };
  }
  return {
    tripId: trip.id,
    kind: "media_45d",
    anchorIso: trip.scheduledEndAt,
    deadlineIso: addUtcDays(trip.scheduledEndAt, VIEWER_MEDIA_MAX_DAYS),
    projected: true,
  };
}

export function viewerDownloadDeadline(trip: Trip): RetentionClock {
  const base = mediaViewerDeadline(trip);
  return { ...base, kind: "viewer_download_45d" };
}

/** Rider Archive 6mo from actual Pass end — never from trip end [LOCKED]. */
export function riderArchiveClock(
  stomperId: StomperId,
  passEndIso: string,
): RetentionClock {
  return {
    stomperId,
    kind: "pass_archive_6mo",
    anchorIso: passEndIso,
    deadlineIso: addUtcMonths(passEndIso, RIDER_ARCHIVE_MONTHS),
  };
}

/**
 * On renewal: archive clock restarts at new Pass end [RECOMMENDED / accepted default].
 * Prior window record is not rewritten elsewhere; this returns the new clock.
 */
export function restartArchiveOnRenewal(
  stomperId: StomperId,
  newPassEndIso: string,
): RetentionClock {
  return riderArchiveClock(stomperId, newPassEndIso);
}

/** Viewer-only account 12-month retention — independent of trip 45d download. */
export function viewerOnlyAccountClock(
  stomperId: StomperId,
  anchorIso: string,
): RetentionClock {
  return {
    stomperId,
    kind: "viewer_only_12mo",
    anchorIso,
    deadlineIso: addUtcMonths(anchorIso, VIEWER_ONLY_MONTHS),
  };
}

/** never-Rider clock stub — independent; no invented purge. */
export function neverRiderClock(
  stomperId: StomperId,
  anchorIso: string,
): RetentionClock {
  return {
    stomperId,
    kind: "never_rider",
    anchorIso,
    deadlineIso: addUtcMonths(anchorIso, VIEWER_ONLY_MONTHS),
  };
}

/** Founder clock stub — independent of other clocks. */
export function founderClock(
  stomperId: StomperId,
  anchorIso: string,
): RetentionClock {
  return {
    stomperId,
    kind: "founder",
    anchorIso,
    // Founder retention policy not specified — stub with null deadline + marker
    deadlineIso: null,
    policyUnresolved: "Founder retention duration not owner-specified; stub only.",
  };
}

/**
 * Simulate "media deleted at deadline" without running a deletion job.
 * Trip history (officialEndDate, extensions[]) remains readable.
 */
export function markMediaDeletedAtDeadline(
  trip: Trip,
  atIso: string,
): {
  mediaDeleted: boolean;
  historyIntact: true;
  officialEndDate: string | null;
  extensions: Trip["extensions"];
  deletionJob: { enabled: false; reason: "POLICY_UNRESOLVED" };
} {
  const clock = mediaViewerDeadline(trip);
  const due =
    clock.deadlineIso != null && isAtOrAfter(atIso, clock.deadlineIso);
  return {
    mediaDeleted: due,
    historyIntact: true,
    officialEndDate: trip.officialEndDate,
    extensions: trip.extensions,
    deletionJob: {
      enabled: false,
      reason: "POLICY_UNRESOLVED",
    },
  };
}

export function clocksIndependent(
  clocks: RetentionClock[],
): boolean {
  // Sanity: each kind+subject pair has its own anchor; mutating one object
  // must not share references — callers should structuredClone fixtures.
  const keys = new Set<string>();
  for (const c of clocks) {
    const key = `${c.kind}:${c.stomperId ?? ""}:${c.tripId ?? ""}`;
    if (keys.has(key)) return false;
    keys.add(key);
  }
  return true;
}

export function retentionKinds(): RetentionKind[] {
  return [
    "media_45d",
    "viewer_download_45d",
    "viewer_only_12mo",
    "pass_archive_6mo",
    "never_rider",
    "founder",
  ];
}

export function tripHistoryReadableAfterMediaDelete(trip: Trip): {
  id: TripId;
  officialEndDate: string | null;
  extensions: Trip["extensions"];
  status: Trip["status"];
} {
  return {
    id: trip.id,
    officialEndDate: trip.officialEndDate,
    extensions: [...trip.extensions],
    status: trip.status,
  };
}
