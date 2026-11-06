/**
 * Character-scoped Locker options (t1232u).
 *
 * Modular riders only see plates that belong to their Franz pack.
 * Options without a real runtime WebP are marked unavailable with the
 * exact missing path — never invent cutouts or CSS recolors.
 */
import {
  BOARD_OFF_ITEM_ID,
  JACKET_OFF_ITEM_ID,
  buildPlateUrl,
  PLATE_SKIP_ITEM_IDS,
} from "@/lib/stomp/avatar/artwork";
import { itemById } from "@/lib/stomp/avatar/locker";
import { shippedPlatePathExists } from "@/lib/stomp/avatar/look2-plate-manifest";
import {
  isModularPrototypeStarter,
  modularRiderByStarterId,
} from "@/lib/stomp/avatar/modular-riders";
import { isAppearancePreviewStarter } from "@/lib/stomp/avatar/appearance-preview-riders";
import type { AgeBand, AvatarSlot, LockerItem } from "@/lib/stomp/avatar/types";

export type LockerOptionAvailability = {
  itemId: string;
  label: string;
  slot: AvatarSlot;
  /** True when the option may be equipped and will change the rendered plates. */
  visuallyAvailable: boolean;
  /** True when the item can sit in a collection without a visual plate. */
  collectionEligible: boolean;
  /** Exact runtime path when the plate is missing (honest reporting). */
  missingPlatePath: string | null;
  /** Why an option is disabled / non-visual. */
  reason:
    | "plate-present"
    | "intentional-off"
    | "locked-head-included"
    | "plate-missing"
    | "wrong-rider"
    | "appearance-preview-only"
    | "scaffold-generic";
};

type CatalogItem = Pick<LockerItem, "id" | "label" | "slot">;

/** Generic scaffold board plate — real file, not Franz per-character bindings. */
export const GENERIC_BOARD_VISUAL_ITEM_ID = "board-basic";
export const GENERIC_BOARD_PLATE_PATH = "/stomper/adult/board/board-basic@512.webp";

/** Generic scaffold backpack plate — real file, not Franz independent pack art. */
export const GENERIC_BACKPACK_VISUAL_ITEM_ID = "backpack-daypack";
export const GENERIC_BACKPACK_PLATE_PATH =
  "/stomper/adult/backpack/backpack-daypack@512.webp";

/** Catalog board ids that may join a collection even without character art. */
export const COLLECTION_BOARD_ITEM_IDS = [
  "board-basic",
  "board-park-graphic",
  "board-powder",
  "board-stomp-graphic",
  "board-none",
] as const;

function platePathFor(
  ageBand: AgeBand,
  slot: AvatarSlot,
  itemId: string,
): string {
  return buildPlateUrl(ageBand, slot, itemId, 512);
}

function modularItemIdsForRider(starterId: string): Set<string> | null {
  const rider = modularRiderByStarterId(starterId);
  if (!rider) return null;
  return new Set([
    rider.bodyItemId,
    rider.faceLockedItemId,
    rider.glovesItemId,
    rider.bootsItemId,
    rider.defaultJacketItemId,
    rider.defaultPantsItemId,
    rider.altJacketItemId,
    rider.altPantsItemId,
    JACKET_OFF_ITEM_ID,
    BOARD_OFF_ITEM_ID,
    GENERIC_BOARD_VISUAL_ITEM_ID,
    "backpack-none",
    GENERIC_BACKPACK_VISUAL_ITEM_ID,
    "hair-locked-included",
    "headwear-locked-included",
    "goggles-locked-included",
  ]);
}

/**
 * Resolve availability for one locker catalog item against the active starter.
 */
