/**
 * SV-0 Sesh pending-action store (t1156u).
 * One current pendingId shared by voice confirm + on-screen tap.
 * CAS claim prevents duplicate send. Fictional data only.
 */
import { err, ok, type Result } from "../core/result.js";
import type { MediaRefId, SquadId, StomperId } from "./cf2-types.js";

export const SESH_PENDING_TTL_MS = 20000;

export type SeshClock = () => number;

export type SeshConfirmChannel = "voice" | "tap";

export type SeshPendingKind = "send_text" | "share_media";

/** Primary delivery states + side exits (GO). */
export type SeshPendingStatus =
  | "prepared"
  | "confirmed"
  | "queued"
  | "delivered"
  | "failed"
  | "cancelled"
  | "expired"
  | "replaced"
  | "rejected_recheck"
  | "ambiguous";

export type SeshClaimDeny =
  | "already_handled"
  | "expired"
  | "stale"
  | "wrong_actor"
  | "not_found"
  | "ambiguous"
  | "session_locked";

export interface SeshPendingAction {
  pendingId: string;
  actorId: StomperId;
  kind: SeshPendingKind;
  /** Exactly one Squad. */
  squadId: SquadId;
  /** Text body hash or mediaRefId. */
  contentHash: string;
  mediaRefId?: MediaRefId;
  textBody?: string;
  readbackText: string;
  status: SeshPendingStatus;
  createdAtMs: number;
  expiresAtMs: number;
  confirmedAtMs?: number;
  confirmedBy?: SeshConfirmChannel;
  /** Idempotency key for send = pendingId. */
  idempotencyKey: string;
}

export interface PreparePendingArgs {
  pendingId: string;
  actorId: StomperId;
  kind: SeshPendingKind;
  squadId: SquadId;
  contentHash: string;
  readbackText: string;
  mediaRefId?: MediaRefId;
  textBody?: string;
  /** Override TTL (tests). Default SESH_PENDING_TTL_MS. */
  ttlMs?: number;
}

function defaultClock(): number {
  return Date.now();
}

/**
 * Single-slot pending store. Preparing a new action replaces (supersedes) the prior.
 */
export class PendingStore {
  private current: SeshPendingAction | null = null;
  private readonly byId = new Map<string, SeshPendingAction>();
  readonly clock: SeshClock;

  constructor(clock: SeshClock = defaultClock) {
    this.clock = clock;
  }

  now(): number {
    return this.clock();
  }

  getCurrent(): SeshPendingAction | null {
    return this.current;
  }

  get(pendingId: string): SeshPendingAction | undefined {
    return this.byId.get(pendingId);
  }

  /** Sweep TTL on the current prepared pending. */
  sweepExpired(): SeshPendingAction | null {
    const cur = this.current;
    if (!cur || cur.status !== "prepared") return null;
    if (this.now() < cur.expiresAtMs) return null;
    const expired: SeshPendingAction = { ...cur, status: "expired" };
    this.byId.set(expired.pendingId, expired);
    this.current = null;
    return expired;
  }

  /**
   * Prepare a new pending action. Prior prepared current → replaced.
   * Rejects multi / unspecified at call sites before prepare.
   */
  prepare(args: PreparePendingArgs): SeshPendingAction {
    this.sweepExpired();
    const prev = this.current;
    if (prev && prev.status === "prepared") {
      const replaced: SeshPendingAction = { ...prev, status: "replaced" };
      this.byId.set(replaced.pendingId, replaced);
    }
    const now = this.now();
    const ttl = args.ttlMs ?? SESH_PENDING_TTL_MS;
    const action: SeshPendingAction = {
      pendingId: args.pendingId,
      actorId: args.actorId,
      kind: args.kind,
      squadId: args.squadId,
      contentHash: args.contentHash,
      mediaRefId: args.mediaRefId,
      textBody: args.textBody,
      readbackText: args.readbackText,
      status: "prepared",
      createdAtMs: now,
      expiresAtMs: now + ttl,
      idempotencyKey: args.pendingId,
    };
    this.byId.set(action.pendingId, action);
    this.current = action;
    return action;
  }

