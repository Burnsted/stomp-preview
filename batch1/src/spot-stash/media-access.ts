/**
 * t1250u — signed-URL-style media access guard (fictional prototype).
 *
 * Expired clips are unreachable through this resolver even when a caller
 * still holds a stale deliveryUrl string or a disabled UI control remains.
 * No live CDN / object store — signature is a deterministic preview token.
 */
import { assertPlayback, isClipExpired, revokeExpiredClip } from "./retention.js";
import { can } from "./permissions.js";
import type { SpotWorld } from "./store.js";
import type { Clock, SpotClip, SpotPin, StomperId } from "./types.js";

export type MediaActor = {
  actorId: StomperId;
  actorCrewIds: string[];
  authorizedPublicRider?: boolean;
};

export type SignedMediaToken = {
  /** Opaque preview URL — not a production JWT/CDN signature. */
  url: string;
  pinId: string;
  clipId: string;
  actorId: StomperId;
  /** Token hard-stops at clip.expiresAt (no extension). */
  validUntil: string;
  signature: string;
};

export type MediaAccessOk = {
  ok: true;
  url: string;
  clip: SpotClip;
  token: SignedMediaToken;
};

export type MediaAccessDenied = {
  ok: false;
  error:
    | "pin_not_found"
    | "clip_not_found"
    | "unauthorized"
    | "expired_unreachable"
    | "token_invalid"
    | "token_expired"
    | "token_actor_mismatch";
  deliveryUrl: null;
};

const PREVIEW_SECRET = "stomp-preview-media-v1";

function stableSign(parts: readonly string[]): string {
  const raw = `${PREVIEW_SECRET}|${parts.join("|")}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `sig_${(h >>> 0).toString(16)}`;
}

function findPin(world: SpotWorld, pinId: string): SpotPin | undefined {
  return world.pins.find((p) => p.id === pinId);
}

function findClip(pin: SpotPin, clipId: string): SpotClip | undefined {
  return pin.clips.find((c) => c.id === clipId);
}

function authorizePinView(pin: SpotPin, actor: MediaActor): boolean {
  return can(pin, actor.actorId, "view_clips", {
    actorCrewIds: actor.actorCrewIds,
    authorizedPublicRider: actor.authorizedPublicRider ?? true,
  }).allowed;
}

function signToken(
  pinId: string,
  clipId: string,
  actorId: string,
  validUntil: string,
  deliveryUrl: string,
): string {
  return stableSign([pinId, clipId, actorId, validUntil, deliveryUrl]);
}

function buildUrl(
  pinId: string,
  clipId: string,
  actorId: string,
  validUntil: string,
  signature: string,
): string {
  return (
    `preview://clip/${encodeURIComponent(pinId)}/${encodeURIComponent(clipId)}` +
    `?u=${encodeURIComponent(actorId)}` +
    `&until=${encodeURIComponent(validUntil)}` +
    `&s=${signature}`
  );
}

export function parseMediaTokenUrl(raw: string): Omit<SignedMediaToken, "signature"> & {
  signature: string;
} | null {
  const m =
    /^preview:\/\/clip\/([^/]+)\/([^?]+)\?u=([^&]+)&until=([^&]+)&s=([^&]+)$/.exec(
      raw,
    );
  if (!m) return null;
  return {
    url: raw,
    pinId: decodeURIComponent(m[1]!),
    clipId: decodeURIComponent(m[2]!),
    actorId: decodeURIComponent(m[3]!),
    validUntil: decodeURIComponent(m[4]!),
    signature: m[5]!,
  };
}

function deny(
  error: MediaAccessDenied["error"],
): MediaAccessDenied {
  return { ok: false, error, deliveryUrl: null };
}

function clipUnreachable(clip: SpotClip, clock: Clock): boolean {
  const revoked = revokeExpiredClip(clip, clock);
  if (isClipExpired(revoked, clock)) return true;
  if (revoked.delivery === "expired" || revoked.delivery === "revoked") return true;
  if (!revoked.deliveryUrl) return true;
  return !assertPlayback(revoked, clock).ok;
}