export function resolveLockerOption(opts: {
  starterId: string;
  ageBand?: AgeBand;
  item: Pick<CatalogItem, "id" | "label" | "slot">;
}): LockerOptionAvailability {
  const ageBand = opts.ageBand ?? "adult";
  const { starterId, item } = opts;
  const path = platePathFor(ageBand, item.slot, item.id);

  if (isAppearancePreviewStarter(starterId)) {
    return {
      itemId: item.id,
      label: item.label,
      slot: item.slot,
      visuallyAvailable: false,
      collectionEligible: item.slot === "board",
      missingPlatePath: path,
      reason: "appearance-preview-only",
    };
  }

  if (PLATE_SKIP_ITEM_IDS.has(item.id)) {
    const lockedHead = item.id.endsWith("-locked-included");
    return {
      itemId: item.id,
      label: item.label,
      slot: item.slot,
      visuallyAvailable: true,
      collectionEligible: item.slot === "board",
      missingPlatePath: null,
      reason: lockedHead ? "locked-head-included" : "intentional-off",
    };
  }

  if (isModularPrototypeStarter(starterId)) {
    const allowed = modularItemIdsForRider(starterId)!;
    if (!allowed.has(item.id)) {
      // Collection boards may still be owned without visual equip.
      const collectionBoard = item.slot === "board" &&
        (COLLECTION_BOARD_ITEM_IDS as readonly string[]).includes(item.id);
      const present = shippedPlatePathExists(path);
      return {
        itemId: item.id,
        label: item.label,
        slot: item.slot,
        visuallyAvailable: false,
        collectionEligible: collectionBoard,
        missingPlatePath: present ? null : path,
        reason: collectionBoard && !present ? "plate-missing" : "wrong-rider",
      };
    }

    if (item.id === GENERIC_BOARD_VISUAL_ITEM_ID) {
      const present = shippedPlatePathExists(GENERIC_BOARD_PLATE_PATH);
      return {
        itemId: item.id,
        label: item.label,
        slot: item.slot,
        visuallyAvailable: present,
        collectionEligible: true,
        missingPlatePath: present ? null : GENERIC_BOARD_PLATE_PATH,
        reason: present ? "scaffold-generic" : "plate-missing",
      };
    }

    if (item.id === GENERIC_BACKPACK_VISUAL_ITEM_ID) {
      const present = shippedPlatePathExists(GENERIC_BACKPACK_PLATE_PATH);
      return {
        itemId: item.id,
        label: item.label,
        slot: item.slot,
        visuallyAvailable: present,
        collectionEligible: false,
        missingPlatePath: present ? null : GENERIC_BACKPACK_PLATE_PATH,
        reason: present ? "scaffold-generic" : "plate-missing",
      };
    }

    const present = shippedPlatePathExists(path);
    return {
      itemId: item.id,
      label: item.label,
      slot: item.slot,
      visuallyAvailable: present,
      collectionEligible: item.slot === "board",
      missingPlatePath: present ? null : path,
      reason: present ? "plate-present" : "plate-missing",
    };
  }

  // Non-modular / legacy starters: plate presence decides visual equip.
  const present = shippedPlatePathExists(path);
  return {
    itemId: item.id,
    label: item.label,
    slot: item.slot,
    visuallyAvailable: present || PLATE_SKIP_ITEM_IDS.has(item.id),
    collectionEligible: item.slot === "board",
    missingPlatePath: present || PLATE_SKIP_ITEM_IDS.has(item.id) ? null : path,
    reason: present
      ? "plate-present"
      : PLATE_SKIP_ITEM_IDS.has(item.id)
        ? "intentional-off"
        : "plate-missing",
  };
}

/**
 * Modular jacket / pants / board options for the active rider (UI picker).
 * Hides wrong-rider plates so Woman 3 never lists Look 2 mint shells.
 */
