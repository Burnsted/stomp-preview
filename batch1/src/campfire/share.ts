/**
 * Quick Share — exactly ONE Squad + explicit confirm.
 * Sesh voice may prepare but never bypass confirm.
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

export function assertSingleSquad(
  squadIds: readonly string[],
): Result<string, DenyReason> {
  if (squadIds.length !== 1) return err("multi_recipient");
  return ok(squadIds[0]!);
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
      expirySource: (contract.flag ?? contract.source) as ExpirySource | "DEADLINE_UNSPECIFIED",
    },
    createdAt: args.nowIso,
  };
}

export function confirmShare(
  intent: ShareIntent,
): Result<ShareIntent, DenyReason> {
  if (intent.state !== "previewing") return err("intent_invalid");
  return ok({
    ...intent,
    state: "confirmed",
    confirmedAt: intent.createdAt,
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
