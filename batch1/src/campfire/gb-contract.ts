/**
 * Grok Build Campfire bridge — INTERFACE CONTRACT ONLY (HELD).
 * No GB shell / phone preview edits in this batch.
 * See GROK-BUILD-CAMPFIRE-BRIDGE-POLICY-LOCK.txt (t1147u).
 */
import type { GrokBuildCampfireContract } from "./cf2-types.js";

export const GROK_BUILD_CAMPFIRE_BRIDGE_STATUS = "HELD" as const;

/**
 * Surface GB would eventually consume once Ted Go + separate GB unfreeze.
 * Not wired to gb-phone; documentation + type-only anchor.
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