  /**
   * CAS claim: only status=prepared + current + not expired + same actor.
   * Second voice/tap → already_handled (no second send).
   */
  claim(
    pendingId: string,
    channel: SeshConfirmChannel,
    actorId: StomperId,
    opts?: { sessionUnlocked?: boolean },
  ): Result<SeshPendingAction, SeshClaimDeny> {
    this.sweepExpired();

    if (opts?.sessionUnlocked === false) {
      return err("session_locked", "Unlock to send.");
    }

    const known = this.byId.get(pendingId);
    if (!known) return err("not_found");

    if (known.actorId !== actorId) return err("wrong_actor");

    if (known.status !== "prepared") {
      return err("already_handled", "Pending already handled");
    }

    if (this.current?.pendingId !== pendingId) {
      return err("stale", "expired, ask again");
    }

    if (this.now() >= known.expiresAtMs) {
      const expired: SeshPendingAction = { ...known, status: "expired" };
      this.byId.set(pendingId, expired);
      if (this.current?.pendingId === pendingId) this.current = null;
      return err("expired", "Cancelled — timed out.");
    }

    const confirmed: SeshPendingAction = {
      ...known,
      status: "confirmed",
      confirmedAtMs: this.now(),
      confirmedBy: channel,
    };
    this.byId.set(pendingId, confirmed);
    this.current = confirmed;
    return ok(confirmed);
  }

  cancel(pendingId: string, actorId: StomperId): Result<SeshPendingAction, SeshClaimDeny> {
    this.sweepExpired();
    const known = this.byId.get(pendingId);
    if (!known) return err("not_found");
    if (known.actorId !== actorId) return err("wrong_actor");
    if (known.status !== "prepared") return err("already_handled");
    if (this.current?.pendingId !== pendingId) return err("stale");
    const cancelled: SeshPendingAction = { ...known, status: "cancelled" };
    this.byId.set(pendingId, cancelled);
    this.current = null;
    return ok(cancelled);
  }

  markAmbiguous(pendingId: string): SeshPendingAction | null {
    const known = this.byId.get(pendingId);
    if (!known || known.status !== "prepared") return null;
    // Stay prepared — ambiguous reject does not cancel; GO: reject, stay until TTL
    return known;
  }

  markRejectedRecheck(pendingId: string): Result<SeshPendingAction, SeshClaimDeny> {
    const known = this.byId.get(pendingId);
    if (!known) return err("not_found");
    if (known.status !== "confirmed") return err("already_handled");
    const next: SeshPendingAction = { ...known, status: "rejected_recheck" };
    this.byId.set(pendingId, next);
    if (this.current?.pendingId === pendingId) this.current = null;
    return ok(next);
  }

  markQueued(pendingId: string): Result<SeshPendingAction, SeshClaimDeny> {
    const known = this.byId.get(pendingId);
    if (!known) return err("not_found");
    if (known.status !== "confirmed") return err("already_handled");
    const next: SeshPendingAction = { ...known, status: "queued" };
    this.byId.set(pendingId, next);
    this.current = next;
    return ok(next);
  }

  markDelivered(pendingId: string): Result<SeshPendingAction, SeshClaimDeny> {
    const known = this.byId.get(pendingId);
    if (!known) return err("not_found");
    if (known.status !== "queued" && known.status !== "confirmed") {
      return err("already_handled");
    }
    const next: SeshPendingAction = { ...known, status: "delivered" };
    this.byId.set(pendingId, next);
    this.current = null;
    return ok(next);
  }

  markFailed(pendingId: string): Result<SeshPendingAction, SeshClaimDeny> {
    const known = this.byId.get(pendingId);
    if (!known) return err("not_found");
    if (known.status !== "queued" && known.status !== "confirmed") {
      return err("already_handled");
    }
    const next: SeshPendingAction = { ...known, status: "failed" };
    this.byId.set(pendingId, next);
    this.current = null;
    return ok(next);
  }
}
