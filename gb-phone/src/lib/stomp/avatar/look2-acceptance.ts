/**
 * Look 2 (f-hana) mint plate / renderer acceptance contract (t1177u).
 *
 * Visual master APPROVED. Modular plates NOT delivered yet.
 * This module locks IDs + paths + pass/fail criteria for the first GB
 * Android gate — it does NOT invent WebP/PNG plate files.
 *
 * HARD: masters ≠ plates; no poster-crop; no auto-mount from docs/.
 */
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
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

export const LOOK2_STARTER_ID = "f-hana" as const;
export const LOOK2_LOOK_KEY = "adult-look-2" as const;

/** Catalog itemIds GB must deliver as SEPARATE transparent plates. */
export const LOOK2_JACKET_ITEM_ID = "jacket-look2-mint" as const;
export const LOOK2_PANTS_ITEM_ID = "pants-look2-mint" as const;

/** Mint fills aligned to approved master colorway (tint fallback until plates). */
export const LOOK2_JACKET_FILL = "#14b8a6" as const;
export const LOOK2_PANTS_FILL = "#0d9488" as const;

export const LOOK2_MASTER_PATH = APPROVED_VISUAL_MASTER_PATHS["adult-look-2"];
export const LOOK2_MASTER_SHA256 = APPROVED_MASTER_SHA256[LOOK2_STARTER_ID]!;

/** Runtime paths — files must appear under gb-phone/public (not docs/). */
export function look2JacketPlateUrl(size: 512 | 1024 = 512): string {
  return buildPlateUrl("adult", "jacket", LOOK2_JACKET_ITEM_ID, size);
}

export function look2PantsPlateUrl(size: 512 | 1024 = 512): string {
  return buildPlateUrl("adult", "pants", LOOK2_PANTS_ITEM_ID, size);
}

export function look2StarterPreviewUrl(size: 512 | 1024 = 512): string {
  return buildStarterPreviewUrl("adult", LOOK2_STARTER_ID, size);
}

/**
 * Physical Android pass/fail checklist (acceptance = ALL true with real plates).
 * Static stills / mocks / poster crops are automatic FAIL.
 */