/** Mint a signed preview URL bound to clip expiry + actor ACL. */
export function mintMediaAccessToken(
  world: SpotWorld,
  pinId: string,
  clipId: string,
  actor: MediaActor,
  clock: Clock,
): MediaAccessOk | MediaAccessDenied {
  const pin = findPin(world, pinId);
  if (!pin) return deny("pin_not_found");
  const clip = findClip(pin, clipId);
  if (!clip) return deny("clip_not_found");
  if (!authorizePinView(pin, actor)) return deny("unauthorized");
  if (clipUnreachable(clip, clock)) return deny("expired_unreachable");

  const live = revokeExpiredClip(clip, clock);
  const deliveryUrl = live.deliveryUrl!;
  const validUntil = live.expiresAt;
  const signature = signToken(pinId, clipId, actor.actorId, validUntil, deliveryUrl);
  const token: SignedMediaToken = {
    url: buildUrl(pinId, clipId, actor.actorId, validUntil, signature),
    pinId,
    clipId,
    actorId: actor.actorId,
    validUntil,
    signature,
  };
  return { ok: true, url: token.url, clip: live, token };
}

/**
 * Resolve a previously minted signed URL.
 * Refuses expired media even if the raw deliveryUrl string is still known.
 */
export function resolveSignedMediaUrl(
  world: SpotWorld,
  tokenOrUrl: SignedMediaToken | string,
  actor: MediaActor,
  clock: Clock,
): MediaAccessOk | MediaAccessDenied {
  const parsed =
    typeof tokenOrUrl === "string"
      ? parseMediaTokenUrl(tokenOrUrl)
      : tokenOrUrl;
  if (!parsed) return deny("token_invalid");
  if (parsed.actorId !== actor.actorId) return deny("token_actor_mismatch");
  if (Date.parse(clock.nowIso()) >= Date.parse(parsed.validUntil)) {
    return deny("token_expired");
  }

  const pin = findPin(world, parsed.pinId);
  if (!pin) return deny("pin_not_found");
  const clip = findClip(pin, parsed.clipId);
  if (!clip) return deny("clip_not_found");
  if (!authorizePinView(pin, actor)) return deny("unauthorized");
  if (clipUnreachable(clip, clock)) return deny("expired_unreachable");

  const live = revokeExpiredClip(clip, clock);
  const deliveryUrl = live.deliveryUrl!;
  const expected = signToken(
    parsed.pinId,
    parsed.clipId,
    parsed.actorId,
    parsed.validUntil,
    deliveryUrl,
  );
  if (parsed.signature !== expected) return deny("token_invalid");

  const token: SignedMediaToken = {
    url:
      typeof tokenOrUrl === "string"
        ? tokenOrUrl
        : buildUrl(
            parsed.pinId,
            parsed.clipId,
            parsed.actorId,
            parsed.validUntil,
            parsed.signature,
          ),
    pinId: parsed.pinId,
    clipId: parsed.clipId,
    actorId: parsed.actorId,
    validUntil: parsed.validUntil,
    signature: parsed.signature,
  };
  return { ok: true, url: token.url, clip: live, token };
}

/** Direct media access by pin/clip ids — preferred API-boundary entry. */
export function accessClipMedia(
  world: SpotWorld,
  pinId: string,
  clipId: string,
  actor: MediaActor,
  clock: Clock,
): MediaAccessOk | MediaAccessDenied {
  return mintMediaAccessToken(world, pinId, clipId, actor, clock);
}

/**
 * Holding a stale raw deliveryUrl after expiry must not grant access.
 * Callers must use accessClipMedia / resolveSignedMediaUrl instead.
 */
export function rawDeliveryUrlBypassesGuard(): false {
  return false;
}
