/**
 * Avatar Locker catalog + unlock rules.
 * Essential safety gear is NEVER locked. No pay-to-win.
 */
import type { LockerItem, ProgressionStage, StylePath, UnlockRecord } from "@/lib/stomp/avatar/types";

export const LOCKER_CATALOG: LockerItem[] = [
  // Safety — always unlocked
  { id: "helmet-basic", slot: "headwear", label: "Trail Helmet", stage: 1, isSafety: true, fill: "#0f172a", unlockRule: "starter" },
  { id: "goggles-basic", slot: "goggles", label: "Clear Day Goggles", stage: 1, isSafety: true, fill: "#5ec8ff", unlockRule: "starter" },
  { id: "gloves-basic", slot: "gloves", label: "All-Mountain Gloves", stage: 1, isSafety: true, fill: "#1e293b", unlockRule: "starter" },
  { id: "boots-basic", slot: "boots", label: "Soft Boots", stage: 1, isSafety: true, fill: "#334155", unlockRule: "starter" },
  // Starter cosmetics
  { id: "jacket-basic", slot: "jacket", label: "Everyday Shell", stage: 1, isSafety: false, fill: "#2ad4c2", unlockRule: "starter" },
  { id: "pants-basic", slot: "pants", label: "Ride Pants", stage: 1, isSafety: false, fill: "#1e293b", unlockRule: "starter" },
  { id: "board-basic", slot: "board", label: "First Board", stage: 1, isSafety: false, fill: "#d6f25a", unlockRule: "starter" },
  { id: "hair-undercut", slot: "hair", label: "Undercut", stage: 1, isSafety: false, fill: "#1a1a1a", unlockRule: "starter" },
  { id: "hair-braids", slot: "hair", label: "Braids", stage: 1, isSafety: false, fill: "#4a2c0a", unlockRule: "starter" },
  { id: "hair-bob", slot: "hair", label: "Bob", stage: 1, isSafety: false, fill: "#c2410c", unlockRule: "starter" },
  { id: "hair-ponytail", slot: "hair", label: "Ponytail", stage: 1, isSafety: false, fill: "#78350f", unlockRule: "starter" },
  { id: "hair-curls", slot: "hair", label: "Curls", stage: 1, isSafety: false, fill: "#292524", unlockRule: "starter" },
  { id: "hair-straight", slot: "hair", label: "Straight", stage: 1, isSafety: false, fill: "#0c0a09", unlockRule: "starter" },
  { id: "hair-fade", slot: "hair", label: "Fade", stage: 1, isSafety: false, fill: "#1c1917", unlockRule: "starter" },
  { id: "hair-messy", slot: "hair", label: "Messy", stage: 1, isSafety: false, fill: "#78716c", unlockRule: "starter" },
  { id: "hair-locs", slot: "hair", label: "Locs", stage: 1, isSafety: false, fill: "#292524", unlockRule: "starter" },
  { id: "hair-short", slot: "hair", label: "Short", stage: 1, isSafety: false, fill: "#0c0a09", unlockRule: "starter" },
  { id: "hair-buzz", slot: "hair", label: "Buzz", stage: 1, isSafety: false, fill: "#44403c", unlockRule: "starter" },
  { id: "hair-beard-short", slot: "hair", label: "Short + Beard", stage: 1, isSafety: false, fill: "#57534e", unlockRule: "starter" },
  { id: "hair-pigtails", slot: "hair", label: "Pigtails", stage: 1, isSafety: false, fill: "#92400e", unlockRule: "starter" },
  { id: "face-female", slot: "face", label: "Face A", stage: 1, isSafety: false, fill: "#f1c27d", unlockRule: "starter" },
  { id: "face-male", slot: "face", label: "Face B", stage: 1, isSafety: false, fill: "#e0ac69", unlockRule: "starter" },
  { id: "body-compact", slot: "body", label: "Compact", stage: 1, isSafety: false, fill: "#f1c27d", unlockRule: "starter" },
  { id: "body-athletic", slot: "body", label: "Athletic", stage: 1, isSafety: false, fill: "#e0ac69", unlockRule: "starter" },
  { id: "body-tall", slot: "body", label: "Tall", stage: 1, isSafety: false, fill: "#c68642", unlockRule: "starter" },
  { id: "body-broad", slot: "body", label: "Broad", stage: 1, isSafety: false, fill: "#8d5524", unlockRule: "starter" },
  { id: "body-lean", slot: "body", label: "Lean", stage: 1, isSafety: false, fill: "#ffdbac", unlockRule: "starter" },
  { id: "body-solid", slot: "body", label: "Solid", stage: 1, isSafety: false, fill: "#a0522d", unlockRule: "starter" },
  // Stage 2 cosmetics (unlock via activity)
  {
    id: "jacket-park-bold",
    slot: "jacket",
    label: "Park Bold Shell",
    stage: 2,
    stylePath: "park-street",
    isSafety: false,
    fill: "#ff3b78",
    unlockRule: "activity",
  },
  {
    id: "jacket-freeride",
    slot: "jacket",
    label: "Freeride Shell",
    stage: 2,
    stylePath: "mountain-freeride",
    isSafety: false,
    fill: "#0369a1",
    unlockRule: "activity",
  },
  {
    id: "board-park-graphic",
    slot: "board",
    label: "Park Graphic",
    stage: 2,
    stylePath: "park-street",
    isSafety: false,
    fill: "#fb923c",
    unlockRule: "participation",
  },
  {
    id: "board-powder",
    slot: "board",
    label: "Powder Shape",
    stage: 2,
    stylePath: "mountain-freeride",
    isSafety: false,
    fill: "#e0f2fe",
    unlockRule: "participation",
  },
  // Stage 3
  {
    id: "jacket-signature",
    slot: "jacket",
    label: "Signature Shell",
    stage: 3,
    stylePath: "any",
    isSafety: false,
    fill: "#a855f7",
    unlockRule: "milestone",
  },
  {
    id: "beanie-soft",
    slot: "headwear",
    label: "Soft Beanie",
    stage: 2,
    isSafety: false,
    fill: "#334155",
    unlockRule: "activity",
  },
];

