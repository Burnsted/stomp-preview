/**
 * Day Sesh extensions — per-rider opt-in only (supersedes AF10 "no extension").
 * Defaults (Ted provisional technical): propose before sesh end; respond before
 * own participation end; max +24h per extension; no count cap; active Pass required.
 */
import { addUtcHours, isAtOrAfter, isBefore } from "../trips/clock.js";
import { hasActivePass } from "../trips/pass.js";
import type { PassEntitlement, StomperId } from "../trips/types.js";
import { daySeshStatusAt, daySeshWithDerivedStatus } from "./lifecycle.js";
import type {
  DaySesh,
  DaySeshExtensionId,
  DaySeshExtensionOffer,
  DaySeshExtensionResponse,
  GuardResult,
} from "./types.js";

const MAX_EXTENSION_HOURS = 24;

export interface OfferDaySeshExtensionInput {
  sesh: DaySesh;
  offerId: DaySeshExtensionId;
  proposedEndsAt: string;
  offeredAt: string;
  /** Defaults to current sesh activeEndsAt (must be ≤ each rider's participation end). */
  respondBy?: string;
  actorId: StomperId;
  passes: PassEntitlement[];
}

/** Propose extension before current Day Sesh end; ≤ +24h from current activeEndsAt. */
export function offerDaySeshExtension(
  input: OfferDaySeshExtensionInput,
): GuardResult<{ sesh: DaySesh; offer: DaySeshExtensionOffer }> {
  const { sesh, offerId, proposedEndsAt, offeredAt, actorId, passes } = input;
  const status = daySeshStatusAt(sesh, offeredAt);
  if (status === "closed" || status === "expired") {
    return { ok: false, reason: "day_sesh_expired" };
  }
  if (status === "planned") {
    return {
      ok: false,
      reason: "trip_not_active",
      message: "Extensions only while Day Sesh is active",
    };
  }
  // Must propose before current Day Sesh end
  if (isAtOrAfter(offeredAt, sesh.activeEndsAt) && offeredAt !== sesh.activeEndsAt) {
    return { ok: false, reason: "after_deadline", message: "Extension must be proposed before current end" };
  }
  if (!(actorId === sesh.hostStomperId)) {
    // Host proposes (provisional); co-host role not modeled on Day Sesh
    const hostOk = sesh.participants.some((p) => p.stomperId === actorId);
    if (!hostOk || actorId !== sesh.hostStomperId) {
      return { ok: false, reason: "not_host_or_cohost", message: "Only host may propose Day Sesh extension" };
    }
  }
  if (!hasActivePass(passes, actorId, offeredAt)) {
    return { ok: false, reason: "approver_pass_inactive" };
  }
  const maxEnd = addUtcHours(sesh.activeEndsAt, MAX_EXTENSION_HOURS);
  if (Date.parse(proposedEndsAt) <= Date.parse(sesh.activeEndsAt)) {
    return { ok: false, reason: "revised_end_not_after_previous" };
  }
  if (Date.parse(proposedEndsAt) > Date.parse(maxEnd)) {
    return {
      ok: false,
      reason: "after_deadline",
      message: `Maximum ${MAX_EXTENSION_HOURS}h per Day Sesh extension`,
    };
  }
  const respondBy = input.respondBy ?? sesh.activeEndsAt;
  const offer: DaySeshExtensionOffer = {
    id: offerId,
    proposedEndsAt,
    offeredAt,
    respondBy,
    responses: {},
  };
  const next: DaySesh = {
    ...sesh,
    extensions: [...sesh.extensions, offer],
  };
  return { ok: true, value: { sesh: daySeshWithDerivedStatus(next, offeredAt), offer } };
}

export function respondToExtension(args: {
  sesh: DaySesh;
  offerId: DaySeshExtensionId;
  stomperId: StomperId;
  response: DaySeshExtensionResponse;
  atIso: string;
}): GuardResult<DaySesh> {
  const { sesh, offerId, stomperId, response, atIso } = args;
  const offer = sesh.extensions.find((e) => e.id === offerId);
  if (!offer) {
    return { ok: false, reason: "extension_fields_incomplete", message: "Unknown extension offer" };
  }
  if (offer.resolvedAt) {
    return { ok: false, reason: "after_deadline", message: "Extension already resolved" };
  }
  const participant = sesh.participants.find((p) => p.stomperId === stomperId);
  if (!participant) {
    return { ok: false, reason: "role_cannot_join", message: "Not a Day Sesh participant" };
  }
  // Must respond before own participation end AND before respondBy
  if (isAtOrAfter(atIso, participant.participationEndsAt) && atIso !== participant.participationEndsAt) {
    return { ok: false, reason: "participation_ended" };
  }
  if (isAtOrAfter(atIso, offer.respondBy) && atIso !== offer.respondBy) {
    return { ok: false, reason: "after_deadline", message: "respondBy passed" };
  }
  const nextOffer: DaySeshExtensionOffer = {
    ...offer,
    responses: { ...offer.responses, [stomperId]: response },
  };
  return {
    ok: true,
    value: {
      ...sesh,
      extensions: sesh.extensions.map((e) => (e.id === offerId ? nextOffer : e)),
    },
  };
}

/**
 * Resolve extension: opt_in + active Pass → new participationEndsAt;
 * decline / nonresponse / expired Pass → prior window retained.
 */
export function resolveExtension(args: {
  sesh: DaySesh;
  offerId: DaySeshExtensionId;
  passes: PassEntitlement[];
  nowIso: string;
}): GuardResult<DaySesh> {
  const { sesh, offerId, passes, nowIso } = args;
  const offer = sesh.extensions.find((e) => e.id === offerId);
  if (!offer) {
    return { ok: false, reason: "extension_fields_incomplete", message: "Unknown extension offer" };
  }
  if (offer.resolvedAt) {
    return { ok: true, value: sesh };
  }
  let anyExtended = false;
  const participants = sesh.participants.map((p) => {
    const resp = offer.responses[p.stomperId];
    if (resp !== "opt_in") {
      // decline or nonresponder → keep previous window
      return p;
    }
    if (!hasActivePass(passes, p.stomperId, nowIso)) {
      // opt-in but Pass expired at resolve → not extended
      return p;
    }
    anyExtended = true;
    return { ...p, participationEndsAt: offer.proposedEndsAt };
  });
  const activeEndsAt = anyExtended
    ? offer.proposedEndsAt > sesh.activeEndsAt
      ? offer.proposedEndsAt
      : sesh.activeEndsAt
    : sesh.activeEndsAt;
  const nextOffer: DaySeshExtensionOffer = { ...offer, resolvedAt: nowIso };
  const next: DaySesh = {
    ...sesh,
    participants,
    activeEndsAt,
    extensions: sesh.extensions.map((e) => (e.id === offerId ? nextOffer : e)),
  };
  return { ok: true, value: daySeshWithDerivedStatus(next, nowIso) };
}

/** True when rider's current end equals a resolved offer they opted into. */
export function participationEndFromOffer(
  sesh: DaySesh,
  stomperId: StomperId,
  offerId: DaySeshExtensionId,
): boolean {
  const p = sesh.participants.find((x) => x.stomperId === stomperId);
  const offer = sesh.extensions.find((e) => e.id === offerId);
  if (!p || !offer) return false;
  return offer.responses[stomperId] === "opt_in" && p.participationEndsAt === offer.proposedEndsAt;
}