export const LOOK2_ANDROID_ACCEPTANCE_CHECKS = [
  {
    id: "separate-mint-plates",
    label:
      "Mint jacket + matching pants exist as SEPARATE transparent WebP plates (distinct itemIds)",
  },
  {
    id: "complete-required-set",
    label:
      "FULL required plate set present (body/face/hair/jacket/pants/headwear/goggles/gloves/boots/board) — no partial assemble",
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
    id: "eyewear-swap",
    label: "Eyewear swap on goggles slot works (goggles-basic available)",
  },
  {
    id: "board-layer",
    label: "Snowboard/board plate loads as its own layer (board-basic or equipped board itemId)",
  },
  {
    id: "backpack-off-default",
    label: "Backpack OFF by default (backpack-none); optional daypack does not auto-equip",
  },
  {
    id: "no-false-success",
    label: "data-acceptance-eligible=true only when plate set complete (missing assets reported)",
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

/** Current engineering readiness — plates still missing ⇒ gate not passable. */
export const LOOK2_GATE_STATUS = {
  visualMaster: "APPROVED_MASTER" as const,
  modularPlates: "OPEN" as const,
  androidQa: "AWAITING_GB_PLATES" as const,
  firstGate: true as const,
  inventingPlatesForbidden: true as const,
  posterCropForbidden: true as const,
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
    goggles: EYEWEAR_ITEM_IDS.goggles,
  };
}

export function look2ExpectedRuntimePlatePaths(): string[] {
  return [
    look2JacketPlateUrl(512),
    look2PantsPlateUrl(512),
    look2StarterPreviewUrl(512),
  ];
}

/**
 * Contract integrity for CI — IDs/paths/catalog wired; no plate files required.
 */
export function assertLook2AcceptanceContract(): {
  ok: true;
  starterId: typeof LOOK2_STARTER_ID;
  jacketItemId: typeof LOOK2_JACKET_ITEM_ID;
  pantsItemId: typeof LOOK2_PANTS_ITEM_ID;
  jacketPlateUrl: string;
  pantsPlateUrl: string;
  previewUrl: string;
  masterSha256: string;
  checkCount: number;
  layerOrderHasJacketBeforePantsIsFalse: boolean;
} {
  if (GB_FIRST_ACCEPTANCE.starterId !== LOOK2_STARTER_ID) {
    throw new Error("GB_FIRST_ACCEPTANCE must remain f-hana (Look 2)");
  }
  const starter = starterById(LOOK2_STARTER_ID);
  if (!starter) throw new Error("f-hana starter missing");
  if (starter.silhouette !== "athletic") throw new Error("Look 2 silhouette must stay athletic");

  if (!itemById(LOOK2_JACKET_ITEM_ID)) throw new Error("jacket-look2-mint missing from LOCKER_CATALOG");
  if (!itemById(LOOK2_PANTS_ITEM_ID)) throw new Error("pants-look2-mint missing from LOCKER_CATALOG");
  if (itemById(LOOK2_JACKET_ITEM_ID)!.slot !== "jacket") throw new Error("Look 2 jacket slot mismatch");
  if (itemById(LOOK2_PANTS_ITEM_ID)!.slot !== "pants") throw new Error("Look 2 pants slot mismatch");

  const set = jacketSetFor(LOOK2_JACKET_ITEM_ID);
  if (!set || set.pantsId !== LOOK2_PANTS_ITEM_ID) {
    throw new Error("Look 2 jacket set must coordinate pants-look2-mint separately");
  }

  const cfg = configFromStarter(starter, { stomperId: "look2-gate", displayName: "" });
  if (cfg.starterId !== LOOK2_STARTER_ID) throw new Error("config starterId mismatch");
  if (cfg.layers.jacket.itemId !== LOOK2_JACKET_ITEM_ID) {
    throw new Error("f-hana default jacket must be jacket-look2-mint (plate path ready)");
  }
  if (cfg.layers.pants.itemId !== LOOK2_PANTS_ITEM_ID) {
    throw new Error("f-hana default pants must be pants-look2-mint (separate plate)");
  }
  const jacketId: string = cfg.layers.jacket.itemId;
  const pantsId: string = cfg.layers.pants.itemId;
  if (jacketId === pantsId) {
    throw new Error("jacket and pants must remain distinct itemIds");
  }
  if (cfg.layers.backpack.itemId !== BACKPACK_OFF_ITEM_ID) {
    throw new Error("Look 2 backpack must default OFF");
  }

  const jacketUrl = look2JacketPlateUrl();
  const pantsUrl = look2PantsPlateUrl();
  if (jacketUrl === pantsUrl) throw new Error("jacket/pants plate URLs must differ");
  if (!jacketUrl.startsWith("/stomper/adult/jacket/")) throw new Error("bad jacket plate path");
  if (!pantsUrl.startsWith("/stomper/adult/pants/")) throw new Error("bad pants plate path");

  // Jacket paints above pants in ARTWORK_LAYER_ORDER (pants before jacket).
  const pantsIdx = ARTWORK_LAYER_ORDER.indexOf("pants");
  const jacketIdx = ARTWORK_LAYER_ORDER.indexOf("jacket");
  if (pantsIdx < 0 || jacketIdx < 0 || pantsIdx >= jacketIdx) {
    throw new Error("layer order must paint pants under jacket");
  }

  if (LOOK2_MASTER_SHA256.length !== 64) throw new Error("Look 2 master sha invalid");
  if (LOOK2_ANDROID_ACCEPTANCE_CHECKS.length < 10) {
    throw new Error("Look 2 acceptance checklist incomplete");
  }

  return {
    ok: true,
    starterId: LOOK2_STARTER_ID,
    jacketItemId: LOOK2_JACKET_ITEM_ID,
    pantsItemId: LOOK2_PANTS_ITEM_ID,
    jacketPlateUrl: jacketUrl,
    pantsPlateUrl: pantsUrl,
    previewUrl: look2StarterPreviewUrl(),
    masterSha256: LOOK2_MASTER_SHA256,
    checkCount: LOOK2_ANDROID_ACCEPTANCE_CHECKS.length,
    layerOrderHasJacketBeforePantsIsFalse: pantsIdx < jacketIdx,
  };
}
