/**
 * Look 2 plate ship manifest (t1188u → t1194u registration → t1197u art-pass).
 * Prototype 8-of-11 registered; production 11-slot Android gate stays fail-closed.
 * Do not invent separated face/hair/goggles/board or claim Android PASS.
 */
import manifestJson from "@/lib/stomp/avatar/look2-plate-manifest.json";

export type Look2PlateManifestEntry = {
  path: string;
  url: string;
  sha256: string;
  bytes: number;
  size: number[];
  slot?: string;
};

export type Look2UnderJacketBodyStatus =
  | "AWAITING_FRANZ_BODY"
  | "PRESENT_APPROVED"
  | "PROTOTYPE_PRESENT";

export type Look2VisualRegistrationGate =
  | "BLOCKED_UNDERLAYER"
  | "PASS"
  | "ENGINEERING_ONLY"
  | "PROTOTYPE_AWAITING_ACCEPTANCE";

export type Look2CompositeStatus =
  | "BLOCKED"
  | "PASS"
  | "EXTRACTED_REGISTERED"
  | "PROTOTYPE_RENDERED";

export type Look2PlateManifest = {
  task?: string;
  status?: "REGISTERED_VISUAL_PROTOTYPE_ONLY" | string;
  artPass?: string;
  sourceZipSha256?: string;
  priorMorningZipSha256?: string;
  preferredPack?: string;
  sourceSheet?: string;
  sourceSha256?: string;
  sourceSize?: number[];
  approvedMaster?: string;
  approvedMasterSha256?: string;
  registrationContract?: string;
  productionCanvas?: number;
  runtimeCanvas?: number;
  commonScale?: number;
  inkVariants: "ABSENT" | "PRESENT";
  inkColorway?: string;
  underJacketBody?: Look2UnderJacketBodyStatus;
  visualRegistrationGate?: Look2VisualRegistrationGate;
  compositeA?: Look2CompositeStatus;
  compositeB?: Look2CompositeStatus;
  compositeC?: Look2CompositeStatus;
  androidAccepted?: boolean;
  editableMasterOra?: string;
  look2MintRequiredPresent: boolean;
  look2InkRequiredPresent?: boolean;
  prototypePlateCount?: number;
  productionSlotCount?: number;
  missingProductionSlots?: string[];
  openArtRepairs?: string[];
  optionalBackpackPresent: boolean;
  plates: Look2PlateManifestEntry[];
  requiredUrls: string[];
  prototypeRequiredUrls?: string[];
  extractScript?: string;
};

export const LOOK2_PLATE_MANIFEST = manifestJson as Look2PlateManifest;

export const LOOK2_SHIPPED_PLATE_URLS: ReadonlySet<string> = new Set(
  LOOK2_PLATE_MANIFEST.plates.map((p) => p.url),
);

/** Sync existence for shipped Look 2 URLs (fail-closed for all other looks). */
export function shippedPlatePathExists(url: string): boolean {
  return LOOK2_SHIPPED_PLATE_URLS.has(url);
}

export function look2MintRequiredAllShipped(): boolean {
  return (
    LOOK2_PLATE_MANIFEST.look2MintRequiredPresent === true &&
    LOOK2_PLATE_MANIFEST.requiredUrls.every((u) => LOOK2_SHIPPED_PLATE_URLS.has(u))
  );
}

export function look2PrototypeRequiredAllShipped(): boolean {
  const urls = LOOK2_PLATE_MANIFEST.prototypeRequiredUrls ?? [];
  return (
    urls.length > 0 && urls.every((u) => LOOK2_SHIPPED_PLATE_URLS.has(u))
  );
}

/** Honest visual / artwork gate — never equate file presence with PASS. */
export function look2VisualRegistrationStatus(): {
  underJacketBody: Look2UnderJacketBodyStatus;
  visualRegistrationGate: Look2VisualRegistrationGate;
  compositeA: Look2CompositeStatus;
  compositeB: Look2CompositeStatus;
  compositeC: Look2CompositeStatus;
  inkVariants: "ABSENT" | "PRESENT";
  androidDevicePassClaimed: false;
  status: "REGISTERED_VISUAL_PROTOTYPE_ONLY" | string;
} {
  return {
    underJacketBody: LOOK2_PLATE_MANIFEST.underJacketBody ?? "AWAITING_FRANZ_BODY",
    visualRegistrationGate:
      LOOK2_PLATE_MANIFEST.visualRegistrationGate ?? "BLOCKED_UNDERLAYER",
    compositeA: LOOK2_PLATE_MANIFEST.compositeA ?? "BLOCKED",
    compositeB: LOOK2_PLATE_MANIFEST.compositeB ?? "EXTRACTED_REGISTERED",
    compositeC: LOOK2_PLATE_MANIFEST.compositeC ?? "BLOCKED",
    inkVariants: LOOK2_PLATE_MANIFEST.inkVariants,
    androidDevicePassClaimed: false,
    status: LOOK2_PLATE_MANIFEST.status ?? "REGISTERED_VISUAL_PROTOTYPE_ONLY",
  };
}
