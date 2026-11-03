/**
 * Grok Build Campfire bridge — CF-3 client shell may wire preview adapters
 * (t1190u). Live authz / deletion jobs / youth / payments remain HELD.
 * See GROK-BUILD-CAMPFIRE-BRIDGE-POLICY-LOCK.txt (t1147u) + CF-3 REPORT.
 */
import type { GrokBuildCampfireContract } from "./cf2-types.js";

/** Contract catalog remains the source of method names; CF-3 wires a fictional client adapter. */
export const GROK_BUILD_CAMPFIRE_BRIDGE_STATUS = "HELD" as const;

/** Preview-only CF-3 client shell status (does not activate live GB paste). */
export const CF3_CLIENT_SHELL_STATUS = "PREVIEW_WIRED" as const;

/**
 * Surface GB eventually consumes. CF-3 preview wires these via CampfireClient;
 * live GB paste / production authz stay HELD.
 */
export const GB_CAMPFIRE_CONTRACT_METHODS = [
  "listMyCampfires",
  "readCampfire",
  "postMessage",
  "react",
  "prepareShare",
  "confirmShare",
  "cancelShare",
  "fileReport",
  "renderForViewer",
  "revealCollapsed",
  "deleteOwnMessage",
  "leaveSquad",
  "block",
  "unblock",
] as const;

export type GbCampfireMethod = (typeof GB_CAMPFIRE_CONTRACT_METHODS)[number];

/** Type-only placeholder — do not activate against GB shell. */
export type HeldGrokBuildCampfireApi = GrokBuildCampfireContract;

export const GB_CAMPFIRE_EXCLUSIONS = [
  "auth",
  "live_data",
  "push",
  "upload",
  "moderation_execution",
  "legal_hold",
  "deletion_jobs",
  "youth",
  "capture_studio",
  "kiosks",
  "other_sports",
  "new_nav",
] as const;
