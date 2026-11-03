/**
 * FICTIONAL authz audit trail (t1187u Phase 2) — DEMO / TEST ONLY.
 * Append-only in-memory log of allow/deny decisions. No live logging service.
 */
import type { AuthzAction, AuthzDecision, AuthzDenyCode } from "./fictionalAuthz.js";

export type AuditOutcome = "allow" | "deny";

export interface AuthzAuditEntry {
  readonly seq: number;
  readonly actorId: string;
  readonly resource: string;
  readonly action: AuthzAction | string;
  readonly reasonCode: AuthzDenyCode | "ok";
  readonly timestamp: string;
  readonly outcome: AuditOutcome;
}

/** Append-only fictional audit log. Mutations only push; never rewrite prior rows. */
export class FictionalAuthzAuditLog {
  private readonly entries: AuthzAuditEntry[] = [];
  private nextSeq = 1;

  append(args: {
    actorId: string;
    resource: string;
    action: AuthzAction | string;
    reasonCode: AuthzDenyCode | "ok";
    timestamp: string;
    outcome: AuditOutcome;
  }): AuthzAuditEntry {
    const entry: AuthzAuditEntry = {
      seq: this.nextSeq++,
      actorId: args.actorId,
      resource: args.resource,
      action: args.action,
      reasonCode: args.reasonCode,
      timestamp: args.timestamp,
      outcome: args.outcome,
    };
    this.entries.push(entry);
    return entry;
  }

  /** Record an AuthzDecision without mutating the decision. */
  recordDecision(args: {
    actorId: string;
    resource: string;
    decision: AuthzDecision;
    timestamp: string;
  }): AuthzAuditEntry {
    return this.append({
      actorId: args.actorId,
      resource: args.resource,
      action: args.decision.action,
      reasonCode: args.decision.allow ? "ok" : args.decision.code,
      timestamp: args.timestamp,
      outcome: args.decision.allow ? "allow" : "deny",
    });
  }

  snapshot(): readonly AuthzAuditEntry[] {
    return this.entries.slice();
  }

  length(): number {
    return this.entries.length;
  }

  /** Attempted rewrite / delete is refused — audit stays append-only. */
  tryRewrite(_seq: number): { ok: false; reason: "append_only" } {
    return { ok: false, reason: "append_only" };
  }

  tryClear(): { ok: false; reason: "append_only" } {
    return { ok: false, reason: "append_only" };
  }
}

export function createAuthzAuditLog(): FictionalAuthzAuditLog {
  return new FictionalAuthzAuditLog();
}
