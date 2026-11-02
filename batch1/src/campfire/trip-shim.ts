/**
 * Read-only trip media deadline shim for Campfire CF-2.
 * Mirrors PR #13 `VIEWER_MEDIA_MAX_DAYS` / `mediaViewerDeadline` contract
 * WITHOUT importing or editing trips/* (PR #13 is unmerged / protected).
 * Fictional data only — no deletion jobs.
 */

export const VIEWER_MEDIA_MAX_DAYS = 45;

export type TripId = string & { readonly __brand: "TripId" };

export interface TripEndAnchor {
  id: TripId;
  status: "scheduled" | "active" | "ended" | "cancelled";
  officialEndDate: string | null;
  scheduledEndAt: string;
  cancelledAt?: string | null;
}

export interface TripMediaDeadline {
  tripId: TripId;
  kind: "media_45d";
  anchorIso: string;
  deadlineIso: string | null;
  projected?: boolean;
  policyUnresolved?: string;
}

/** UTC day add — pure, no TZ libs. */
export function addUtcDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function addUtcMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/**
 * Viewer / Campfire trip-drop media deadline from officialEndDate + ≤45d.
 * Cancelled trips: unresolved (null deadline). Before finalize: projected.
 */
export function mediaViewerDeadline(trip: TripEndAnchor): TripMediaDeadline {
  if (trip.status === "cancelled") {
    return {
      tripId: trip.id,
      kind: "media_45d",
      anchorIso: trip.cancelledAt ?? trip.scheduledEndAt,
      deadlineIso: null,
      policyUnresolved: "cancelled_trip_media_viewer_retention",
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

/** Extend official end — MediaRef deadline recomputed from Trip only; never via share. */
export function withOfficialEndDate(
  trip: TripEndAnchor,
  officialEndDate: string,
): TripEndAnchor {
  return { ...trip, status: "ended", officialEndDate };
}
