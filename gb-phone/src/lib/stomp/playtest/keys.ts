/**
 * Known localStorage keys touched by STOMP demo surfaces (family playtest reset).
 * Prefixes catch modular rider locker slices without listing every starter id.
 */

export const PLAYTEST_STORAGE_KEYS = [
  "stomp-line",
  "stomp-avatar-locker",
  "stomp-avatar-theme",
  "stomp-trip-hub",
  "stomp-bag",
  "stomp-favorites",
  "stomp-music-sources",
  "stomp-offline-packs",
  "stomp.demo.lastActiveIso",
  "stomp.playtest.feedback",
  "stomp.playtest.seed-version",
  "stomp.home-mountain",
  "stomp-woz",
  "stomp.woz.lastExportIso",
] as const;

export const PLAYTEST_STORAGE_PREFIXES = [
  "stomp-avatar-rider-",
  "stomp.woz.",
  "stomp.playtest.",
] as const;

export const PLAYTEST_SEED_VERSION = "t1210u-v1";
