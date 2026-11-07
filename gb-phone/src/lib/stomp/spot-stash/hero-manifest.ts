/**
 * t1246u — typed Spot hero image slots.
 * Ted wants real rider-on-feature photos later. Do NOT copy/hotlink photos.
 * Drop licensed files at imagePath; credit + license stay in this manifest.
 */
import type { SpotFeatureType } from "@woz/spot-stash/types.js";

export const SPOT_HERO_PLACEHOLDER_LABEL =
  "photo slot — licensed rider photo pending" as const;

export type SpotHeroImageEntry = {
  featureType: SpotFeatureType;
  /** Relative public path once a licensed photo is cleared — null = placeholder. */
  imagePath: string | null;
  credit: string;
  license: string;
};

export const SPOT_HERO_MANIFEST: Record<SpotFeatureType, SpotHeroImageEntry> = {
  kicker: {
    featureType: "kicker",
    imagePath: null,
    credit: "",
    license: "pending-license",
  },
  trees: {
    featureType: "trees",
    imagePath: null,
    credit: "",
    license: "pending-license",
  },
  rail: {
    featureType: "rail",
    imagePath: null,
    credit: "",
    license: "pending-license",
  },
  jump: {
    featureType: "jump",
    imagePath: null,
    credit: "",
    license: "pending-license",
  },
};

export function heroEntryFor(
  featureType: SpotFeatureType,
): SpotHeroImageEntry {
  return SPOT_HERO_MANIFEST[featureType];
}
