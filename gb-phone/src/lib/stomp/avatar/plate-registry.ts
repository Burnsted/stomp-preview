/**
 * Plate ingest registry + eight-look slot matrix (t1182u → t1189u → t1197u).
 *
 * Look 2 mint production scaffolding remains under public/stomper.
 * Franz art-pass adds prototype 8-of-11 plates (ink + locked head + photo gloves/boots).
 * Android acceptance stays fail-closed until full separated 11-slot production outfit.
 * Does NOT invent WebP/PNG / separated face/hair/goggles/board.
 *
 * Look 2 (f-hana) is the ONLY Android acceptance gate.
 */
import {
  BACKPACK_OFF_ITEM_ID,
  BOARD_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
  buildPlateUrl,
  buildStarterPreviewUrl,
} from "@/lib/stomp/avatar/artwork";
import {
  LOOK2_FACE_LOCKED_ITEM_ID,
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
  look2IsPrototypeOutfit,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  look2MintRequiredAllShipped,
  shippedPlatePathExists,
} from "@/lib/stomp/avatar/look2-plate-manifest";
import {
  isModularPrototypeStarter,
  modularPrototypePlateUrls,
  modularRiderByStarterId,
} from "@/lib/stomp/avatar/modular-riders";
import {
  evaluatePlateAssembly,
  type PlateProbeStatus,
} from "@/lib/stomp/avatar/plate-assembly";
import {
  ROSTER_V24,
  type RosterV24Entry,
} from "@/lib/stomp/avatar/roster-v24";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import type { AgeBand, AvatarConfig, AvatarSlot } from "@/lib/stomp/avatar/types";

/** Exact Look 2 mint production paths (11-slot Android gate). */
export const LOOK2_MINT_REQUIRED_PATHS: readonly string[] = [
  "/stomper/adult/jacket/jacket-look2-mint@512.webp",
  "/stomper/adult/pants/pants-look2-mint@512.webp",
  "/stomper/adult/body/body-athletic@512.webp",
  "/stomper/adult/face/face-female@512.webp",
  "/stomper/adult/hair/hair-straight@512.webp",
  "/stomper/adult/headwear/helmet-basic@512.webp",
  "/stomper/adult/goggles/goggles-basic@512.webp",
  "/stomper/adult/gloves/gloves-basic@512.webp",
  "/stomper/adult/boots/boots-basic@512.webp",
  "/stomper/adult/board/board-basic@512.webp",
  "/stomper/adult/starter/f-hana/preview@512.webp",
] as const;

export type PlateSlotStatus =
  | "missing-plates"
  | "ingest-ready"
  | "prototype-ingest-ready";

export type LookPlateSlot = {
  lookKey: RosterV24Entry["lookKey"];
  starterId: string;
  ageBand: AgeBand;
  lookIndex1Based: number;
  lookTotal: number;
  /** Only Look 2 is the Android acceptance gate. */
  androidAcceptanceGate: boolean;
  previewOnly: boolean;
  /** Default starter config required plate URLs (runtime). */
  requiredPaths: readonly string[];
  status: PlateSlotStatus;
  missingPaths: readonly string[];
  /** Honest prototype flag — never Android PASS. */
  prototypeOnly?: boolean;
  ownerVisualReview?: string;
};

export type Look2MintGateResult = {
  starterId: typeof LOOK2_STARTER_ID;
  /** True only when full production plate set + production outfit constraints hold. */
  acceptanceEligible: boolean;
  plateComplete: boolean;
  missingPaths: readonly string[];
  presentCount: number;
  requiredCount: number;
  failReasons: readonly Look2MintFailReason[];
  dataMissingPlates: number;
  /** Honest prototype flag — never equals Android PASS. */
  prototypeOnly: boolean;
};

export type Look2MintFailReason =
  | "incomplete-set"
  | "wrong-jacket-id"
  | "wrong-pants-id"
  | "eyewear-on"
  | "backpack-on"
  | "plates-absent"
  | "prototype-outfit"
  | "board-off";

