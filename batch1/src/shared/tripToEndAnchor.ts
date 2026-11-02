/**
 * A2 — Map #13 Trip → #14 TripEndAnchor.
 * completed → ended; draft / retention-expired explicit (not silently mapped).
 */
import { err, ok, type Result } from "../core/result.js";
import type { Trip } from "../trips/types.js";
import type { TripEndAnchor, TripId } from "../campfire/trip-shim.js";

export type TripAnchorDeny =
  | "draft_not_anchored"
  | "retention_expired_anchor";

export type TripEndAnchorMapped = TripEndAnchor & {
  /** Present when #13 status was retention-expired (anchor still ended). */
  retentionExpired?: true;
  /** #13 startIso carried for cancelled-media anchor parity with trips retention. */
  startIso?: string;
};

/**
 * Convert authoritative Trip Drop into Campfire trip-shim anchor.
 * - draft → err (not anchored)
 * - retention-expired → ok ended + retentionExpired flag (expired anchor)
 * - completed → ended
 * - scheduled | active | cancelled → same vocabulary
 */
export function tripToEndAnchor(
  trip: Trip,
): Result<TripEndAnchorMapped, TripAnchorDeny> {
  if (trip.status === "draft") {
    return err("draft_not_anchored", "Draft trips have no media end anchor");
  }

  const base: TripEndAnchorMapped = {
    id: trip.id as unknown as TripId,
    officialEndDate: trip.officialEndDate,
    scheduledEndAt: trip.scheduledEndAt,
    cancelledAt: trip.cancelledAt ?? null,
    startIso: trip.startIso,
    status: "ended",
  };

  if (trip.status === "retention-expired") {
    return ok({
      ...base,
      status: "ended",
      retentionExpired: true,
    });
  }

  if (trip.status === "completed") {
    return ok({ ...base, status: "ended" });
  }
  if (trip.status === "scheduled") {
    return ok({ ...base, status: "scheduled" });
  }
  if (trip.status === "active") {
    return ok({ ...base, status: "active" });
  }
  // cancelled
  return ok({ ...base, status: "cancelled" });
}
