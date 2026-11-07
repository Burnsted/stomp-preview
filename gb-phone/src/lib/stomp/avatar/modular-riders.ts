/**
 * Multi-rider registered visual prototype registry (t1205u).
 *
 * Extends Look 2 (f-hana / Woman 2) patterns so Man 1, Woman 3, and Man 2
 * (Look 4) coexist as independent modular riders. Status remains
 * REGISTERED_VISUAL_PROTOTYPE_ONLY — never Android PASS / acceptanceEligible.
 *
 * Slot labels only in user-facing language: Stomper Man/Woman N.
 * Technical starterIds (m-samir / f-hana / f-priya / m-devon) stay in paths.
 */
import {
  BACKPACK_OFF_ITEM_ID,
  BOARD_OFF_ITEM_ID,
  JACKET_OFF_ITEM_ID,
  buildPlateUrl,
  buildStarterPreviewUrl,
} from "@/lib/stomp/avatar/artwork";
import {
  LOOK2_BOOTS_PHOTO_ITEM_ID,
  LOOK2_FACE_LOCKED_ITEM_ID,
  LOOK2_GATE_STATUS,
  LOOK2_GLOVES_PHOTO_ITEM_ID,
  LOOK2_JACKET_FILL,
  LOOK2_JACKET_INK_ITEM_ID,
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_FILL,
  LOOK2_PANTS_INK_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_INK_JACKET_FILL,
  LOOK2_INK_PANTS_FILL,
  LOOK2_STARTER_ID,
  look2PrototypeLayers,
} from "@/lib/stomp/avatar/look2-acceptance";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import type { AvatarConfig, AvatarLayers } from "@/lib/stomp/avatar/types";

export type ModularSlotLabel =
  | "Stomper Man One"
  | "Stomper Woman Two"
  | "Stomper Woman Three"
  | "Stomper Man Two";
export type ModularAbcVariant = "A" | "B" | "C";

export type ModularRiderDef = {
  starterId: string;
  lookKey: string;
  lookIndex1Based: number;
  /** User-facing slot label only — never a personal displayName. */
  slotLabel: ModularSlotLabel;
  status: "REGISTERED_VISUAL_PROTOTYPE_ONLY";
  /** Owner visual review state — Man 2 is explicitly NOT reviewed. */
  ownerVisualReview: "LOOK2_PRESERVED" | "OWNER_REVIEW_REQUIRED" | "NOT_OWNER_REVIEWED";
  androidQa: "NOT_RUN";
  androidAccepted: false;
  acceptanceEligible: false;
  bodyItemId: string;
  faceLockedItemId: string;
  glovesItemId: string;
  bootsItemId: string;
  defaultJacketItemId: string;
  defaultPantsItemId: string;
  defaultJacketFill: string;
  defaultPantsFill: string;
  /** Alternate / fit-test outfit (variant C). */
  altJacketItemId: string;
  altPantsItemId: string;
  altJacketFill: string;
  altPantsFill: string;
  altIsTestOnly: true;
  sourceZipSha256: string;
  missingProductionSlots: readonly string[];
};

/** Production gaps shared by every Franz 8-of-11 registered pack. */
export const MODULAR_SHARED_MISSING_SLOTS = [
  "hair (separated)",
  "headwear (separated)",
  "goggles (separated)",
  "board (real bindings)",
  "backpack (independent plate)",
] as const;

