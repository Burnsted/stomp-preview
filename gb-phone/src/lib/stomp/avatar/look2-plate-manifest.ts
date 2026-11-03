/**
 * Look 2 mint plate ship manifest (t1188u/t1189u).
 * Generated from owner modular sheet — do not invent paths.
 */
import manifestJson from "@/lib/stomp/avatar/look2-plate-manifest.json";

export type Look2PlateManifestEntry = {
  path: string;
  url: string;
  sha256: string;
  bytes: number;
  size: number[];
};

export type Look2PlateManifest = {
  sourceSheet: string;
  sourceSha256: string;
  sourceSize: number[];
  inkVariants: "ABSENT" | "PRESENT";
  look2MintRequiredPresent: boolean;
  optionalBackpackPresent: boolean;
  plates: Look2PlateManifestEntry[];
  requiredUrls: string[];
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
