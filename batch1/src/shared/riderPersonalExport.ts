/**
 * FICTIONAL Rider personal JSON export (t1184u) — DEMO / TEST ONLY.
 *
 * Produces a structured personal-data slice for the actor's own STOMPER.
 * Does NOT contact live services, payments, youth activation, or storage wipe.
 * Denied for erased accounts and actor/owner mismatches via fictionalAuthz.
 */
import type {
  Campfire,
  MediaAsset,
  Membership,
  Message,
  Squad,
  Stomper,
  StomperId,
} from "../campfire/cf2-types.js";
import {
  activeMembership,
  messageVisibleToMembership,
  revokeAccountAccess,
} from "../campfire/lifecycle-g1g4.js";
import { authorizePersonalExport, type AuthzDecision } from "./fictionalAuthz.js";

export interface RiderPersonalExportInput {
  actorId: string;
  stomper: Stomper;
  squads: readonly Squad[];
  campfires: readonly Campfire[];
  memberships: readonly Membership[];
  /** Messages visible under G2 prospective cutoff for active memberships only. */
  messages: readonly Message[];
  /** Media owned by this STOMPER (MediaRef pointers — no binary blobs). */
  ownedMedia: readonly MediaAsset[];
  exportedAtIso: string;
}

export interface RiderPersonalExportJson {
  schema: "stomp.rider.personal.export.v1.fictional";
  exportedAt: string;
  fictionalOnly: true;
  physicalWipeGuaranteed: false;
  subject: {
    stomperId: StomperId | string;
    displayName: string;
    handle: string;
    accountStatus: Stomper["accountStatus"];
  };
  memberships: Array<{
    squadId: string;
    role: Membership["role"];
    state: Membership["state"];
    joinedAt: string;
    historyCutoffAt?: string;
    leftAt?: string;
  }>;
  visibleMessages: Array<{
    id: string;
    squadId: string;
    createdAt: string;
    /** Body redacted when tombstoned / erased / author_removed. */
    body: string | null;
  }>;
  ownedMediaRefs: Array<{
    id: string;
    origin: MediaAsset["origin"];
    uploadedAt: string;
    expiresAt: string | null;
    flag?: MediaAsset["flag"];
  }>;
  notes: string[];
}

export type RiderPersonalExportResult =
  | { ok: true; decision: AuthzDecision; export: RiderPersonalExportJson }
  | { ok: false; decision: AuthzDecision };

/**
 * Build a fictional personal JSON export when authorizePersonalExport allows.
 * G2: only messages visible to current active memberships are included.
 * G4: erased subjects are denied (no export after logical revoke).
 */
export function buildRiderPersonalExport(
  input: RiderPersonalExportInput,
): RiderPersonalExportResult {
  const decision = authorizePersonalExport({
    actorId: input.actorId,
    stomper: input.stomper,
  });
  if (!decision.allow) {
    return { ok: false, decision };
  }

const campfireById = new Map(input.campfires.map((c) => [c.id, c]));
  const activeSquadIds = new Set(
    input.memberships
      .filter((m) => m.stomperId === input.stomper.id && m.state === "active")
      .map((m) => m.squadId),
  );

  const memberships = input.memberships
    .filter((m) => m.stomperId === input.stomper.id)
    .map((m) => ({
      squadId: m.squadId,
      role: m.role,
      state: m.state,
      joinedAt: m.joinedAt,
      historyCutoffAt: m.historyCutoffAt,
      leftAt: m.leftAt,
    }));

  const visibleMessages: RiderPersonalExportJson["visibleMessages"] = [];
  for (const msg of input.messages) {
    const cf = campfireById.get(msg.campfireId);
    if (!cf || !activeSquadIds.has(cf.squadId)) continue;
    const mem = activeMembership(
      input.memberships,
      cf.squadId,
      input.stomper.id,
    );
    if (!messageVisibleToMembership(msg, mem)) continue;
    visibleMessages.push({
      id: msg.id,
      squadId: cf.squadId,
      createdAt: msg.createdAt,
      body: msg.state === "live" ? (msg.body ?? null) : null,
    });
  }

  const ownedMediaRefs = input.ownedMedia
    .filter((a) => a.ownerId === input.stomper.id)
    .map((a) => ({
      id: a.id,
      origin: a.origin,
      uploadedAt: a.uploadedAt,
      expiresAt: a.expiresAt,
      flag: a.flag,
    }));

  const exportPayload: RiderPersonalExportJson = {
    schema: "stomp.rider.personal.export.v1.fictional",
    exportedAt: input.exportedAtIso,
    fictionalOnly: true,
    physicalWipeGuaranteed: false,
    subject: {
      stomperId: input.stomper.id,
      displayName: input.stomper.displayName,
      handle: input.stomper.handle,
      accountStatus: input.stomper.accountStatus,
    },
    memberships,
    visibleMessages,
    ownedMediaRefs,
    notes: [
      "FICTIONAL export — not production GDPR tooling.",
      "G1: Day Sesh media clocks are recorded as-is; Campfire share never extends them.",
      "G2: Left Squads omit history; rejoin is prospective-only.",
      "G4: Logical revoke denies further export; physicalWipeGuaranteed=false.",
      "No live deletion jobs, legal holds, or payments activated.",
    ],
  };

  return { ok: true, decision, export: exportPayload };
}

/**
 * Simulate G4 confirmed deletion → immediate logical revoke, then prove export denies.
 * Does NOT enable physical erasure or deletion jobs.
 */
export function revokeThenDenyExport(args: {
  stomper: Stomper;
  memberships: Membership[];
  invites: Array<{ toStomperId: StomperId; status: string; id: string }>;
  nowIso: string;
  actorId: string;
}): {
  revoked: ReturnType<typeof revokeAccountAccess>;
  exportDecision: AuthzDecision;
} {
  const revoked = revokeAccountAccess({
    stomper: args.stomper,
    memberships: args.memberships,
    invites: args.invites,
    nowIso: args.nowIso,
  });
  const exportDecision = authorizePersonalExport({
    actorId: args.actorId,
    stomper: revoked.stomper,
  });
  return { revoked, exportDecision };
}
