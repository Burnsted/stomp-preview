/**
 * Multi-rider shipped plate manifest (t1205u).
 * Extends Look 2 allowlist so Man 1 / Woman 3 / Man 2 prototype URLs
 * resolve as present without inventing missing production slots.
 */
import look2ManifestJson from "@/lib/stomp/avatar/look2-plate-manifest.json";
import modularManifestJson from "@/lib/stomp/avatar/modular-plate-manifest.json";
import { LOOK2_SHIPPED_PLATE_URLS } from "@/lib/stomp/avatar/look2-plate-manifest";

export type ModularPlateManifestEntry = {
  path: string;
  url: string;
  sha256: string;
  bytes: number;
  size: number[];
  slot?: string;
  starterId?: string;
};

export type ModularPlateManifest = {
  task?: string;
  status?: "REGISTERED_VISUAL_PROTOTYPE_ONLY" | string;
  androidAccepted?: boolean;
  androidQa?: string;
  riders?: string[];
  plates: ModularPlateManifestEntry[];
  requiredUrlsByStarter?: Record<string, string[]>;
  missingProductionSlots?: string[];
};

export const MODULAR_PLATE_MANIFEST = modularManifestJson as ModularPlateManifest;

const MODULAR_URLS: ReadonlySet<string> = new Set(
  MODULAR_PLATE_MANIFEST.plates.map((p) => p.url),
);

/** Look 2 + multi-rider prototype URLs known shipped on disk. */
export const ALL_SHIPPED_PROTOTYPE_PLATE_URLS: ReadonlySet<string> = new Set([
  ...LOOK2_SHIPPED_PLATE_URLS,
  ...MODULAR_URLS,
]);

/**
 * Sync existence for shipped prototype URLs (Look 2 + Man1/Woman3/Man2).
 * Fail-closed for every other path.
 */
export function shippedPlatePathExists(url: string): boolean {
  return ALL_SHIPPED_PROTOTYPE_PLATE_URLS.has(url);
}

export function modularPrototypeUrlsForStarter(starterId: string): string[] {
  return MODULAR_PLATE_MANIFEST.requiredUrlsByStarter?.[starterId] ?? [];
}

export function modularPrototypeAllShipped(starterId: string): boolean {
  const urls = modularPrototypeUrlsForStarter(starterId);
  return urls.length > 0 && urls.every((u) => ALL_SHIPPED_PROTOTYPE_PLATE_URLS.has(u));
}

/** Re-export Look2 manifest task pin for docs honesty. */
export const LOOK2_MANIFEST_TASK = (look2ManifestJson as { task?: string }).task;