function defaultRequiredPathsForEntry(entry: RosterV24Entry): string[] {
  const s = starterById(entry.starterId);
  if (!s) return [];
  const cfg = configFromStarter(s, { stomperId: "registry" });
  const assembly = evaluatePlateAssembly(cfg, () => "pending");
  const paths = assembly.required.map((r) => r.url);
  paths.push(buildStarterPreviewUrl(entry.ageBand, entry.starterId));
  return paths;
}

/**
 * Eight-look plate slot matrix — Look 2 mint production paths remain the
 * Android gate. Man 1 / Woman 3 / Man 2 use prototype 8-of-11 paths when
 * shipped (prototype-ingest-ready). Looks without plates stay missing-plates.
 */
export function eightLookPlateMatrix(
  pathExists: (url: string) => boolean = shippedPlatePathExists,
): LookPlateSlot[] {
  return ROSTER_V24.map((entry) => {
    const modular = modularRiderByStarterId(entry.starterId);
    const requiredPaths =
      entry.starterId === LOOK2_STARTER_ID
        ? LOOK2_MINT_REQUIRED_PATHS
        : modular
          ? modularPrototypePlateUrls(entry.starterId)
          : defaultRequiredPathsForEntry(entry);
    const missingPaths = requiredPaths.filter((p) => !pathExists(p));
    let status: PlateSlotStatus =
      missingPaths.length === 0 ? "ingest-ready" : "missing-plates";
    if (modular && entry.starterId !== LOOK2_STARTER_ID && missingPaths.length === 0) {
      status = "prototype-ingest-ready";
    }
    return {
      lookKey: entry.lookKey,
      starterId: entry.starterId,
      ageBand: entry.ageBand,
      lookIndex1Based: entry.lookIndex1Based,
      lookTotal: entry.lookTotal,
      androidAcceptanceGate: entry.starterId === LOOK2_STARTER_ID,
      previewOnly: entry.previewOnly,
      requiredPaths,
      status,
      missingPaths,
      prototypeOnly: modular ? true : undefined,
      ownerVisualReview: modular?.ownerVisualReview,
    };
  });
}

export function lookPlateSlotByStarterId(
  starterId: string,
  pathExists: (url: string) => boolean = shippedPlatePathExists,
): LookPlateSlot | undefined {
  return eightLookPlateMatrix(pathExists).find((s) => s.starterId === starterId);
}

/**
 * Look 2 mint / Android gate — fail-closed.
 * Production requires separated 11-slot outfit (not locked-head prototype).
 * Plates must exist; jacket/pants IDs must be mint pair; backpack OFF;
 * eyewear must be goggles-basic; board must be on (board-basic).
 */
