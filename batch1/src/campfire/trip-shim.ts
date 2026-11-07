/**
 * Read-only trip media deadline shim for Campfire CF-2.
 * A3 (t1152u): #13 trips retention/clock is the single source of truth.
 * Signature kept (TripEndAnchor → TripMediaDeadline); UTC-only duplicate removed.
 * Fictional data only — no deletion jobs.
 */

import {
  VIEWER_MEDIA_MAX_DAYS as TRIPS_VIEWER_MEDIA_MAX_DAYS,
  mediaViewerDeadline as tripsMediaViewerDeadline,
  addUtcDays as tripsAddUtcDays,
  addUtcMonths as tripsAddUtcMonths,
} from "../trips/index.js";
import type { Trip, TripStatus } from "../trips/types.js";

/** Re-export authoritative constant from #13 trips retention. */
export const VIEWER_MEDIA_MAX_DAYS = TRIPS_VIEWER_MEDIA_MAX_DAYS;

export type TripId = string & { readonly __brand: "TripId" };

export interface TripEndAnchor {
  id: TripId;
  status: "scheduled" | "active" | "ended" | "cancelled";
  officialEndDate: string | null;
  scheduledEndAt: string;
  cancelledAt?: string | null;
  /** Optional #13 startIso for cancelled-media anchor parity. */
  startIso?: string | null;
}

export interface TripMediaDeadline {
  tripId: TripId;
  kind: "media_45d";
  anchorIso: string;
  deadlineIso: string | null;
  projected?: boolean;
  policyUnresolved?: string;
}

/** Re-export #13 clock arithmetic (kills shim-local UTC duplicate as SoT). */
export const addUtcDays = tripsAddUtcDays;
export const addUtcMonths = tripsAddUtcMonths;

function endAnchorStatusToTripStatus(
  status: TripEndAnchor["status"],
): TripStatus {
  if (status === "ended") return "completed";
  return status;
}

/** Minimal Trip facade so #13 mediaViewerDeadline is the SoT. */
function endAnchorToTripFacade(trip: TripEndAnchor): Trip {
  return {
    id: trip.id as unknown as Trip["id"],
    name: "",
    kind: "trip",
    timeZone: "UTC",
    startIso: trip.startIso ?? trip.cancelledAt ?? trip.scheduledEndAt,
    originalEndAt: trip.scheduledEndAt,
    scheduledEndAt: trip.scheduledEndAt,
    officialEndDate: trip.officialEndDate,
    extensions: [],
    hostId: "" as Trip["hostId"],
    status: endAnchorStatusToTripStatus(trip.status),
    adminCorrections: [],
    entitlementOk: true,
    cancelledAt: trip.cancelledAt ?? undefined,
  };
}

/**
 * Viewer / Campfire trip-drop media deadline — delegates to #13 retention.
 * Cancelled trips: unresolved (null deadline). Before finalize: projected.
 */
export function mediaViewerDeadline(trip: TripEndAnchor): TripMediaDeadline {
  const clock = tripsMediaViewerDeadline(endAnchorToTripFacade(trip));
  return {
    tripId: trip.id,
    kind: "media_45d",
    anchorIso: clock.anchorIso,
    deadlineIso: clock.deadlineIso,
    projected: clock.projected,
    policyUnresolved: clock.policyUnresolved,
  };
}

/** Extend official end — MediaRef deadline recomputed from Trip only; never via share. */
export function withOfficialEndDate(
  trip: TripEndAnchor,
  officialEndDate: string,
): TripEndAnchor {
  return { ...trip, status: "ended", officialEndDate };
}