export function modularSlotOptions(
  starterId: string,
  slot: AvatarSlot,
  ageBand: AgeBand = "adult",
): LockerOptionAvailability[] {
  const rider = modularRiderByStarterId(starterId);
  if (!rider) return [];

  const ids: string[] = [];
  if (slot === "jacket") {
    ids.push(JACKET_OFF_ITEM_ID, rider.defaultJacketItemId, rider.altJacketItemId);
  } else if (slot === "pants") {
    ids.push(rider.defaultPantsItemId, rider.altPantsItemId);
  } else if (slot === "gloves") {
    ids.push(rider.glovesItemId);
  } else if (slot === "boots") {
    ids.push(rider.bootsItemId);
  } else if (slot === "board") {
    ids.push(BOARD_OFF_ITEM_ID, GENERIC_BOARD_VISUAL_ITEM_ID);
    // Collection-only boards without character plates — listed disabled for visual.
    for (const id of COLLECTION_BOARD_ITEM_IDS) {
      if (id === BOARD_OFF_ITEM_ID || id === GENERIC_BOARD_VISUAL_ITEM_ID) continue;
      ids.push(id);
    }
  } else if (slot === "backpack") {
    ids.push("backpack-none", GENERIC_BACKPACK_VISUAL_ITEM_ID);
  } else if (slot === "hair" || slot === "headwear" || slot === "goggles") {
    ids.push(
      slot === "hair"
        ? "hair-locked-included"
        : slot === "headwear"
          ? "headwear-locked-included"
          : "goggles-locked-included",
    );
  } else {
    return [];
  }

  return ids.map((id) => {
    const item = itemById(id);
    return resolveLockerOption({
      starterId,
      ageBand,
      item: {
        id,
        label: item?.label ?? id,
        slot,
      },
    });
  });
}

/** Guard for equipItem — reject wrong-rider / missing visual plates. */
export function canVisuallyEquip(
  starterId: string,
  slot: AvatarSlot,
  itemId: string,
  ageBand: AgeBand = "adult",
): { ok: boolean; missingPlatePath: string | null; reason: LockerOptionAvailability["reason"] } {
  const item = itemById(itemId) ?? { id: itemId, label: itemId, slot };
  const resolved = resolveLockerOption({
    starterId,
    ageBand,
    item: { id: item.id, label: item.label, slot },
  });
  return {
    ok: resolved.visuallyAvailable,
    missingPlatePath: resolved.missingPlatePath,
    reason: resolved.reason,
  };
}

/**
 * Honest modular character plate matrix for docs / CI (disk + manifest only).
 */