export function evaluateLook2MintGate(opts: {
  config: AvatarConfig;
  /** Sync existence probe (tests / Node). Defaults to shipped Look 2 mint manifest. */
  pathExists?: (url: string) => boolean;
  /** Optional plate assembly probe; defaults from pathExists. */
  plateProbe?: (url: string) => PlateProbeStatus;
}): Look2MintGateResult {
  const { config } = opts;
  const pathExists = opts.pathExists ?? shippedPlatePathExists;
  const plateProbe: (url: string) => PlateProbeStatus =
    opts.plateProbe ?? ((url) => (pathExists(url) ? "present" : "missing"));

  const missingPaths = LOOK2_MINT_REQUIRED_PATHS.filter((p) => !pathExists(p));
  const presentCount = LOOK2_MINT_REQUIRED_PATHS.length - missingPaths.length;
  const failReasons: Look2MintFailReason[] = [];
  const prototypeOnly = look2IsPrototypeOutfit(config);

  if (missingPaths.length > 0) {
    failReasons.push("plates-absent");
    failReasons.push("incomplete-set");
  }

  if (config.layers.jacket.itemId !== LOOK2_JACKET_ITEM_ID) {
    failReasons.push("wrong-jacket-id");
  }
  if (config.layers.pants.itemId !== LOOK2_PANTS_ITEM_ID) {
    failReasons.push("wrong-pants-id");
  }
  // Acceptance: backpack must stay OFF
  if (config.layers.backpack?.itemId && config.layers.backpack.itemId !== BACKPACK_OFF_ITEM_ID) {
    failReasons.push("backpack-on");
  }
  // Acceptance: no Meta Oakley / special eyewear — goggles-basic only
  if (config.layers.goggles.itemId !== EYEWEAR_ITEM_IDS.goggles) {
    failReasons.push("eyewear-on");
  }
  // Production board required — prototype board-none is not Android-eligible
  if (config.layers.board.itemId === BOARD_OFF_ITEM_ID) {
    failReasons.push("board-off");
  }
  // Locked-head / photo-gloves prototype outfit ≠ production 11
  if (prototypeOnly) {
    failReasons.push("prototype-outfit");
    if (!failReasons.includes("incomplete-set")) {
      failReasons.push("incomplete-set");
    }
  }
  // Locked composite face is never a production face plate
  if (config.layers.face.itemId === LOOK2_FACE_LOCKED_ITEM_ID) {
    if (!failReasons.includes("prototype-outfit")) {
      failReasons.push("prototype-outfit");
    }
    if (!failReasons.includes("incomplete-set")) {
      failReasons.push("incomplete-set");
    }
  }

  const assembly = evaluatePlateAssembly(config, plateProbe);
  const plateComplete = assembly.complete && missingPaths.length === 0;
  if (!plateComplete && !failReasons.includes("incomplete-set")) {
    failReasons.push("incomplete-set");
  }

  const acceptanceEligible =
    plateComplete &&
    failReasons.length === 0 &&
    config.starterId === LOOK2_STARTER_ID &&
    assembly.acceptanceEligible &&
    !prototypeOnly;

  return {
    starterId: LOOK2_STARTER_ID,
    acceptanceEligible,
    plateComplete,
    missingPaths,
    presentCount,
    requiredCount: LOOK2_MINT_REQUIRED_PATHS.length,
    failReasons: [...new Set(failReasons)],
    dataMissingPlates: missingPaths.length,
    prototypeOnly,
  };
}

/** Map public URL → repo-relative public path for Node/fs ingest checks. */
export function runtimeUrlToPublicRelPath(url: string): string {
  const clean = url.startsWith("/") ? url.slice(1) : url;
  return `public/${clean}`;
}

/** Build a single slot plate URL (matrix helper). */
export function platePathFor(
  ageBand: AgeBand,
  slot: AvatarSlot,
  itemId: string,
): string {
  return buildPlateUrl(ageBand, slot, itemId, 512);
}

/** Ingest receipt — never invents files. Defaults to shipped Look 2 mint set. */
export function ingestLook2MintReceipt(
  pathExists: (url: string) => boolean = shippedPlatePathExists,
): {
  ingested: boolean;
  missingPaths: readonly string[];
  readyPaths: readonly string[];
  blocked: boolean;
  note: string;
} {
  const missingPaths = LOOK2_MINT_REQUIRED_PATHS.filter((p) => !pathExists(p));
  const readyPaths = LOOK2_MINT_REQUIRED_PATHS.filter((p) => pathExists(p));
  const ingested = missingPaths.length === 0 && look2MintRequiredAllShipped();
  return {
    ingested,
    missingPaths,
    readyPaths,
    blocked: !ingested,
    note: ingested
      ? "Look 2 mint scaffolding PRESENT (t1197u art-pass) — file ingest ready; Android acceptanceEligible remains false for prototype 8-of-11 outfit (REGISTERED_VISUAL_PROTOTYPE_ONLY)"
      : "Look 2 mint plates incomplete — fail-closed; do not invent assets",
  };
}
