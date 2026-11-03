/**
 * FICTIONAL abuse / rate-limit stubs (t1187u Phase 2).
 * In-memory counters for Quick Share prepare + personal export.
 * Does NOT bypass authz — rate check runs alongside deny-by-default gates.
 * No live edge/WAF.
 */
import {
  authorizePersonalExport,
  authorizePrepareShare,
  type AuthzDecision,
} from "./fictionalAuthz.js";
import type { Membership, Stomper, StomperId } from "../campfire/cf2-types.js";

export type RateLimitBucket = "quick_share_prepare" | "personal_export";

export interface RateLimitConfig {
  /** Max successful+attempted checks per window. */
  maxPerWindow: number;
  /** Window length in ms (fictional clock). */
  windowMs: number;
}

export const DEFAULT_RATE_LIMITS: Record<RateLimitBucket, RateLimitConfig> = {
  quick_share_prepare: { maxPerWindow: 5, windowMs: 60_000 },
  personal_export: { maxPerWindow: 3, windowMs: 60_000 },
};

interface Hit {
  atMs: number;
}

export class FictionalRateLimiter {
  private readonly hits = new Map<string, Hit[]>();
  private readonly config: Record<RateLimitBucket, RateLimitConfig>;

  constructor(config: Partial<Record<RateLimitBucket, RateLimitConfig>> = {}) {
    this.config = { ...DEFAULT_RATE_LIMITS, ...config };
  }

  private key(bucket: RateLimitBucket, actorId: string): string {
    return `${bucket}:${actorId}`;
  }

  /**
   * Record an attempt and return whether under limit.
   * Always records the attempt (even when over) so denials still consume budget fictionally.
   */
  check(args: {
    bucket: RateLimitBucket;
    actorId: string;
    nowMs: number;
  }): { allow: boolean; count: number; limit: number } {
    const cfg = this.config[args.bucket];
    const k = this.key(args.bucket, args.actorId);
    const windowStart = args.nowMs - cfg.windowMs;
    const prior = (this.hits.get(k) ?? []).filter((h) => h.atMs >= windowStart);
    prior.push({ atMs: args.nowMs });
    this.hits.set(k, prior);
    const count = prior.length;
    return {
      allow: count <= cfg.maxPerWindow,
      count,
      limit: cfg.maxPerWindow,
    };
  }

  remaining(args: {
    bucket: RateLimitBucket;
    actorId: string;
    nowMs: number;
  }): number {
    const cfg = this.config[args.bucket];
    const k = this.key(args.bucket, args.actorId);
    const windowStart = args.nowMs - cfg.windowMs;
    const count = (this.hits.get(k) ?? []).filter((h) => h.atMs >= windowStart).length;
    return Math.max(0, cfg.maxPerWindow - count);
  }
}

export function createRateLimiter(
  config?: Partial<Record<RateLimitBucket, RateLimitConfig>>,
): FictionalRateLimiter {
  return new FictionalRateLimiter(config);
}

/** Rate-limit then authz — over-limit denies without skipping membership checks when under. */
export function authorizePrepareShareRateLimited(args: {
  limiter: FictionalRateLimiter;
  actorId: StomperId;
  squadIds: readonly string[];
  memberships: readonly Membership[];
  actor?: Stomper;
  nowMs: number;
}): AuthzDecision {
  const rl = args.limiter.check({
    bucket: "quick_share_prepare",
    actorId: args.actorId,
    nowMs: args.nowMs,
  });
  if (!rl.allow) {
    return {
      allow: false,
      action: "prepare_single_squad_share",
      code: "rate_limited",
      message: `Quick Share prepare over limit (${rl.count}/${rl.limit})`,
    };
  }
  return authorizePrepareShare({
    actorId: args.actorId,
    squadIds: args.squadIds,
    memberships: args.memberships,
    actor: args.actor,
  });
}

export function authorizePersonalExportRateLimited(args: {
  limiter: FictionalRateLimiter;
  actorId: string;
  stomper: Stomper;
  nowMs: number;
}): AuthzDecision {
  const rl = args.limiter.check({
    bucket: "personal_export",
    actorId: args.actorId,
    nowMs: args.nowMs,
  });
  if (!rl.allow) {
    return {
      allow: false,
      action: "export_personal_json",
      code: "rate_limited",
      message: `Personal export over limit (${rl.count}/${rl.limit})`,
    };
  }
  return authorizePersonalExport({
    actorId: args.actorId,
    stomper: args.stomper,
  });
}