export const MODULAR_RIDERS: readonly ModularRiderDef[] = [
  {
    starterId: "m-samir",
    lookKey: "adult-look-1",
    lookIndex1Based: 1,
    slotLabel: "Stomper Man One",
    status: "REGISTERED_VISUAL_PROTOTYPE_ONLY",
    ownerVisualReview: "OWNER_REVIEW_REQUIRED",
    androidQa: "NOT_RUN",
    androidAccepted: false,
    acceptanceEligible: false,
    bodyItemId: "body-look1-male",
    faceLockedItemId: "face-m-samir-locked-composite",
    glovesItemId: "gloves-look1-photo",
    bootsItemId: "boots-look1-photo",
    defaultJacketItemId: "jacket-look1-tan",
    defaultPantsItemId: "pants-look1-black",
    defaultJacketFill: "#c4a574",
    defaultPantsFill: "#0f172a",
    altJacketItemId: "jacket-look1-orange",
    altPantsItemId: "pants-look1-charcoal",
    altJacketFill: "#ea580c",
    altPantsFill: "#1f2937",
    altIsTestOnly: true,
    sourceZipSha256:
      "5105bcea04ab2b27eb0708e3aaa207b5d17ba1b8c72e1300416db654b93d534e",
    missingProductionSlots: MODULAR_SHARED_MISSING_SLOTS,
  },
  {
    starterId: LOOK2_STARTER_ID,
    lookKey: "adult-look-2",
    lookIndex1Based: 2,
    slotLabel: "Stomper Woman Two",
    status: "REGISTERED_VISUAL_PROTOTYPE_ONLY",
    ownerVisualReview: "LOOK2_PRESERVED",
    androidQa: "NOT_RUN",
    androidAccepted: false,
    acceptanceEligible: false,
    bodyItemId: "body-athletic",
    faceLockedItemId: LOOK2_FACE_LOCKED_ITEM_ID,
    glovesItemId: LOOK2_GLOVES_PHOTO_ITEM_ID,
    bootsItemId: LOOK2_BOOTS_PHOTO_ITEM_ID,
    defaultJacketItemId: LOOK2_JACKET_ITEM_ID,
    defaultPantsItemId: LOOK2_PANTS_ITEM_ID,
    defaultJacketFill: LOOK2_JACKET_FILL,
    defaultPantsFill: LOOK2_PANTS_FILL,
    altJacketItemId: LOOK2_JACKET_INK_ITEM_ID,
    altPantsItemId: LOOK2_PANTS_INK_ITEM_ID,
    altJacketFill: LOOK2_INK_JACKET_FILL,
    altPantsFill: LOOK2_INK_PANTS_FILL,
    altIsTestOnly: true,
    sourceZipSha256: LOOK2_GATE_STATUS.sourceZipSha256,
    missingProductionSlots: LOOK2_GATE_STATUS.missingProductionSlots,
  },
  {
    starterId: "f-priya",
    lookKey: "adult-look-3",
    lookIndex1Based: 3,
    slotLabel: "Stomper Woman Three",
    status: "REGISTERED_VISUAL_PROTOTYPE_ONLY",
    ownerVisualReview: "OWNER_REVIEW_REQUIRED",
    androidQa: "NOT_RUN",
    androidAccepted: false,
    acceptanceEligible: false,
    bodyItemId: "body-look3-solid",
    faceLockedItemId: "face-f-priya-locked-composite",
    glovesItemId: "gloves-look3-photo",
    bootsItemId: "boots-look3-photo",
    defaultJacketItemId: "jacket-look3-purple",
    defaultPantsItemId: "pants-look3-purple",
    defaultJacketFill: "#7e22ce",
    defaultPantsFill: "#6b21a8",
    altJacketItemId: "jacket-look3-fuchsia",
    altPantsItemId: "pants-look3-charcoal",
    altJacketFill: "#d946ef",
    altPantsFill: "#1f2937",
    altIsTestOnly: true,
    sourceZipSha256:
      "b8d9fee95a9d12234bf178d43914cb86fcf6ef9716b51f4c21caf118d8330a6d",
    missingProductionSlots: MODULAR_SHARED_MISSING_SLOTS,
  },
  {
    starterId: "m-devon",
    lookKey: "adult-look-4",
    lookIndex1Based: 4,
    slotLabel: "Stomper Man Two",
    status: "REGISTERED_VISUAL_PROTOTYPE_ONLY",
    ownerVisualReview: "NOT_OWNER_REVIEWED",
    androidQa: "NOT_RUN",
    androidAccepted: false,
    acceptanceEligible: false,
    bodyItemId: "body-look4-lean",
    faceLockedItemId: "face-m-devon-locked-composite",
    glovesItemId: "gloves-look4-photo",
    bootsItemId: "boots-look4-photo",
    defaultJacketItemId: "jacket-look4-orange",
    defaultPantsItemId: "pants-look4-charcoal",
    defaultJacketFill: "#ea580c",
    defaultPantsFill: "#1f2937",
    altJacketItemId: "jacket-look4-white",
    altPantsItemId: "pants-look4-charcoal-silver",
    altJacketFill: "#f8fafc",
    altPantsFill: "#374151",
    altIsTestOnly: true,
    sourceZipSha256:
      "7f11f205db0b673f5918fbae7cd7d8161471d19b75b10fa74c0269dc7f6aaf04",
    missingProductionSlots: MODULAR_SHARED_MISSING_SLOTS,
  },
] as const;

export const MODULAR_STARTER_IDS = MODULAR_RIDERS.map((r) => r.starterId);

export function modularRiderByStarterId(
  starterId: string,
): ModularRiderDef | undefined {
  return MODULAR_RIDERS.find((r) => r.starterId === starterId);
}

export function isModularPrototypeStarter(starterId: string): boolean {
  return modularRiderByStarterId(starterId) !== undefined;
}

/** Per-rider localStorage key — selections never share a single overwrite slot. */
export function riderLockerStorageKey(starterId: string): string {
  return `stomp-avatar-locker-rider:${starterId}`;
}

