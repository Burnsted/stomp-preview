/**
 * Look 2 (f-hana) mint/ink plate / renderer acceptance contract.
 *
 * t1197u: registered PROTOTYPE pack (8 plates) supersedes AWAITING_FRANZ_BODY
 * for body + ink presence. Still NOT Android-accepted / NOT full 11-slot production.
 *
 * HARD: masters ≠ plates; no poster-crop; no auto-mount from docs/;
 * no fake PASS from checksums alone.
 */
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  BOARD_OFF_ITEM_ID,
  JACKET_OFF_ITEM_ID,
  buildPlateUrl,
  buildStarterPreviewUrl,
} from "@/lib/stomp/avatar/artwork";
import { jacketSetFor } from "@/lib/stomp/avatar/jacket-sets";
import { itemById } from "@/lib/stomp/avatar/locker";
import {
  APPROVED_MASTER_SHA256,
  APPROVED_VISUAL_MASTER_PATHS,
  GB_FIRST_ACCEPTANCE,
} from "@/lib/stomp/avatar/slot-readiness";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import type { AvatarConfig, AvatarLayers } from "@/lib/stomp/avatar/types";

export const LOOK2_STARTER_ID = "f-hana" as const;
export const LOOK2_LOOK_KEY = "adult-look-2" as const;

/** Catalog itemIds — SEPARATE transparent plates. */
export const LOOK2_JACKET_ITEM_ID = "jacket-look2-mint" as const;
export const LOOK2_PANTS_ITEM_ID = "pants-look2-mint" as const;
export const LOOK2_JACKET_INK_ITEM_ID = "jacket-look2-ink" as const;
export const LOOK2_PANTS_INK_ITEM_ID = "pants-look2-ink" as const;
export const LOOK2_FACE_LOCKED_ITEM_ID = "face-f-hana-locked-composite" as const;
export const LOOK2_GLOVES_PHOTO_ITEM_ID = "gloves-look2-photo" as const;
export const LOOK2_BOOTS_PHOTO_ITEM_ID = "boots-look2-photo" as const;

export const LOOK2_JACKET_FILL = "#14b8a6" as const;
export const LOOK2_PANTS_FILL = "#0d9488" as const;
export const LOOK2_INK_JACKET_FILL = "#1f2937" as const;
export const LOOK2_INK_PANTS_FILL = "#111827" as const;

export const LOOK2_MASTER_PATH = APPROVED_VISUAL_MASTER_PATHS["adult-look-2"];
export const LOOK2_MASTER_SHA256 = APPROVED_MASTER_SHA256[LOOK2_STARTER_ID]!;

export function look2JacketPlateUrl(size: 512 | 1024 = 512): string {
  return buildPlateUrl("adult", "jacket", LOOK2_JACKET_ITEM_ID, size);
}

export function look2PantsPlateUrl(size: 512 | 1024 = 512): string {
  return buildPlateUrl("adult", "pants", LOOK2_PANTS_ITEM_ID, size);
}

export function look2JacketInkPlateUrl(size: 512 | 1024 = 512): string {
  return buildPlateUrl("adult", "jacket", LOOK2_JACKET_INK_ITEM_ID, size);
}

export function look2PantsInkPlateUrl(size: 512 | 1024 = 512): string {
  return buildPlateUrl("adult", "pants", LOOK2_PANTS_INK_ITEM_ID, size);
}

export function look2StarterPreviewUrl(size: 512 | 1024 = 512): string {
  return buildStarterPreviewUrl("adult", LOOK2_STARTER_ID, size);
}

