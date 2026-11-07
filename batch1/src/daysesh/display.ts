/**
 * Pure Day Sesh display helpers (t1143u T2).
 * Injected nowIso only — no live wall-clock reads or timers.
 */
import { isAtOrAfter, isBefore } from "../trips/clock.js";
import { formatInTimeZone } from "../trips/timezone.js";
import { daySeshStatusAt } from "./lifecycle.js";
import type {
  DaySesh,
  DaySeshExtensionOffer,
  DaySeshParticipant,
  StomperId,
} from "./types.js";

export function daySeshStatusLabel(sesh: DaySesh, nowIso: string, timeZone?: string): string {
  const tz = timeZone ?? sesh.timeZone;
  const status = daySeshStatusAt(sesh, nowIso);
  if (status === "planned") {
    return `Planned · starts ${formatInTimeZone(sesh.scheduledStartAt, tz)}`;
  }
  if (status === "active") {
    return `Active · ends ${formatInTimeZone(sesh.activeEndsAt, tz)}`;
  }
  if (status === "closed") return "Closed";
  return "Expired";
}

export function daySeshParticipationLabel(participant: DaySeshParticipant, nowIso: string): string {
  if (isAtOrAfter(nowIso, participant.participationEndsAt) && nowIso !== participant.participationEndsAt) {
    return `Ended ${participant.participationEndsAt}`;
  }
  const source =
    participant.source === "temporary_friend" ? "temporary friend" : "squad";
  return `Participating until ${participant.participationEndsAt} (${source})`;
}

export function extensionPromptLabel(
  offer: DaySeshExtensionOffer,
  riderId: StomperId,
): string {
  const resp = offer.responses[riderId];
  if (resp === "opt_in") {
    return `Opted in · new end ${offer.proposedEndsAt}`;
  }
  if (resp === "decline") {
    return "Declined · prior window retained";
  }
  if (offer.resolvedAt) {
    return "No response · prior window retained";
  }
  return `Extension offered until ${offer.proposedEndsAt} · respond by ${offer.respondBy}`;
}

/** Denial label for Viewer-only / expired-Pass / in-grace accounts. */
export function daySeshDenialLabel(): string {
  return "Rider Pass required";
}

export function daySeshParticipationEndsBefore(
  participant: DaySeshParticipant,
  atIso: string,
): boolean {
  return isBefore(atIso, participant.participationEndsAt) || atIso === participant.participationEndsAt;
}
