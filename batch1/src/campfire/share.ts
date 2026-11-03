/**
 * Quick Share — exactly ONE Squad + explicit confirm.
 * Sesh voice may prepare but never bypass confirm.
 * SV-0: real confirmedAt, optional recheck, delivery honesty helpers.
 */
import { err, ok, type Result } from "../core/result.js";
import type {
  DenyReason,
  ExpirySource,
  MediaAsset,
  ShareIntent,
  ShareIntentId,
  Squad,
  StomperId,
} from "./cf2-types.js";
import { expiryContractForMedia } from "./retention.js";
import {
  recheckShareIntent,
  type SeshRecheckContext,
  type SeshRecheckDeny,
} from "./sesh-recheck.js";

const UNSPECIFIED = "unspecified";

export function assertSingleSquad(
  squadIds: readonly string[],
): Result<string, DenyReason> {
  if (squadIds.length !== 1) return err("multi_recipient");
  const id = squadIds[0]!;
  if (!id || id === UNSPECIFIED) {
    return err("multi_recipient", "Quick Share requires one Squad");
  }
  return ok(id);
}

export function prepareShare(args: {
  id: ShareIntentId;
  actorId: StomperId;
  media: MediaAsset;
  squad: Squad;
  memberCount: number;
  nowIso: string;
}): ShareIntent {
  const contract = expiryContractForMedia(args.media);
  return {
    id: args.id,
    actorId: args.actorId,
    mediaRefId: args.media.id,
    squadId: args.squad.id,
    state: "previewing",
    preview: {
      squadName: args.squad.name,
      memberCount: args.memberCount,
      thumbLabel: args.media.bytesLabel,
      expiresAt: contract.expiresAt,
      expirySource: (contract.flag === "day_sesh_45d_max"
        ? "day_sesh_45d_max"
        : contract.flag === "DEADLINE_UNSPECIFIED"
          ? "DEADLINE_UNSPECIFIED"
          : contract.source) as ExpirySource | "DEADLINE_UNSPECIFIED" | "day_sesh_45d_max",
    },
    createdAt: args.nowIso,
  };
}

export type ConfirmShareRecheck = Pick<
  SeshRecheckContext,
  "actor" | "memberships" | "assets" | "nowIso" | "sessionUnlocked"
>;

/**
 * Confirm a prepared ShareIntent.
 * Optional recheck (SV-0 / CONFLICT-2): membership + media + J5 unlock.
 * confirmedAt is real clock when nowIso provided (not createdAt).
 */
export function confirmShare(
  intent: ShareIntent,
  opts?: {
    nowIso?: string;
    recheck?: ConfirmShareRecheck;
  },
): Result<ShareIntent, DenyReason | SeshRecheckDeny> {
  if (intent.state !== "previewing") return err("intent_invalid");
  if (intent.squadId === (UNSPECIFIED as ShareIntent["squadId"])) {
    return err("multi_recipient");
  }

  if (opts?.recheck) {
    const gate = recheckShareIntent({
      actorId: intent.actorId,
      squadId: intent.squadId,
      mediaRefId: intent.mediaRefId,
      actor: opts.recheck.actor,
      memberships: opts.recheck.memberships,
      assets: opts.recheck.assets ?? new Map(),
      nowIso: opts.recheck.nowIso,
      sessionUnlocked: opts.recheck.sessionUnlocked,
      kind: "share_media",
    });
    if (!gate.ok) return gate;
  }

  const confirmedAt = opts?.nowIso ?? intent.createdAt;
  return ok({
    ...intent,
    state: "confirmed",
    confirmedAt,
  });
}

export function cancelShare(intent: ShareIntent): ShareIntent {
  return { ...intent, state: "cancelled" };
}

export function discardShare(intent: ShareIntent): ShareIntent {
  return { ...intent, state: "discarded" };
}

/** Without confirm, nothing is posted. */
export function shareWouldPost(intent: ShareIntent | null | undefined): boolean {
  return intent?.state === "confirmed";
}

export function rejectMultiSquadShare(
  squadIds: readonly string[],
): Result<never, DenyReason> {
  return err(
    "multi_recipient",
    `Quick Share allows exactly one Squad; got ${squadIds.length}`,
  );
}

/** SV-0 delivery honesty — ShareIntent terminal delivery markers (additive). */
export function markShareQueued(intent: ShareIntent): ShareIntent {
  return { ...intent, state: "queued" };
}

export function markShareDelivered(intent: ShareIntent): ShareIntent {
  return { ...intent, state: "delivered" };
}

export function markShareFailed(intent: ShareIntent): ShareIntent {
  return { ...intent, state: "failed" };
}

export function markShareRejectedRecheck(intent: ShareIntent): ShareIntent {
  return { ...intent, state: "rejected_recheck" };
}
