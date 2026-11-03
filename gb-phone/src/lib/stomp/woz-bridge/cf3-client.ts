/**
 * CF-3 Campfire client bridge (t1190u) — preview-facing re-exports.
 *
 * BANNER: Client / Rider checks are NEVER production security.
 * Does not alter Home, five-tab nav, greet/Crew Invite, or branding.
 * Does not enable youth, payments, live auth, or deletion jobs.
 */
export {
  CampfireClient,
  createCampfireClient,
  CF3_CLIENT_STATUS,
  type CampfireListItem,
  type ThreadRow,
  type QuickShareDraft,
  type TombstoneKind,
  type CampfireClientSnapshot,
  type SoftCapInviteResult,
  type HistoryCutoffInfo,
  type MediaClockSnapshot,
} from "@woz/campfire/client-adapter.js";

export {
  CF3_CLIENT_SHELL_STATUS,
  GB_CAMPFIRE_CONTRACT_METHODS,
  GROK_BUILD_CAMPFIRE_BRIDGE_STATUS,
} from "@woz/campfire/gb-contract.js";

export {
  IDS as CF3_IDS,
  FORMER_STOMPER_LABEL,
  AUTHOR_REMOVED_TOMBSTONE,
  SQUAD_SOFT_CAP,
  YOUTH_CAMPFIRE_ENABLED,
  SESH_PENDING_TTL_MS,
  daySeshMediaExpiresAt,
  assertShareDoesNotExtendMediaClock,
  createWorld,
} from "@woz/campfire/cf2-index.js";
