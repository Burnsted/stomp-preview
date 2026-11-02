import { isBefore } from "./clock.js";
import {
  disabledPurchaseInterface,
  type DisabledPurchaseInterface,
} from "./policy.js";
import type { Trip, TripMembership } from "./types.js";

export interface RenewalPrompt {
  shown: boolean;
  optional: true;
  /** Never triggers purchase. */
  purchaseTriggered: false;
  /** Rider is never auto-converted to Viewer. */
  convertedToViewer: false;
  /** Prior grace window stays intact. */
  graceIntact: boolean;
  graceUntilAt?: string;
  priorGraceWindow?: TripMembership["priorGraceWindow"];
  participationEndsAt: string;
  tripScheduledEndAt: string;
  /** Disabled purchase interface — price/duration POLICY_UNRESOLVED. */
  purchase: DisabledPurchaseInterface;
  message: string;
}

/**
 * Mid-trip renewal UX (D8): optional renewal prompt when a later extension
 * added days beyond the rider's frozen participationEndsAt.
 * No auto-buy, no Viewer conversion, grace never lost.
 */
export function renewalPromptForRider(
  trip: Trip,
  membership: TripMembership,
): RenewalPrompt | null {
  if (membership.role === "viewer") return null;
  if (trip.status !== "active") return null;

  const needsRenewal =
    !!membership.graceUntilAt &&
    isBefore(membership.participationEndsAt, trip.scheduledEndAt);

  if (!needsRenewal) return null;

  return {
    shown: true,
    optional: true,
    purchaseTriggered: false,
    convertedToViewer: false,
    graceIntact: true,
    graceUntilAt: membership.graceUntilAt,
    priorGraceWindow: membership.priorGraceWindow,
    participationEndsAt: membership.participationEndsAt,
    tripScheduledEndAt: trip.scheduledEndAt,
    purchase: disabledPurchaseInterface("renewal_purchase_price_duration"),
    message:
      "Optional renewal for newly added trip days. Prior grace window intact. No purchase in this batch.",
  };
}

/** Declining the prompt → access ends at participationEndsAt (no side effects). */
export function declineRenewalPrompt(prompt: RenewalPrompt): {
  accessEndsAt: string;
  purchaseTriggered: false;
  convertedToViewer: false;
  graceIntact: true;
} {
  return {
    accessEndsAt: prompt.participationEndsAt,
    purchaseTriggered: false,
    convertedToViewer: false,
    graceIntact: true,
  };
}
