/**
 * Trip Drop visual states — FICTIONAL / DEMO ONLY (t1208u).
 * Countdown | Today's Drop | Replay — pure helpers; inject nowIso.
 */

import { countdownParts, tripStatusLabel } from "./display.js";
import { isAtOrAfter, isBefore } from "./clock.js";
import type { Trip } from "./types.js";

export type TripDropVisualState = "countdown" | "todays_drop" | "replay";

export type TripDropVisual = {
  state: TripDropVisualState;
  label: string;
  statusLabel: string;
  countdown: ReturnType<typeof countdownParts>;
  reportCardEligible: boolean;
  note: string;
};

/**
 * Map trip + now → visual state.
 * - Countdown: scheduled / active before start day end window
 * - Today's Drop: active and within start→scheduledEnd
 * - Replay: completed / retention-expired / past scheduled end
 */
export function resolveTripDropVisual(trip: Trip, nowIso: string): TripDropVisual {
  const countdown = countdownParts(trip, nowIso);
  const statusLabel = tripStatusLabel(trip, nowIso);

  if (
    trip.status === "completed" ||
    trip.status === "retention-expired" ||
    trip.status === "cancelled" ||
    (trip.officialEndDate != null && isAtOrAfter(nowIso, trip.officialEndDate)) ||
    ((trip.status === "active" || trip.status === "scheduled") &&
      isAtOrAfter(nowIso, trip.scheduledEndAt))
  ) {
    return {
      state: "replay",
      label: "Replay",
      statusLabel,
      countdown,
      reportCardEligible: trip.status !== "cancelled",
      note: "Replay — personal Report Card available when Pass export rules allow (fictional).",
    };
  }

  // Before start → Countdown (even if status already flipped to active in fixtures).
  if (isBefore(nowIso, trip.startIso)) {
    return {
      state: "countdown",
      label: "Countdown",
      statusLabel,
      countdown,
      reportCardEligible: false,
      note: "Countdown — Trip Drop not started yet (fictional demo).",
    };
  }

  if (
    (trip.status === "active" || trip.status === "scheduled") &&
    isAtOrAfter(nowIso, trip.startIso) &&
    isBefore(nowIso, trip.scheduledEndAt)
  ) {
    return {
      state: "todays_drop",
      label: "Today's Drop",
      statusLabel,
      countdown,
      reportCardEligible: false,
      note: "Today's Drop — live Trip Drop window (fictional demo).",
    };
  }

  return {
    state: "countdown",
    label: "Countdown",
    statusLabel,
    countdown,
    reportCardEligible: false,
    note: "Countdown — Trip Drop not started yet (fictional demo).",
  };
}