export function modularPrototypeLayers(
  starterId: string,
  variant: ModularAbcVariant,
): AvatarLayers | null {
  const rider = modularRiderByStarterId(starterId);
  if (!rider) return null;
  // Preserve Look 2 exact layer bag (existing corrections + tests).
  if (starterId === LOOK2_STARTER_ID) {
    return look2PrototypeLayers(variant);
  }
  const base: AvatarLayers = {
    body: { itemId: rider.bodyItemId, color: "#1e293b" },
    face: { itemId: rider.faceLockedItemId },
    hair: { itemId: "hair-locked-included" },
    pants: {
      itemId: rider.defaultPantsItemId,
      color: rider.defaultPantsFill,
    },
    jacket: {
      itemId: rider.defaultJacketItemId,
      color: rider.defaultJacketFill,
    },
    backpack: { itemId: BACKPACK_OFF_ITEM_ID },
    gloves: { itemId: rider.glovesItemId, color: "#1e293b" },
    headwear: { itemId: "headwear-locked-included", color: "#0f172a" },
    goggles: { itemId: "goggles-locked-included" },
    boots: { itemId: rider.bootsItemId, color: "#334155" },
    board: { itemId: BOARD_OFF_ITEM_ID },
  };
  if (variant === "A") {
    return {
      ...base,
      jacket: { itemId: JACKET_OFF_ITEM_ID },
      pants: {
        itemId: rider.defaultPantsItemId,
        color: rider.defaultPantsFill,
      },
    };
  }
  if (variant === "C") {
    return {
      ...base,
      jacket: {
        itemId: rider.altJacketItemId,
        color: rider.altJacketFill,
      },
      pants: {
        itemId: rider.altPantsItemId,
        color: rider.altPantsFill,
      },
    };
  }
  return base;
}

export function modularPrototypeConfig(
  starterId: string,
  variant: ModularAbcVariant,
  opts: { stomperId?: string; displayName?: string } = {},
): AvatarConfig | null {
  const starter = starterById(starterId);
  const layers = modularPrototypeLayers(starterId, variant);
  if (!starter || !layers) return null;
  const cfg = configFromStarter(starter, {
    stomperId: opts.stomperId ?? `modular-${starterId}-${variant}`,
    // Never seed personal displayNames from technical ids. UI resolves via resolvePublicDisplayName.
    displayName: opts.displayName ?? "",
  });
  return { ...cfg, layers };
}

export function modularIsPrototypeOutfit(
  config: Pick<AvatarConfig, "starterId" | "layers">,
): boolean {
  const rider = modularRiderByStarterId(config.starterId);
  if (!rider) return false;
  const { layers } = config;
  return (
    layers.face.itemId === rider.faceLockedItemId ||
    layers.hair.itemId === "hair-locked-included" ||
    layers.headwear.itemId === "headwear-locked-included" ||
    layers.goggles.itemId === "goggles-locked-included" ||
    layers.board.itemId === BOARD_OFF_ITEM_ID ||
    layers.gloves.itemId === rider.glovesItemId ||
    layers.boots.itemId === rider.bootsItemId
  );
}

/** Prototype runtime plate URLs (8 plates; preview optional). */
export function modularPrototypePlateUrls(starterId: string): string[] {
  const rider = modularRiderByStarterId(starterId);
  if (!rider) return [];
  return [
    buildPlateUrl("adult", "body", rider.bodyItemId, 512),
    buildPlateUrl("adult", "face", rider.faceLockedItemId, 512),
    buildPlateUrl("adult", "jacket", rider.defaultJacketItemId, 512),
    buildPlateUrl("adult", "jacket", rider.altJacketItemId, 512),
    buildPlateUrl("adult", "pants", rider.defaultPantsItemId, 512),
    buildPlateUrl("adult", "pants", rider.altPantsItemId, 512),
    buildPlateUrl("adult", "gloves", rider.glovesItemId, 512),
    buildPlateUrl("adult", "boots", rider.bootsItemId, 512),
  ];
}

export function modularStarterPreviewUrl(starterId: string): string {
  return buildStarterPreviewUrl("adult", starterId, 512);
}

/** Honest completeness row for docs / CI — never invents ABSENT as PRESENT. */
export function modularAssetCompletenessMatrix(): Array<{
  starterId: string;
  slotLabel: ModularSlotLabel;
  status: "REGISTERED_VISUAL_PROTOTYPE_ONLY";
  ownerVisualReview: ModularRiderDef["ownerVisualReview"];
  androidQa: "NOT_RUN";
  acceptanceEligible: false;
  plates8of11: "PRESENT";
  hairSeparated: "ABSENT";
  headwearSeparated: "ABSENT";
  gogglesSeparated: "ABSENT";
  boardBindings: "ABSENT";
  backpackIndependent: "ABSENT";
  altOutfit: "TEST-ONLY";
  underbody: "CONSTRUCTED_APPAREL_NOT_PHOTO";
}> {
  return MODULAR_RIDERS.map((r) => ({
    starterId: r.starterId,
    slotLabel: r.slotLabel,
    status: "REGISTERED_VISUAL_PROTOTYPE_ONLY" as const,
    ownerVisualReview: r.ownerVisualReview,
    androidQa: "NOT_RUN" as const,
    acceptanceEligible: false as const,
    plates8of11: "PRESENT" as const,
    hairSeparated: "ABSENT" as const,
    headwearSeparated: "ABSENT" as const,
    gogglesSeparated: "ABSENT" as const,
    boardBindings: "ABSENT" as const,
    backpackIndependent: "ABSENT" as const,
    altOutfit: "TEST-ONLY" as const,
    underbody: "CONSTRUCTED_APPAREL_NOT_PHOTO" as const,
  }));
}