export function modularCharacterPlateMatrix(): Array<{
  slotLabel: string;
  starterId: string;
  createStatus: string;
  baseBody: string;
  jacket: string;
  pants: string;
  gloves: string;
  boots: string;
  hairHeadwear: string;
  snowboardBindings: string;
  notes: string;
}> {
  const rows = [
    {
      slotLabel: "Woman 1",
      starterId: "f-nova",
      createStatus: "PARTIAL · SOURCE_APPEARANCE_PREVIEW_ONLY · on Create",
      baseBody: "FLATTENED preview only",
      jacket: "ABSENT (baked into appearance-preview)",
      pants: "ABSENT (baked into appearance-preview)",
      gloves: "ABSENT",
      boots: "ABSENT",
      hairHeadwear: "ABSENT (baked)",
      snowboardBindings: "ABSENT",
      notes: "SOURCE_APPEARANCE_PREVIEW_ONLY — no modular swaps",
    },
    {
      slotLabel: "Woman 2",
      starterId: "f-hana",
      createStatus: "OPEN prototype · QA only · omitted from Create",
      baseBody: "PRESENT body-athletic@512.webp (provisional underbody ART)",
      jacket: "PRESENT jacket-look2-mint / jacket-look2-ink",
      pants: "PRESENT pants-look2-mint (v2) / pants-look2-ink",
      gloves: "PRESENT gloves-look2-photo",
      boots: "PRESENT boots-look2-photo",
      hairHeadwear: "LOCKED composite face-f-hana — no separate hair/helmet/goggles",
      snowboardBindings: "ABSENT (board-none default; generic board-basic scaffold only)",
      notes: "OPEN — ingested for QA; do not use as Create demo working STOMPER",
    },
    {
      slotLabel: "Woman 3",
      starterId: "f-priya",
      createStatus: "PARTIAL · REGISTERED_VISUAL_PROTOTYPE_ONLY · on Create",
      baseBody: "PRESENT body-look3-solid@512.webp (provisional underbody ART)",
      jacket: "PRESENT jacket-look3-purple (v2) / jacket-look3-fuchsia (TEST)",
      pants: "PRESENT pants-look3-purple (v2) / pants-look3-charcoal (TEST)",
      gloves: "PRESENT gloves-look3-photo",
      boots: "PRESENT boots-look3-photo",
      hairHeadwear: "LOCKED composite face-f-priya — no separate hair/helmet/goggles",
      snowboardBindings: "ABSENT character board; generic board-basic@512.webp scaffold only",
      notes: "Best Create-visible modular adult for t1232u demo",
    },
    {
      slotLabel: "Man 1 / Rider 1",
      starterId: "m-samir",
      createStatus: "OPEN prototype · QA only · omitted from Create",
      baseBody: "PRESENT body-look1-male@512.webp (provisional underbody ART)",
      jacket: "PRESENT jacket-look1-tan / jacket-look1-orange (TEST)",
      pants: "PRESENT pants-look1-black / pants-look1-charcoal (TEST)",
      gloves: "PRESENT gloves-look1-photo (v2 fill QUARANTINED — not ingested)",
      boots: "PRESENT boots-look1-photo",
      hairHeadwear: "LOCKED composite face-m-samir — no separate hair/helmet/goggles",
      snowboardBindings: "ABSENT character board; generic board-basic scaffold only",
      notes: "OPEN — Rider 1 exists as QA ingest; not Create",
    },
    {
      slotLabel: "Man 2 / Look 4",
      starterId: "m-devon",
      createStatus: "PARTIAL · on Create · NOT owner visual PASS",
      baseBody: "PRESENT body-look4-lean@512.webp (provisional underbody ART)",
      jacket: "PRESENT jacket-look4-orange (v2) / jacket-look4-white (FIT TEST ≠ Man 3)",
      pants: "PRESENT pants-look4-charcoal / pants-look4-charcoal-silver (TEST)",
      gloves: "PRESENT gloves-look4-photo",
      boots: "PRESENT boots-look4-photo",
      hairHeadwear: "LOCKED composite face-m-devon — no separate hair/helmet/goggles",
      snowboardBindings: "ABSENT character board; generic board-basic scaffold only",
      notes: "Modular but NOT owner visual PASS — prefer Woman 3 for demo",
    },
    {
      slotLabel: "Man 3",
      starterId: "m-leo",
      createStatus: "PARTIAL · SOURCE_APPEARANCE_PREVIEW_ONLY · on Create",
      baseBody: "FLATTENED preview only",
      jacket: "ABSENT (baked)",
      pants: "ABSENT (baked)",
      gloves: "ABSENT",
      boots: "ABSENT",
      hairHeadwear: "ABSENT (baked)",
      snowboardBindings: "ABSENT",
      notes: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    },
    {
      slotLabel: "Grom 1",
      starterId: "g-milo",
      createStatus: "PARTIAL · SOURCE_APPEARANCE_PREVIEW_ONLY · on Create · fictional",
      baseBody: "FLATTENED preview only",
      jacket: "ABSENT (baked)",
      pants: "ABSENT (baked)",
      gloves: "ABSENT",
      boots: "ABSENT",
      hairHeadwear: "ABSENT (baked)",
      snowboardBindings: "ABSENT",
      notes: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    },
    {
      slotLabel: "Grom 2",
      starterId: "g-aria",
      createStatus: "PARTIAL · SOURCE_APPEARANCE_PREVIEW_ONLY · on Create · fictional",
      baseBody: "FLATTENED preview only",
      jacket: "ABSENT (baked)",
      pants: "ABSENT (baked)",
      gloves: "ABSENT",
      boots: "ABSENT",
      hairHeadwear: "ABSENT (baked)",
      snowboardBindings: "ABSENT",
      notes: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    },
  ];
  return rows;
}
