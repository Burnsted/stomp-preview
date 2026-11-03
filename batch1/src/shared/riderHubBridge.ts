/**
 * Rider Hub ↔ batch1 contract bridge (t1165u) — COMPARE-DON'T-REBUILD adapter.
 *
 * Maps preview DEMO social.ts claims onto batch1 deny/allow codes without
 * replacing Rider Hub UI or inventing server authz. Client flags remain DEMO ONLY.
 *
 * BANNER: Never treat Rider Hub / social.ts results as production security.
 */
import type { AuthzDenyCode } from "./fictionalAuthz.js";

/** Claimed demo operations from gb-phone social.ts (stable string ids). */
export type RiderHubDemoOp =
  | "save_avatar"
  | "join_trip"
  | "decline_trip"
  | "join_squad"
  | "leave_squad"
  | "post_note"
  | "stage_share"
  | "confirm_share"
  | "cancel_share"
  | "start_day"
  | "finish_day"
  | "set_pass_viewer"
  | "set_pass_expired";

export type RiderHubBridgeAdvice = {
  demoOp: RiderHubDemoOp;
  /** batch1 surface that owns the real rule */
  batch1Surface:
    | "shared.ids"
    | "trips.eligibility"
    | "daysesh.lifecycle"
    | "campfireCf2.guards"
    | "campfireCf2.share"
    | "campfireCf2.sesh"
    | "shared.fictionalAuthz";
  /** Expected production-facing deny code if server authz were wired */
  expectedAuthzCode: AuthzDenyCode | "ok" | "needs_confirm";
  note: string;
};

/**
 * Static reconciliation table — documents contradictions without mutating social.ts.
 * Prefer adapters (A1–A6 + fictionalAuthz) over duplicating policy in the phone demo.
 */
export const RIDER_HUB_BRIDGE_TABLE: readonly RiderHubBridgeAdvice[] = [
  {
    demoOp: "save_avatar",
    batch1Surface: "shared.ids",
    expectedAuthzCode: "ok",
    note: "Demo jacket avatar ≠ Woz STOMPER gate. Keep greet STOMPER-first; hub avatar is additive demo.",
  },
  {
    demoOp: "join_trip",
    batch1Surface: "trips.eligibility",
    expectedAuthzCode: "pass_inactive",
    note: "social.ts blocks on avatar-null; batch1 requires active Rider Pass via canJoinAsRider.",
  },
  {
    demoOp: "decline_trip",
    batch1Surface: "trips.eligibility",
    expectedAuthzCode: "ok",
    note: "Local invited flag only — no delivered invite server-side yet.",
  },
  {
    demoOp: "join_squad",
    batch1Surface: "campfireCf2.guards",
    expectedAuthzCode: "not_member",
    note: "Demo local join; CF-2 requires membership records + youth/erasure gates.",
  },
  {
    demoOp: "leave_squad",
    batch1Surface: "campfireCf2.guards",
    expectedAuthzCode: "ok",
    note: "Leave ≠ erase messages; Campfire persists (1 Campfire/Squad).",
  },
  {
    demoOp: "post_note",
    batch1Surface: "campfireCf2.guards",
    expectedAuthzCode: "not_member",
    note: "Demo canPost uses passRole/avatar; CF-2 canAccessCampfire is membership-based.",
  },
  {
    demoOp: "stage_share",
    batch1Surface: "campfireCf2.share",
    expectedAuthzCode: "multi_recipient",
    note: "Demo stages one squad; batch1 assertSingleSquad + beginQuickShare enforce len===1.",
  },
  {
    demoOp: "confirm_share",
    batch1Surface: "campfireCf2.sesh",
    expectedAuthzCode: "needs_confirm",
    note: "Demo SHARE_MS=20000 matches SESH_PENDING_TTL_MS; SV-0 also requires membership/media/session recheck + CAS.",
  },
  {
    demoOp: "cancel_share",
    batch1Surface: "campfireCf2.share",
    expectedAuthzCode: "ok",
    note: "cancelShare clears draft/intent; no post.",
  },
  {
    demoOp: "start_day",
    batch1Surface: "daysesh.lifecycle",
    expectedAuthzCode: "pass_inactive",
    note: "Day Sesh isolated from Trip; Pass required; close must leave Campfire untouched.",
  },
  {
    demoOp: "finish_day",
    batch1Surface: "daysesh.lifecycle",
    expectedAuthzCode: "ok",
    note: "closeDaySesh → campfireEffects: [] always.",
  },
  {
    demoOp: "set_pass_viewer",
    batch1Surface: "shared.fictionalAuthz",
    expectedAuthzCode: "not_member",
    note: "Client passRole=viewer is DEMO ONLY — server must deny join/post.",
  },
  {
    demoOp: "set_pass_expired",
    batch1Surface: "shared.fictionalAuthz",
    expectedAuthzCode: "pass_inactive",
    note: "Client passExpired is DEMO ONLY — server must recheck Pass window.",
  },
] as const;

export function adviceFor(op: RiderHubDemoOp): RiderHubBridgeAdvice {
  const hit = RIDER_HUB_BRIDGE_TABLE.find((row) => row.demoOp === op);
  if (!hit) {
    throw new Error(`No Rider Hub bridge advice for ${op}`);
  }
  return hit;
}

/** SHARE_MS lock shared with social.ts / SESH_PENDING_TTL_MS. */
export const RIDER_HUB_SHARE_MS = 20_000;
