/**
 * Look 2 mint plate ship manifest (t1188u/t1189u → t1194u registration fix).
 * Generated from owner modular sheet via fixed 1024→512 registration extract.
 * Do not invent paths / ink / Franz body.
 */
import manifestJson from "@/lib/stomp/avatar/look2-plate-manifest.json";

export type Look2PlateManifestEntry = {
  path: string;
  url: string;
  sha256: string;
  bytes: number;
  size: number[];
};

export type Look2UnderJacketBodyStatus = "AWAITING_FRANZ_BODY" | "PRESENT_APPROVED";
export type Look2VisualRegistrationGate =
  | "BLOCKED_UNDERLAYER"
  | "PASS"
  | "ENGINEERING_ONLY";

export type Look2PlateManifest = {
  sourceSheet: string;
  sourceSha256: string;
  sourceSize: number[];
  approvedMaster?: string;
  approvedMasterSha256?: string;
  registrationContract?: string;
  productionCanvas?: number;
  runtimeCanvas?: number;
  commonScale?: number;
  inkVariants: "ABSENT" | "PRESENT";
  underJacketBody?: Look2UnderJacketBodyStatus;
  visualRegistrationGate?: Look2VisualRegistrationGate;
  compositeA?: "BLOCKED" | "PASS";
  compositeB?: "EXTRACTED_REGISTERED" | "BLOCKED";
  compositeC?: "BLOCKED" | "PASS";
  editableMasterOra?: string;
  look2MintRequiredPresent: boolean;
  optionalBackpackPresent: boolean;
  plates: Look2PlateManifestEntry[];
  requiredUrls: string[];
  extractScript?: string;
  task?: string;
};

export const LOOK2_PLATE_MANIFEST = manifestJson as Look2PlateManifest;

export const LOOK2_SHIPPED_PLATE_URLS: ReadonlySet<string> = new Set(
  LOOK2_PLATE_MANIFEST.plates.map((p) => p.url),
);

/** Sync existence for shipped Look 2 mint URLs (fail-closed for all other looks). */
export function shippedPlatePathExists(url: string): boolean {
  return LOOK2_SHIPPED_PLATE_URLS.has(url);
}

export function look2MintRequiredAllShipped(): boolean {
  return (
    LOOK2_PLATE_MANIFEST.look2MintRequiredPresent === true &&
    LOOK2_PLATE_MANIFEST.requiredUrls.every((u) => LOOK2_SHIPPED_PLATE_URLS.has(u))
  );
}

/** Honest visual / artwork gate — never equate file presence with PASS. */
export function look2VisualRegistrationStatus(): {
  underJacketBody: Look2UnderJacketBodyStatus;
  visualRegistrationGate: Look2VisualRegistrationGate;
  compositeA: "BLOCKED" | "PASS";
  compositeB: "EXTRACTED_REGISTERED" | "BLOCKED";
  compositeC: "BLOCKED" | "PASS";
  inkVariants: "ABSENT" | "PRESENT";
  androidDevicePassClaimed: false;
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
  };
}