export const LOOK2_ANDROID_ACCEPTANCE_CHECKS = [
  {
    id: "separate-mint-plates",
    label:
      "Mint jacket + matching pants exist as SEPARATE transparent WebP plates (distinct itemIds)",
  },
  {
    id: "separate-ink-plates",
    label:
      "Ink charcoal jacket + pants exist as SEPARATE transparent WebP plates (distinct itemIds)",
  },
  {
    id: "complete-required-set",
    label:
      "FULL required production plate set present (separated face/hair/headwear/goggles + board) — prototype locked head is NOT enough",
  },
  {
    id: "real-selector-locker",
    label:
      "Plates layer in REAL character selector + Locker (not static still / UI mock / poster crop)",
  },
  {
    id: "full-body-preview",
    label: "Full-body preview composites jacket + pants without merged bitmap",
  },
  {
    id: "jacket-swap",
    label: "Jacket swap updates coordinated pants itemId while layers stay independent",
  },
  {
    id: "jacket-off-body",
    label: "Jacket OFF shows base torso/arms from body plate without holes at neck/wrists/shoulders",
  },
  {
    id: "eyewear-swap",
    label: "Eyewear swap on goggles slot works with SEPARATE goggles plate (not locked-head include)",
  },
  {
    id: "board-layer",
    label: "Snowboard/board plate loads as its own layer (real board — not invented)",
  },
  {
    id: "backpack-off-default",
    label: "Backpack OFF by default (backpack-none); optional daypack does not auto-equip",
  },
  {
    id: "no-false-success",
    label: "data-acceptance-eligible=true only when production plate set complete",
  },
  {
    id: "name-persistence",
    label: "User-created STOMPER displayName persists across look / layer changes",
  },
  {
    id: "return-to-locker",
    label: "Return to Locker shows same starterId + layers + name",
  },
  {
    id: "identity-match-master",
    label: `Identity matches ${LOOK2_MASTER_PATH} (sha256 ${LOOK2_MASTER_SHA256.slice(0, 8)}…)`,
  },
] as const;

export type Look2AcceptanceCheckId = (typeof LOOK2_ANDROID_ACCEPTANCE_CHECKS)[number]["id"];

/** Look 2 t1197u registered prototype status — honest, not Android PASS. */
export const LOOK2_GATE_STATUS = {
  visualMaster: "APPROVED_MASTER" as const,
  /** 8 registered prototype plates — not full 11-slot production. */
  modularPlates: "PROTOTYPE_8_OF_11" as const,
  androidQa: "OPEN_DEVICE" as const,
  androidAccepted: false as const,
  firstGate: true as const,
  inventingPlatesForbidden: true as const,
  posterCropForbidden: true as const,
  inkVariants: "PRESENT" as const,
  inkColorway: "charcoal-black-prototype" as const,
  underJacketBody: "PROTOTYPE_PRESENT" as const,
  underJacketBodyNote:
    "Constructed dark graphic underlayer from Franz ZIP — not photo-real anatomy; AWAITING_VISUAL_ACCEPTANCE" as const,
  visualRegistrationGate: "PROTOTYPE_AWAITING_ACCEPTANCE" as const,
  compositeA: "PROTOTYPE_RENDERED" as const,
  compositeB: "PROTOTYPE_RENDERED" as const,
  compositeC: "PROTOTYPE_RENDERED" as const,
  productionCanvas: 1024 as const,
  runtimeCanvas: 512 as const,
  commonScale: 0.5 as const,
  status: "REGISTERED_VISUAL_PROTOTYPE_ONLY" as const,
  preferredPack: "franz-art-pass" as const,
  sourceZipSha256:
    "75d1dd0377bd9f4223631e25661e97831e23a563f8735ecaa3829a991b326762" as const,
  priorMorningZipSha256:
    "62b7bdcefec632a31e8f95c0c8e298d78a85fd7c2cf132bc950e90aed8ea3f89" as const,
  sourceZip:
    "docs/modular-prototype-t1197u/art-pass/look2-f-hana-REGISTERED-PROTOTYPE.ora" as const,
  registrationContract: "docs/modular-alignment-t1194u/REGISTRATION-CONTRACT.md" as const,
  /** Separated production slots still missing (locked head ≠ production). */
  missingProductionSlots: [
    "face (separated)",
    "hair (separated)",
    "headwear (separated)",
    "goggles (separated)",
    "board (real bindings)",
  ] as const,
  /** Franz still OPEN — do not fake-PASS. */
  openArtRepairs: [
    "head_locked leftovers on jacket-off: chin notch / braid wisp / chest slashes",
    "body painted graphic not photo anatomy; shoulder line approximate",
    "Android device proof not run",
  ] as const,
};

export function look2DefaultLayerItemIds(): {
  jacket: typeof LOOK2_JACKET_ITEM_ID;
  pants: typeof LOOK2_PANTS_ITEM_ID;
  backpack: typeof BACKPACK_OFF_ITEM_ID;
  goggles: string;
} {
  return {
    jacket: LOOK2_JACKET_ITEM_ID,
    pants: LOOK2_PANTS_ITEM_ID,
    backpack: BACKPACK_OFF_ITEM_ID,
    goggles: "goggles-locked-included",
  };
}

export function look2ExpectedRuntimePlatePaths(): string[] {
  return [
    look2JacketPlateUrl(512),
    look2PantsPlateUrl(512),
    look2JacketInkPlateUrl(512),
    look2PantsInkPlateUrl(512),
    look2StarterPreviewUrl(512),
  ];
}

