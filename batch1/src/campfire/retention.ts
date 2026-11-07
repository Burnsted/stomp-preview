/**
 * Campfire CF-2 retention — lazy read-time expiry (no deletion jobs).
 */
import {
  CAMPFIRE_MEDIA_MAX_DAYS,
  CAMPFIRE_TEXT_MAX_MONTHS,
  CAMPFIRE_POLICY,
  DAY_SESH_MEDIA_MAX_DAYS,
} from "./policy.js";
import {
  addUtcDays,
  addUtcMonths,
  mediaViewerDeadline,
  type TripEndAnchor,
} from "./trip-shim.js";
import type {
  DaySeshMediaDeadline,
  ExpiryContract,
  ExpirySource,
  MediaAsset,
  Message,
  MessageState,
} from "./cf2-types.js";
import { daySeshMediaDeadlineLocked, daySeshMediaExpiresAt } from "./lifecycle-g1g4.js";

export function textExpiresAt(createdAt: string): string {
  return addUtcMonths(createdAt, CAMPFIRE_TEXT_MAX_MONTHS);
}

export function standaloneMediaExpiresAt(uploadedAt: string): string {
  return addUtcDays(uploadedAt, CAMPFIRE_MEDIA_MAX_DAYS);
}

export function tripMediaExpiresAt(trip: TripEndAnchor): string | null {
  return mediaViewerDeadline(trip).deadlineIso;
}

/**
 * G1 LOCKED — Day Sesh media max 45d after official Day Sesh end.
 * Without an official end yet, deadlineAt is null (not past-due); flag still day_sesh_45d_max.
 */
export function daySeshMediaDeadline(
  officialEndedAt?: string | null,
): DaySeshMediaDeadline {
  return daySeshMediaDeadlineLocked(officialEndedAt);
}

export function computeMediaExpiry(args: {
  origin: MediaAsset["origin"];
  uploadedAt: string;
  trip?: TripEndAnchor | null;
  /** Optional known bound when Day Sesh media is also trip-linked — NEVER extends past min. */
  tripBoundIso?: string | null;
  /** G1 — official Day Sesh end anchor. */
  daySeshOfficialEndedAt?: string | null;
}): Pick<MediaAsset, "expiresAt" | "flag"> {
  if (args.origin === "campfire") {
    return { expiresAt: standaloneMediaExpiresAt(args.uploadedAt) };
  }
  if (args.origin === "trip_drop") {
    if (!args.trip) {
      return { expiresAt: null, flag: undefined };
    }
    return { expiresAt: tripMediaExpiresAt(args.trip) };
  }
  // day_sesh — G1 45d max from official end; Campfire link must not rewrite this later
  const ds = daySeshMediaDeadline(args.daySeshOfficialEndedAt);
  let expiresAt =
    ds.deadlineAt ??
    (args.daySeshOfficialEndedAt
      ? daySeshMediaExpiresAt(args.daySeshOfficialEndedAt)
      : null);
  if (args.tripBoundIso) {
    // Known trip-linked bound may apply before/alongside DS clock; NEVER extends past min.
    if (expiresAt) {
      const a = new Date(expiresAt).getTime();
      const b = new Date(args.tripBoundIso).getTime();
      expiresAt = new Date(Math.min(a, b)).toISOString();
    } else {
      expiresAt = args.tripBoundIso;
    }
  }
  return { expiresAt, flag: "day_sesh_45d_max" };
}

export { DAY_SESH_MEDIA_MAX_DAYS };

export function expiryContractForMessage(msg: Message): ExpiryContract {
  return {
    assetOrMessageId: msg.id,
    source: "text_12mo",
    expiresAt: msg.expiresAt,
    resetOn: "never",
  };
}

export function expiryContractForMedia(asset: MediaAsset): ExpiryContract {
  let source: ExpirySource = "campfire_media_90d";
  if (asset.origin === "trip_drop") source = "trip_drop_45d";
  if (asset.origin === "day_sesh") source = "day_sesh_45d";
  return {
    assetOrMessageId: asset.id,
    source,
    expiresAt: asset.expiresAt,
    resetOn: CAMPFIRE_POLICY.resetOn,
    flag: asset.flag,
  };
}

export function isPast(nowIso: string, expiresAt: string | null): boolean {
  if (expiresAt == null) return false;
  return new Date(nowIso).getTime() >= new Date(expiresAt).getTime();
}

/**
 * effectiveExpiry = min of known deadlines; link creation never writes expiresAt.
 * Legal preservation infra is disabled — flag only if an active type-only hold is passed.
 */
export function effectiveExpiry(
  candidates: Array<string | null | undefined>,
): string | null {
  const times = candidates
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .map((x) => new Date(x).getTime())
    .filter((n) => !Number.isNaN(n));
  if (times.length === 0) return null;
  return new Date(Math.min(...times)).toISOString();
}

export function messageRenderState(
  msg: Message,
  nowIso: string,
): MessageState {
  if (
    msg.state === "author_removed" ||
    msg.state === "erased" ||
    msg.state === "takedown"
  ) {
    return msg.state;
  }
  if (isPast(nowIso, msg.expiresAt)) return "expired";
  return "live";
}

export function mediaIsExpired(asset: MediaAsset, nowIso: string): boolean {
  return isPast(nowIso, asset.expiresAt);
}

/** Soft hide / not-served — never runs a deletion job. */
export function tombstoneMessage(msg: Message, state: MessageState): Message {
  return {
    ...msg,
    state,
    body: null,
    mediaLinkIds: [],
  };
}

export function assertNoDeletionJob(): { enabled: false; reason: string } {
  return {
    enabled: false,
    reason: CAMPFIRE_POLICY.deletionJobs
      ? "unexpected"
      : "lazy_read_expiry_only",
  };
}

export function assertReportDoesNotPauseRetention(): boolean {
  return CAMPFIRE_POLICY.reportPausesRetention === false;
}
