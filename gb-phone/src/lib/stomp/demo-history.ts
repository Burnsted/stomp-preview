/**
 * Demo saved-history helpers for 90-day welcome-back — FICTIONAL ONLY.
 * Uses in-memory / localStorage demo keys; never invents accomplishments.
 */

import type { SavedDemoHistory } from "@/lib/stomp/pass-lifecycle-demo";
import type { SocialState } from "@/lib/stomp/social";

export const DEMO_LAST_ACTIVE_KEY = "stomp.demo.lastActiveIso";

export function readDemoLastActive(storage?: Storage | null): string | null {
  try {
    const store =
      storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    return store?.getItem(DEMO_LAST_ACTIVE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeDemoLastActive(iso: string, storage?: Storage | null): void {
  try {
    const store =
      storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    store?.setItem(DEMO_LAST_ACTIVE_KEY, iso);
  } catch {
    /* demo only */
  }
}

/** Build welcome-back seed from actual RiderHub social demo state + optional last-active. */
export function savedHistoryFromSocial(
  social: SocialState,
  lastActiveIso: string | null,
): SavedDemoHistory {
  return {
    lastActiveIso,
    lastEligibleTripLabel: social.trip.joined ? social.trip.name : null,
    workingOnTricks: social.history
      .filter((h) => h.source === "self")
      .map((h) => h.label),
    stompedTricks: social.history
      .filter((h) => h.source === "confirmed")
      .map((h) => h.label),
    savedBoardLabels: [],
    avatarDisplayName: social.avatar?.name ?? null,
    upcomingTripDropInvites: social.trip.invited && !social.trip.joined ? [social.trip.name] : [],
    reportCardAvailable: social.history.length > 0,
  };
}
