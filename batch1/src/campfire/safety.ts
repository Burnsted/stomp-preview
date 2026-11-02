/**
 * Same-Squad blocking + STOMP moderation report stub.
 * Blocker-only collapse + reveal; no auto-removal; report ≠ retention.
 */
import { err, ok, type Result } from "../core/result.js";
import type {
  Block,
  BlockId,
  DenyReason,
  Message,
  Mute,
  MuteId,
  Report,
  ReportId,
  StomperId,
  ViewerRender,
} from "./cf2-types.js";
import { blockEdge, canDirectInteract } from "./guards.js";
import { messageRenderState } from "./retention.js";
import { CAMPFIRE_POLICY } from "./policy.js";

export function createBlock(args: {
  id: BlockId;
  blockerId: StomperId;
  blockedId: StomperId;
  createdAt: string;
}): Block {
  return {
    id: args.id,
    blockerId: args.blockerId,
    blockedId: args.blockedId,
    createdAt: args.createdAt,
  };
}

export function unblock(
  blocks: Block[],
  blockerId: StomperId,
  blockedId: StomperId,
): Block[] {
  return blocks.filter(
    (b) => !(b.blockerId === blockerId && b.blockedId === blockedId),
  );
}

/** Account deletion of either side → block inert (no crash). */
export function markBlocksInertForAccount(
  blocks: Block[],
  stomperId: StomperId,
): Block[] {
  return blocks.map((b) =>
    b.blockerId === stomperId || b.blockedId === stomperId
      ? { ...b, inert: true }
      : b,
  );
}

export function createMute(args: {
  id: MuteId;
  stomperId: StomperId;
  targetId: StomperId;
  createdAt: string;
}): Mute {
  return {
    id: args.id,
    stomperId: args.stomperId,
    targetId: args.targetId,
    localOnly: true,
    createdAt: args.createdAt,
  };
}

export function fileReport(args: {
  id: ReportId;
  reporterId: StomperId;
  target: Report["target"];
  reason: string;
  evidenceRef: Report["evidenceRef"];
  createdAt: string;
  adminAssist?: boolean;
}): Report {
  return {
    id: args.id,
    reporterId: args.reporterId,
    target: args.target,
    reason: args.reason,
    route: "stomp_moderation",
    adminAssist: args.adminAssist,
    evidenceRef: args.evidenceRef,
    state: "queued",
    createdAt: args.createdAt,
    networkCall: false,
  };
}

export function reportPausesExpiry(_report: Report): boolean {
  return CAMPFIRE_POLICY.reportPausesRetention;
}

/**
 * Viewer render for a message given blocks + optional local reveal set.
 * Collapse is blocker-only; unrelated members unchanged.
 */
export function renderForViewer(args: {
  viewerId: StomperId;
  message: Message;
  blocks: readonly Block[];
  revealedMessageIds: ReadonlySet<string>;
  nowIso: string;
}): ViewerRender {
  const state = messageRenderState(args.message, args.nowIso);
  if (state !== "live") return "tombstone";

  const authorId = args.message.authorId;
  if (authorId === "former_stomper") return "visible";

  const edge = blockEdge(args.blocks, args.viewerId, authorId);
  if (!edge) return "visible";

  if (args.revealedMessageIds.has(args.message.id)) {
    return "revealed_by_blocker";
  }
  return "collapsed_for_blocker";
}

export function revealCollapsed(
  revealed: Set<string>,
  viewerId: StomperId,
  messageId: string,
  blocks: readonly Block[],
  authorId: StomperId,
): Set<string> {
  // reveal is local-only for blocker
  if (!blockEdge(blocks, viewerId, authorId)) return revealed;
  const next = new Set(revealed);
  next.add(messageId);
  return next;
}

export function denyTargetedAction(
  blocks: readonly Block[],
  actorId: StomperId,
  targetId: StomperId,
): Result<true, DenyReason> {
  return canDirectInteract(blocks, actorId, targetId);
}

/** Reaction notify to blocker is suppressed; count still visible to others. */
export function shouldNotifyReaction(args: {
  blocks: readonly Block[];
  reactorId: StomperId;
  authorId: StomperId;
}): boolean {
  return canDirectInteract(args.blocks, args.reactorId, args.authorId).ok;
}

/** Controls reachable from blocked-person context (a11y). */
export const BLOCKED_CONTEXT_CONTROLS = [
  "report",
  "mute",
  "leave",
] as const;

export function blockedContextControls(): readonly string[] {
  return BLOCKED_CONTEXT_CONTROLS;
}
