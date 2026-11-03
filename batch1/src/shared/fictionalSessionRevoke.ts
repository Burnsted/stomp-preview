/**
 * FICTIONAL session / token revoke matrix (t1187u Phase 2).
 * Models sessionKill on confirmed G4 logical revoke. Does NOT wire Better Auth.
 */
import type {
  Campfire,
  Membership,
  Stomper,
  StomperId,
} from "../campfire/cf2-types.js";
import { revokeAccountAccess } from "../campfire/lifecycle-g1g4.js";
import {
  authorizeCampfireAccess,
  authorizeJoinTripAsRider,
  authorizePersonalExport,
  authorizeViewerDownload,
  type AuthzDecision,
  type AuthzAction,
} from "./fictionalAuthz.js";
import type {
  PassEntitlement,
  Trip,
  ViewerEntitlement,
} from "../trips/index.js";

export type SessionStatus = "active" | "killed";

export interface FictionalSession {
  sessionId: string;
  actorId: string;
  status: SessionStatus;
  createdAt: string;
  killedAt?: string;
  killReason?: "g4_logical_revoke";
}

export class FictionalSessionStore {
  private readonly sessions = new Map<string, FictionalSession>();

  issue(args: { sessionId: string; actorId: string; createdAt: string }): FictionalSession {
    const s: FictionalSession = {
      sessionId: args.sessionId,
      actorId: args.actorId,
      status: "active",
      createdAt: args.createdAt,
    };
    this.sessions.set(args.sessionId, s);
    return s;
  }

  get(sessionId: string): FictionalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** Mark session dead — append-style status flip; id retained for audit. */
  kill(sessionId: string, atIso: string): FictionalSession | undefined {
    const s = this.sessions.get(sessionId);
    if (!s) return undefined;
    const killed: FictionalSession = {
      ...s,
      status: "killed",
      killedAt: atIso,
      killReason: "g4_logical_revoke",
    };
    this.sessions.set(sessionId, killed);
    return killed;
  }

  isAlive(sessionId: string): boolean {
    return this.sessions.get(sessionId)?.status === "active";
  }
}

export function createSessionStore(): FictionalSessionStore {
  return new FictionalSessionStore();
}

/** Deny-by-default when session is missing or killed. */
export function authorizeWithSession(args: {
  sessionStore: FictionalSessionStore;
  sessionId: string;
  action: AuthzAction;
}): AuthzDecision {
  const s = args.sessionStore.get(args.sessionId);
  if (!s || s.status === "killed") {
    return {
      allow: false,
      action: args.action,
      code: "session_killed",
      message: "Session killed after G4 logical revoke (fictional)",
    };
  }
  return { allow: true, action: args.action, code: "ok" };
}

/**
 * G4 confirmed deletion → logical revoke + kill all sessions for actor.
 * physicalWipeGuaranteed remains false. No Better Auth.
 */
export function revokeAccountAndKillSessions(args: {
  stomper: Stomper;
  memberships: Membership[];
  invites: Array<{ toStomperId: StomperId; status: string; id: string }>;
  nowIso: string;
  sessionStore: FictionalSessionStore;
  sessionIds: readonly string[];
}): {
  revoked: ReturnType<typeof revokeAccountAccess>;
  killedSessions: FictionalSession[];
} {
  const revoked = revokeAccountAccess({
    stomper: args.stomper,
    memberships: args.memberships,
    invites: args.invites,
    nowIso: args.nowIso,
  });
  const killedSessions: FictionalSession[] = [];
  for (const id of args.sessionIds) {
    const s = args.sessionStore.get(id);
    if (s && s.actorId === args.stomper.id) {
      const killed = args.sessionStore.kill(id, args.nowIso);
      if (killed) killedSessions.push(killed);
    }
  }
  return { revoked, killedSessions };
}

/** Gate a subsequent action: session must be alive, then underlying authz. */
export function gateAfterSession(args: {
  sessionStore: FictionalSessionStore;
  sessionId: string;
  underlying: AuthzDecision;
}): AuthzDecision {
  const sess = authorizeWithSession({
    sessionStore: args.sessionStore,
    sessionId: args.sessionId,
    action: args.underlying.action,
  });
  if (!sess.allow) return sess;
  return args.underlying;
}

/** Convenience: Pass join fails when session killed. */
export function authorizeJoinTripWithSession(args: {
  sessionStore: FictionalSessionStore;
  sessionId: string;
  stomperId: StomperId | string;
  trip: Trip;
  passes: PassEntitlement[];
  atIso: string;
}): AuthzDecision {
  const underlying = authorizeJoinTripAsRider({
    stomperId: args.stomperId,
    trip: args.trip,
    passes: args.passes,
    atIso: args.atIso,
  });
  return gateAfterSession({
    sessionStore: args.sessionStore,
    sessionId: args.sessionId,
    underlying,
  });
}

export function authorizeViewerDownloadWithSession(args: {
  sessionStore: FictionalSessionStore;
  sessionId: string;
  viewer: ViewerEntitlement;
  atIso: string;
}): AuthzDecision {
  const underlying = authorizeViewerDownload({
    viewer: args.viewer,
    atIso: args.atIso,
  });
  return gateAfterSession({
    sessionStore: args.sessionStore,
    sessionId: args.sessionId,
    underlying,
  });
}

export function authorizeCampfireWithSession(args: {
  sessionStore: FictionalSessionStore;
  sessionId: string;
  stomper: Stomper;
  campfire: Campfire;
  memberships: readonly Membership[];
}): AuthzDecision {
  const underlying = authorizeCampfireAccess({
    stomper: args.stomper,
    campfire: args.campfire,
    memberships: args.memberships,
  });
  return gateAfterSession({
    sessionStore: args.sessionStore,
    sessionId: args.sessionId,
    underlying,
  });
}

export function authorizePersonalExportWithSession(args: {
  sessionStore: FictionalSessionStore;
  sessionId: string;
  actorId: string;
  stomper: Stomper;
}): AuthzDecision {
  const underlying = authorizePersonalExport({
    actorId: args.actorId,
    stomper: args.stomper,
  });
  return gateAfterSession({
    sessionStore: args.sessionStore,
    sessionId: args.sessionId,
    underlying,
  });
}
