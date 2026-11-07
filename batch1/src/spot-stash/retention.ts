/**
 * t1238u — STRICT seven-day STOMP-hosted clip TTL (issue #87).
 * Pure module + injectable clock. NO live deletion job / scheduler / CDN purge.
 *
 * Binding rule: expiresAt = initial server receipt/upload + 7 days, independently
 * per clip. Trip Drop, session, Rider Pass, Viewer access, Spot/Stash association
 * MUST NOT extend the clock. A 20-day trip: day-1 clip expires day 8.
 */
import { SPOT_CLIP_TTL_DAYS, type Clock, type SpotClip } from "./types.js";

export type ClipTtlInput = {
  clipId: string;
  /** Initial STOMP receipt / upload instant (ISO). */
  receivedAt: string;
  title?: string;
  uploaderId?: string;
  tripId?: string | null;
  sessionId?: string | null;
  deliveryUrl?: string | null;
};

export type PurgeDesign = {
  /** Soft access revoke is immediate at expiry (delivery URLs stop serving). */
  accessRevokeAtExpiry: true;
  /** Physical storage/CDN/backup purge is bounded — not instantaneous. */
  physicalPurgeSlaHours: number;
  /** Immutable backups may lag; never promise instant erasure of backups. */
  immutableBackupLagDisclosed: true;
  /** No silent extension, recycle bin, or grace that re-serves media. */
  silentExtension: false;
  recycleBin: false;
  /** Live deletion job is OFF in this prototype. */
  liveDeletionJobEnabled: false;
  notes: string;
};

/** Documented purge design — not a running job. */
export const CLIP_PURGE_DESIGN: PurgeDesign = {
  accessRevokeAtExpiry: true,
  physicalPurgeSlaHours: 72,
  immutableBackupLagDisclosed: true,
  silentExtension: false,
  recycleBin: false,
  liveDeletionJobEnabled: false,
  notes:
    "At expiresAt, delivery URLs and playback are revoked immediately in product " +
    "logic. Controlled storage/CDN object deletion is scheduled with a bounded SLA " +
    "(≤72h target in this design). Immutable backups may retain ciphertext until " +
    "their natural rotation; policy discloses that lag and never represents backups " +
    "as available for playback. No recycle bin; no silent TTL extension.",
};

export function addUtcDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** expiresAt is ALWAYS receipt + 7d — ignore trip/session/pass/association. */
export function clipExpiresAt(receivedAt: string): string {
  return addUtcDays(receivedAt, SPOT_CLIP_TTL_DAYS);
}

/**
 * Create a clip with independent 7-day clock.
 * Optional trip/session ids are attribution only — they never mutate expiresAt.
 */
export function createClipWithTtl(
  input: ClipTtlInput,
  _ignoredExtensions?: {
    tripDurationDays?: number;
    sessionOpen?: boolean;
    riderPassActive?: boolean;
    viewerAccessUntil?: string | null;
    spotAssociation?: boolean;
  },
): SpotClip {
  const expiresAt = clipExpiresAt(input.receivedAt);
  return {
    id: input.clipId,
    title: input.title ?? "Clip",
    receivedAt: input.receivedAt,
    expiresAt,
    delivery: "live",
    deliveryUrl: input.deliveryUrl ?? `preview://clip/${input.clipId}`,
    uploaderId: input.uploaderId ?? "stomper_unknown",
    tripId: input.tripId ?? null,
    sessionId: input.sessionId ?? null,
  };
}

export function isClipExpired(clip: SpotClip, clock: Clock): boolean {
  return Date.parse(clock.nowIso()) >= Date.parse(clip.expiresAt);
}

export function msUntilExpiry(clip: SpotClip, clock: Clock): number {
  return Date.parse(clip.expiresAt) - Date.parse(clock.nowIso());
}

export function countdownLabel(clip: SpotClip, clock: Clock): string {
  const ms = msUntilExpiry(clip, clock);
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  if (days >= 1) return `${days}d ${remH}h left`;
  if (hours >= 1) return `${hours}h left`;
  const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
  return `${mins}m left`;
}

/**
 * Export must finish BEFORE expiresAt. At/after deadline → denied.
 * Does not extend TTL.
 */
export function beginExport(
  clip: SpotClip,
  clock: Clock,
): { ok: true; clip: SpotClip } | { ok: false; error: "expired" | "already_expired_delivery" } {
  if (isClipExpired(clip, clock) || clip.delivery === "expired" || clip.delivery === "revoked") {
    return { ok: false, error: "expired" };
  }
  return { ok: true, clip: { ...clip, delivery: "exporting" } };
}

export function finishExport(
  clip: SpotClip,
  clock: Clock,
): { ok: true; clip: SpotClip } | { ok: false; error: "export_past_deadline" } {
  if (isClipExpired(clip, clock)) {
    return { ok: false, error: "export_past_deadline" };
  }
  // Export copy leaves STOMP host; hosted original still expires on schedule.
  return { ok: true, clip: { ...clip, delivery: "live" } };
}

/** Soft revoke: strip URL + mark expired. No live storage delete. */
export function revokeExpiredClip(clip: SpotClip, clock: Clock): SpotClip {
  if (!isClipExpired(clip, clock) && clip.delivery !== "expired") return clip;
  return {
    ...clip,
    delivery: "expired",
    deliveryUrl: null,
  };
}

export function filterPlayableClips(clips: SpotClip[], clock: Clock): SpotClip[] {
  return clips
    .map((c) => revokeExpiredClip(c, clock))
    .filter((c) => c.delivery === "live" || c.delivery === "exporting");
}

export function assertPlayback(
  clip: SpotClip,
  clock: Clock,
): { ok: true } | { ok: false; error: "expired_playback_denied" } {
  const next = revokeExpiredClip(clip, clock);
  if (next.delivery === "expired" || next.delivery === "revoked" || !next.deliveryUrl) {
    return { ok: false, error: "expired_playback_denied" };
  }
  return { ok: true };
}

/** Spot Replay uses ONLY unexpired clips. */
export function spotReplayClips(clips: SpotClip[], clock: Clock): SpotClip[] {
  return filterPlayableClips(clips, clock);
}

export function assertNoLiveDeletionJob(): {
  enabled: false;
  reason: string;
  design: PurgeDesign;
} {
  return {
    enabled: false,
    reason: "lazy_read_expiry_plus_documented_purge_sla_only",
    design: CLIP_PURGE_DESIGN,
  };
}

export function fixedClock(iso: string): Clock {
  return { nowIso: () => iso };
}