const SAFETY_IDS = new Set(LOCKER_CATALOG.filter((i) => i.isSafety).map((i) => i.id));

export function isSafetyItem(itemId: string): boolean {
  return SAFETY_IDS.has(itemId) || LOCKER_CATALOG.find((i) => i.id === itemId)?.isSafety === true;
}

export function itemById(id: string): LockerItem | undefined {
  return LOCKER_CATALOG.find((i) => i.id === id);
}

export function starterUnlocks(nowIso = new Date().toISOString()): UnlockRecord[] {
  return LOCKER_CATALOG.filter((i) => i.unlockRule === "starter").map((i) => ({
    itemId: i.id,
    source: "starter" as const,
    earnedAtIso: nowIso,
  }));
}

export function isUnlocked(itemId: string, unlocks: UnlockRecord[]): boolean {
  if (isSafetyItem(itemId)) return true;
  return unlocks.some((u) => u.itemId === itemId);
}

export function unlockedForSlot(
  slot: LockerItem["slot"],
  unlocks: UnlockRecord[],
  stage: ProgressionStage,
  stylePath?: StylePath,
): LockerItem[] {
  return LOCKER_CATALOG.filter((i) => {
    if (i.slot !== slot) return false;
    if (i.stage > stage && !i.isSafety) return false;
    if (i.stylePath && i.stylePath !== "any" && stylePath && i.stylePath !== stylePath) {
      // Mixing equipment is allowed — still show if unlocked
      if (!isUnlocked(i.id, unlocks) && !i.isSafety) return false;
    }
    return isUnlocked(i.id, unlocks) || i.isSafety;
  });
}

/** Activity-based unlock — casual-friendly, not pay-to-win. */
export function unlockForActivity(
  unlocks: UnlockRecord[],
  itemId: string,
  source: UnlockRecord["source"] = "activity",
): UnlockRecord[] {
  if (unlocks.some((u) => u.itemId === itemId)) return unlocks;
  const item = itemById(itemId);
  if (!item) return unlocks;
  if (item.isSafety) return unlocks; // already free
  return [...unlocks, { itemId, source, earnedAtIso: new Date().toISOString() }];
}

export const BACKGROUNDS = [
  { id: "bg-park", label: "Colorado Park", fill: "#1e3a5f" },
  { id: "bg-powder", label: "Utah Powder", fill: "#e2e8f0" },
  { id: "bg-vt-trees", label: "Vermont Trees", fill: "#14532d" },
  { id: "bg-pnw", label: "PNW Forest", fill: "#064e3b" },
  { id: "bg-local", label: "Local Hill", fill: "#334155" },
  { id: "bg-village", label: "Resort Village", fill: "#44403c" },
  { id: "bg-sunset", label: "Sunset", fill: "#9a3412" },
  { id: "bg-night", label: "Night Riding", fill: "#020617" },
  { id: "bg-snow-park", label: "Snow Park", fill: "#0ea5e9" },
] as const;

export const POSES = ["idle", "wave", "fist-pump", "board-lift", "celebrate", "turn"] as const;
export type PoseId = (typeof POSES)[number];
