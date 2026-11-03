/**
 * Plate ingest registry + eight-look slot matrix (t1182u).
 *
 * Wires contracts that light up WHEN real plates land under public/stomper.
 * Does NOT invent WebP/PNG files. Fail-closed until paths exist.
 *
 * Look 2 (f-hana) is the ONLY Android acceptance gate.
 */
import {
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
  buildPlateUrl,
  buildStarterPreviewUrl,
} from "@/lib/stomp/avatar/artwork";
import {
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
} from "@/lib/stomp/avatar/look2-acceptance";
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

/** Exact Look 2 mint paths from GB-RENDERER-CORRECTNESS-HANDOFF (served from public/). */
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

export type PlateSlotStatus = "missing-plates" | "ingest-ready";

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
};

export type Look2MintGateResult = {
  starterId: typeof LOOK2_STARTER_ID;
  /** True only when full plate set present AND acceptance outfit constraints hold. */
  acceptanceEligible: boolean;
  plateComplete: boolean;
  missingPaths: readonly string[];
  presentCount: number;
  requiredCount: number;
  failReasons: readonly Look2MintFailReason[];
  dataMissingPlates: number;
};

export type Look2MintFailReason =
  | "incomplete-set"
  | "wrong-jacket-id"
  | "wrong-pants-id"
  | "eyewear-on"
  | "backpack-on"
  | "plates-absent";

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
 * Eight-look plate slot matrix — stubs for Looks 1 & 3–8; Look 2 is the gate.
 * `pathExists` optional: when omitted, all slots report missing-plates (fail-closed).
 */
export function eightLookPlateMatrix(
  pathExists: (url: string) => boolean = () => false,
): LookPlateSlot[] {
  return ROSTER_V24.map((entry) => {
    const requiredPaths =
      entry.starterId === LOOK2_STARTER_ID
        ? LOOK2_MINT_REQUIRED_PATHS
        : defaultRequiredPathsForEntry(entry);
    const missingPaths = requiredPaths.filter((p) => !pathExists(p));
    const status: PlateSlotStatus =
      missingPaths.length === 0 ? "ingest-ready" : "missing-plates";
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
    };
  });
}

export function lookPlateSlotByStarterId(
  starterId: string,
  pathExists: (url: string) => boolean = () => false,
): LookPlateSlot | undefined {
  return eightLookPlateMatrix(pathExists).find((s) => s.starterId === starterId);
}

/**
 * Look 2 mint gate — fail-closed.
 * Plates must exist; jacket/pants IDs must be mint pair; backpack OFF;
 * eyewear must be goggles-basic (not Meta Oakley / “eyewear-on” for acceptance).
 */
export function evaluateLook2MintGate(opts: {
  config: AvatarConfig;
  /** Sync existence probe (tests / Node). Browser may pass probe from Image cache. */
  pathExists?: (url: string) => boolean;
  /** Optional plate assembly probe; defaults from pathExists. */
  plateProbe?: (url: string) => PlateProbeStatus;
}): Look2MintGateResult {
  const { config } = opts;
  const pathExists = opts.pathExists ?? (() => false);
  const plateProbe: (url: string) => PlateProbeStatus =
    opts.plateProbe ?? ((url) => (pathExists(url) ? "present" : "missing"));

  const missingPaths = LOOK2_MINT_REQUIRED_PATHS.filter((p) => !pathExists(p));
  const presentCount = LOOK2_MINT_REQUIRED_PATHS.length - missingPaths.length;
  const failReasons: Look2MintFailReason[] = [];

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

  const assembly = evaluatePlateAssembly(config, plateProbe);
  const plateComplete = assembly.complete && missingPaths.length === 0;
  if (!plateComplete && !failReasons.includes("incomplete-set")) {
    failReasons.push("incomplete-set");
  }

  const acceptanceEligible =
    plateComplete &&
    failReasons.length === 0 &&
    config.starterId === LOOK2_STARTER_ID &&
    assembly.acceptanceEligible;

  return {
    starterId: LOOK2_STARTER_ID,
    acceptanceEligible,
    plateComplete,
    missingPaths,
    presentCount,
    requiredCount: LOOK2_MINT_REQUIRED_PATHS.length,
    failReasons: [...new Set(failReasons)],
    dataMissingPlates: missingPaths.length,
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

/** Ingest receipt when Ted/GB drops plates — never invents files. */
export function ingestLook2MintReceipt(pathExists: (url: string) => boolean): {
  ingested: boolean;
  missingPaths: readonly string[];
  readyPaths: readonly string[];
  blocked: boolean;
  note: string;
} {
  const missingPaths = LOOK2_MINT_REQUIRED_PATHS.filter((p) => !pathExists(p));
  const readyPaths = LOOK2_MINT_REQUIRED_PATHS.filter((p) => pathExists(p));
  const ingested = missingPaths.length === 0;
  return {
    ingested,
    missingPaths,
    readyPaths,
    blocked: !ingested,
    note: ingested
      ? "Look 2 mint plate set present under public/stomper — gate may flip eligible"
      : "Look 2 mint plates ABSENT — fail-closed; do not invent assets",
  };
}
