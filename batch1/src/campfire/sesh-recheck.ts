/**
 * SV-0 pre-send revalidation (after claim, before queue).
 * Membership, recipient/Squad, content/MediaRef, permissions, J5 unlocked session.
 * Youth gate fixture-only. Fictional data only.
 */
import { err, ok, type Result } from "../core/result.js";
import {
  accountAllowsCampfire,
  isActiveMember,
} from "./guards.js";
import type {
  DenyReason,
  MediaAsset,
  MediaRefId,
  Membership,
  Squad,
  SquadId,
  Stomper,
  StomperId,
} from "./cf2-types.js";
import type { SeshPendingAction, SeshPendingKind } from "./sesh-pending.js";

export interface SeshRecheckContext {
  actor: Stomper;
  memberships: readonly Membership[];
  squads: ReadonlyMap<string, Squad>;
  /** Media lookup for share_media. */
  assets?: ReadonlyMap<string, MediaAsset>;
  /** J5 — send/share require unlocked authorized session. */
  sessionUnlocked: boolean;
  /** Wall clock ISO for media expiry comparison. */
  nowIso: string;
}

export type SeshRecheckDeny = DenyReason;

function asSquadMap(
  squads: ReadonlyMap<string, Squad>,
): ReadonlyMap<string, Squad> {
  return squads;
}

export function mediaIsUsable(
  asset: MediaAsset | undefined,
  nowIso: string,
): Result<true, SeshRecheckDeny> {
  if (!asset) return err("not_found", "That photo expired");
  if (asset.localUri === null) {
    return err("media_deleted", "That photo is gone");
  }
  if (asset.expiresAt !== null && asset.expiresAt <= nowIso) {
    return err("expired", "That photo expired");
  }
  return ok(true);
}

/**
 * Recheck everything required before queue/send.
 * Fail → caller marks pending rejected_recheck; nothing queued.
 */
export function recheckBeforeSend(
  pending: SeshPendingAction,
  ctx: SeshRecheckContext,
): Result<true, SeshRecheckDeny> {
  if (!ctx.sessionUnlocked) {
    return err("session_locked", "Unlock to send.");
  }

  const acct = accountAllowsCampfire(ctx.actor.accountStatus);
  if (!acct.ok) return acct;

  if (ctx.actor.id !== pending.actorId) {
    return err("not_member");
  }

  const squads = asSquadMap(ctx.squads);
  if (squads.size > 0 && !squads.has(pending.squadId)) {
    return err("not_found");
  }

  if (!isActiveMember(ctx.memberships, pending.squadId, pending.actorId)) {
    return err("not_member", "No longer in Squad — not sent");
  }

  if (pending.kind === "share_media") {
    const mediaId = pending.mediaRefId ?? (pending.contentHash as MediaRefId);
    const asset = ctx.assets?.get(mediaId);
    const media = mediaIsUsable(asset, ctx.nowIso);
    if (!media.ok) return media;
  }

  if (pending.kind === "send_text") {
    if (!pending.textBody && !pending.contentHash) {
      return err("intent_invalid");
    }
  }

  return ok(true);
}

/** Helper for Quick Share intent recheck (AF-XINT-12 / CONFLICT-2). */
export function recheckShareIntent(args: {
  actorId: StomperId;
  squadId: SquadId;
  mediaRefId: MediaRefId | string;
  actor: Stomper;
  memberships: readonly Membership[];
  assets: ReadonlyMap<string, MediaAsset>;
  nowIso: string;
  sessionUnlocked?: boolean;
  kind?: SeshPendingKind;
}): Result<true, SeshRecheckDeny> {
  const pending: SeshPendingAction = {
    pendingId: "recheck_only",
    actorId: args.actorId,
    kind: args.kind ?? "share_media",
    squadId: args.squadId,
    contentHash: String(args.mediaRefId),
    mediaRefId: args.mediaRefId as MediaRefId,
    readbackText: "",
    status: "confirmed",
    createdAtMs: 0,
    expiresAtMs: 0,
    idempotencyKey: "recheck_only",
  };
  return recheckBeforeSend(pending, {
    actor: args.actor,
    memberships: args.memberships,
    squads: new Map(), // squad existence checked via membership
    assets: args.assets,
    sessionUnlocked: args.sessionUnlocked ?? true,
    nowIso: args.nowIso,
  });
}
