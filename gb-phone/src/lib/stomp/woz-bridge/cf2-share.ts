/**
 * Additive CF-2 / SV-0 share bridge (t1165u) — preview-facing re-exports only.
 *
 * BANNER: Client / Rider Hub checks are NEVER production security.
 * Does not alter Home, five-tab nav, greet/Crew Invite, or branding.
 * Does not enable youth, payments, live auth, or deletion jobs.
 */
export {
  assertSingleSquad,
  prepareShare,
  confirmShare,
  cancelShare,
  discardShare,
  shareWouldPost,
  rejectMultiSquadShare,
} from "@woz/campfire/share.js";

export {
  SESH_PENDING_TTL_MS,
  PendingStore,
} from "@woz/campfire/sesh-pending.js";

export { claimPendingConfirmation } from "@woz/campfire/sesh-voice.js";

export {
  recheckShareIntent,
  recheckBeforeSend,
} from "@woz/campfire/sesh-recheck.js";

export {
  beginQuickShare,
  confirmQuickShare,
  createWorld,
} from "@woz/campfire/world.js";

export {
  authorizePrepareShare,
  authorizeConfirmShare,
  authorizeCampfireAccess,
  authorizeOwnStomper,
  RIDER_HUB_SHARE_MS,
  RIDER_HUB_BRIDGE_TABLE,
  adviceFor,
} from "@woz/shared/index.js";

/** Contract constants mirrored for preview callers. */
export const CF2_SHARE_MS = 20_000 as const;