/** True when config is the Franz registered prototype (8-of-11), not production 11. */
export function look2IsPrototypeOutfit(config: Pick<AvatarConfig, "layers">): boolean {
  const { layers } = config;
  return (
    layers.face.itemId === LOOK2_FACE_LOCKED_ITEM_ID ||
    layers.hair.itemId === "hair-locked-included" ||
    layers.headwear.itemId === "headwear-locked-included" ||
    layers.goggles.itemId === "goggles-locked-included" ||
    layers.board.itemId === BOARD_OFF_ITEM_ID ||
    layers.gloves.itemId === LOOK2_GLOVES_PHOTO_ITEM_ID ||
    layers.boots.itemId === LOOK2_BOOTS_PHOTO_ITEM_ID
  );
}

/** Prototype A/B/C layer bags for AvatarRenderer composites (t1197u). */
export function look2PrototypeLayers(
  variant: "A" | "B" | "C",
): AvatarLayers {
  const base = layersFromLook2PrototypeBase();
  if (variant === "A") {
    return {
      ...base,
      jacket: { itemId: JACKET_OFF_ITEM_ID },
      pants: { itemId: LOOK2_PANTS_ITEM_ID, color: LOOK2_PANTS_FILL },
    };
  }
  if (variant === "C") {
    return {
      ...base,
      jacket: { itemId: LOOK2_JACKET_INK_ITEM_ID, color: LOOK2_INK_JACKET_FILL },
      pants: { itemId: LOOK2_PANTS_INK_ITEM_ID, color: LOOK2_INK_PANTS_FILL },
    };
  }
  return {
    ...base,
    jacket: { itemId: LOOK2_JACKET_ITEM_ID, color: LOOK2_JACKET_FILL },
    pants: { itemId: LOOK2_PANTS_ITEM_ID, color: LOOK2_PANTS_FILL },
  };
}

function layersFromLook2PrototypeBase(): AvatarLayers {
  return {
    body: { itemId: "body-athletic", color: "#ffdbac" },
    face: { itemId: LOOK2_FACE_LOCKED_ITEM_ID, color: "#ffdbac" },
    hair: { itemId: "hair-locked-included", color: "#0c0a09" },
    pants: { itemId: LOOK2_PANTS_ITEM_ID, color: LOOK2_PANTS_FILL },
    jacket: { itemId: LOOK2_JACKET_ITEM_ID, color: LOOK2_JACKET_FILL },
    backpack: { itemId: BACKPACK_OFF_ITEM_ID },
    gloves: { itemId: LOOK2_GLOVES_PHOTO_ITEM_ID, color: "#1e293b" },
    headwear: { itemId: "headwear-locked-included", color: "#0f172a" },
    goggles: { itemId: "goggles-locked-included", color: "#2dd4bf" },
    boots: { itemId: LOOK2_BOOTS_PHOTO_ITEM_ID, color: "#334155" },
    board: { itemId: BOARD_OFF_ITEM_ID },
  };
}

export function look2PrototypeConfig(
  variant: "A" | "B" | "C",
  opts: { stomperId?: string; displayName?: string } = {},
): AvatarConfig {
  const starter = starterById(LOOK2_STARTER_ID)!;
  const cfg = configFromStarter(starter, {
    stomperId: opts.stomperId ?? `look2-proto-${variant}`,
    displayName: opts.displayName ?? `Proto${variant}`,
  });
  return { ...cfg, layers: look2PrototypeLayers(variant) };
}

/**
 * Contract integrity for CI — IDs/paths/catalog wired; prototype ≠ Android PASS.
 */
