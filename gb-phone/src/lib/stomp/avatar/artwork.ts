/**
 * Artwork plate URL + layering contract (t1170u foundation → t1171u v2.4).
 * Prefer plate WebP by layer itemId; AvatarRenderer falls back to SVG when
 * the plate is missing (until GB delivers modular transparent masters).
 *
 * HARD: do not crop the Final Roster v2.4 composite poster into fake layers.
 */
import type { AgeBand, AvatarSlot } from "@/lib/stomp/avatar/types";

export const ARTWORK_MASTER_SIZE = 1024;
export const ARTWORK_RUNTIME_SIZE = 512;

/** Paint order bottom → top (matches AvatarRenderer composite). */
export const ARTWORK_LAYER_ORDER: readonly AvatarSlot[] = [
  "board",
  "boots",
  "pants",
  "body",
  "face",
  "jacket",
  "backpack",
  "gloves",
  "hair",
  "headwear",
  "goggles",
] as const;

export type ArtworkSize = 512 | 1024;

export type PlateResolveResult =
  | { mode: "plate"; url: string; slot: AvatarSlot; itemId: string }
  | { mode: "svg-fallback"; slot: AvatarSlot; itemId: string; reason: "missing-plate" | "backpack-off" };

/**
 * Canonical plate path — itemId MUST match LOCKER_CATALOG.id / layer.itemId.
 * Examples:
 *   stomper/adult/jacket/jacket-basic@512.webp
 *   stomper/adult/goggles/glasses-meta-oakley@512.webp
 *   stomper/adult/starter/m-samir/preview@512.webp
 */
export function buildPlateUrl(
  ageBand: AgeBand,
  slot: AvatarSlot,
  itemId: string,
  size: ArtworkSize = ARTWORK_RUNTIME_SIZE,
): string {
  return `/stomper/${ageBand}/${slot}/${itemId}@${size}.webp`;
}

export function buildStarterPreviewUrl(
  ageBand: AgeBand,
  starterId: string,
  size: ArtworkSize = ARTWORK_RUNTIME_SIZE,
): string {
  return `/stomper/${ageBand}/starter/${starterId}/preview@${size}.webp`;
}

export function buildMasterPlateUrl(ageBand: AgeBand, slot: AvatarSlot, itemId: string): string {
  return buildPlateUrl(ageBand, slot, itemId, ARTWORK_MASTER_SIZE);
}

/** Sentinel: backpack OFF by default — no plate, no draw. */
export const BACKPACK_OFF_ITEM_ID = "backpack-none";

/**
 * Resolve how a slot should render. Without real assets on disk we always
 * report svg-fallback (contract for AvatarRenderer). When GB drops plates
 * under /public/stomper/…, callers may probe existence and prefer `plate`.
 */
export function resolveLayerPlate(opts: {
  ageBand: AgeBand;
  slot: AvatarSlot;
  itemId: string;
  /** Optional existence probe — return true when the WebP is fetchable. */
  plateExists?: (url: string) => boolean;
  size?: ArtworkSize;
}): PlateResolveResult {
  const { ageBand, slot, itemId, plateExists, size = ARTWORK_RUNTIME_SIZE } = opts;
  if (slot === "backpack" && (itemId === BACKPACK_OFF_ITEM_ID || !itemId)) {
    return { mode: "svg-fallback", slot, itemId: BACKPACK_OFF_ITEM_ID, reason: "backpack-off" };
  }
  const url = buildPlateUrl(ageBand, slot, itemId, size);
  if (plateExists?.(url)) {
    return { mode: "plate", url, slot, itemId };
  }
  return { mode: "svg-fallback", slot, itemId, reason: "missing-plate" };
}

/** Compression budgets (from ARTWORK-INTEGRATION-SPEC). */
export const ARTWORK_BUDGETS = {
  layerWebpTypicalKb: 40,
  layerWebpHardKb: 80,
  starterPreviewWebpKb: 120,
  firstPaintAdultPreviewSetMb: 1.5,
} as const;

/** Eyewear option IDs on the goggles slot. */
export const EYEWEAR_ITEM_IDS = {
  goggles: "goggles-basic",
  glassesMetaOakley: "glasses-meta-oakley",
} as const;

/** Original STOMP board graphic IDs (no third-party marks). */
export const STOMP_BOARD_ITEM_IDS = [
  "board-basic",
  "board-park-graphic",
  "board-powder",
  "board-stomp-graphic",
] as const;