export function assertLook2AcceptanceContract(): {
  ok: true;
  starterId: typeof LOOK2_STARTER_ID;
  jacketItemId: typeof LOOK2_JACKET_ITEM_ID;
  pantsItemId: typeof LOOK2_PANTS_ITEM_ID;
  jacketInkItemId: typeof LOOK2_JACKET_INK_ITEM_ID;
  pantsInkItemId: typeof LOOK2_PANTS_INK_ITEM_ID;
  jacketPlateUrl: string;
  pantsPlateUrl: string;
  previewUrl: string;
  masterSha256: string;
  checkCount: number;
  layerOrderHasJacketBeforePantsIsFalse: boolean;
  androidAccepted: false;
} {
  if (GB_FIRST_ACCEPTANCE.starterId !== LOOK2_STARTER_ID) {
    throw new Error("GB_FIRST_ACCEPTANCE must remain f-hana (Look 2)");
  }
  const starter = starterById(LOOK2_STARTER_ID);
  if (!starter) throw new Error("f-hana starter missing");
  if (starter.silhouette !== "athletic") throw new Error("Look 2 silhouette must stay athletic");

  for (const id of [
    LOOK2_JACKET_ITEM_ID,
    LOOK2_PANTS_ITEM_ID,
    LOOK2_JACKET_INK_ITEM_ID,
    LOOK2_PANTS_INK_ITEM_ID,
    LOOK2_FACE_LOCKED_ITEM_ID,
    LOOK2_GLOVES_PHOTO_ITEM_ID,
    LOOK2_BOOTS_PHOTO_ITEM_ID,
    JACKET_OFF_ITEM_ID,
    BOARD_OFF_ITEM_ID,
  ]) {
    if (!itemById(id)) throw new Error(`${id} missing from LOCKER_CATALOG`);
  }

  const mintSet = jacketSetFor(LOOK2_JACKET_ITEM_ID);
  if (!mintSet || mintSet.pantsId !== LOOK2_PANTS_ITEM_ID) {
    throw new Error("Look 2 mint jacket set must coordinate pants-look2-mint separately");
  }
  const inkSet = jacketSetFor(LOOK2_JACKET_INK_ITEM_ID);
  if (!inkSet || inkSet.pantsId !== LOOK2_PANTS_INK_ITEM_ID) {
    throw new Error("Look 2 ink jacket set must coordinate pants-look2-ink separately");
  }

  const cfg = configFromStarter(starter, { stomperId: "look2-gate", displayName: "" });
  if (cfg.layers.jacket.itemId !== LOOK2_JACKET_ITEM_ID) {
    throw new Error("f-hana default jacket must be jacket-look2-mint");
  }
  if (cfg.layers.pants.itemId !== LOOK2_PANTS_ITEM_ID) {
    throw new Error("f-hana default pants must be pants-look2-mint");
  }
  if (cfg.layers.face.itemId !== LOOK2_FACE_LOCKED_ITEM_ID) {
    throw new Error("f-hana prototype face must be locked composite");
  }
  if (cfg.layers.board.itemId !== BOARD_OFF_ITEM_ID) {
    throw new Error("f-hana prototype board must stay OFF (not invented)");
  }
  if (cfg.layers.backpack.itemId !== BACKPACK_OFF_ITEM_ID) {
    throw new Error("Look 2 backpack must default OFF");
  }

  const jacketUrl = look2JacketPlateUrl();
  const pantsUrl = look2PantsPlateUrl();
  if (jacketUrl === pantsUrl) throw new Error("jacket/pants plate URLs must differ");
  if (look2JacketInkPlateUrl() === look2PantsInkPlateUrl()) {
    throw new Error("ink jacket/pants plate URLs must differ");
  }

  const pantsIdx = ARTWORK_LAYER_ORDER.indexOf("pants");
  const jacketIdx = ARTWORK_LAYER_ORDER.indexOf("jacket");
  if (pantsIdx < 0 || jacketIdx < 0 || pantsIdx >= jacketIdx) {
    throw new Error("layer order must paint pants under jacket");
  }

  if (LOOK2_MASTER_SHA256.length !== 64) throw new Error("Look 2 master sha invalid");
  if (LOOK2_ANDROID_ACCEPTANCE_CHECKS.length < 10) {
    throw new Error("Look 2 acceptance checklist incomplete");
  }
  if (LOOK2_GATE_STATUS.androidAccepted !== false) {
    throw new Error("Look 2 must not claim androidAccepted");
  }

  return {
    ok: true,
    starterId: LOOK2_STARTER_ID,
    jacketItemId: LOOK2_JACKET_ITEM_ID,
    pantsItemId: LOOK2_PANTS_ITEM_ID,
    jacketInkItemId: LOOK2_JACKET_INK_ITEM_ID,
    pantsInkItemId: LOOK2_PANTS_INK_ITEM_ID,
    jacketPlateUrl: jacketUrl,
    pantsPlateUrl: pantsUrl,
    previewUrl: look2StarterPreviewUrl(),
    masterSha256: LOOK2_MASTER_SHA256,
    checkCount: LOOK2_ANDROID_ACCEPTANCE_CHECKS.length,
    layerOrderHasJacketBeforePantsIsFalse: pantsIdx < jacketIdx,
    androidAccepted: false,
  };
}
