/**
 * Resort-ID → official branding mapping (t1230u).
 *
 * Policy: only use authorized, in-repo brand assets with proven permission.
 * Do NOT scrape trademarked logos from the public web.
 * Do NOT invent or approximate trademarked artwork.
 * Missing authorized asset → text/wordmark fallback (expected and correct).
 *
 * Identification only — never claim affiliation or commercial endorsement.
 */
import { DEMO_RESORTS, type DemoResort } from "@/lib/stomp/home-mountain";

export type ResortBrandMode = "authorized-asset" | "text-fallback";

export type ResortBrandPermission = "authorized" | "none" | "unclear";

export type ResortBrand = {
  resortId: string;
  resortName: string;
  mode: ResortBrandMode;
  /** Bundled public path for light backgrounds (authorized only). */
  assetLightUrl: string | null;
  /** Bundled public path for dark backgrounds (authorized only). */
  assetDarkUrl: string | null;
  permission: ResortBrandPermission;
  source: string;
  notes: string;
};

/**
 * Catalog mapping. Start with Beaver Creek / Vail / Breckenridge, then every
 * DEMO_RESORTS row. Today: no authorized logo assets ship in-repo → all text fallback.
 */
const BRAND_ROWS: ResortBrand[] = [
  {
    resortId: "beaver-creek",
    resortName: "Beaver Creek",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo. Vail Resorts marks require written license (IMG / brand desk).",
    notes: "Text wordmark fallback. Do not scrape beavercreek.com logos.",
  },
  {
    resortId: "vail",
    resortName: "Vail",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo. Vail Resorts marks require written license (IMG / brand desk).",
    notes: "Text wordmark fallback. Do not scrape vail.com logos.",
  },
  {
    resortId: "breckenridge",
    resortName: "Breckenridge",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo. Vail Resorts marks require written license (IMG / brand desk).",
    notes: "Text wordmark fallback. Catalog added t1230u for Trails branding coverage.",
  },
  {
    resortId: "keystone",
    resortName: "Keystone",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
  {
    resortId: "park-city",
    resortName: "Park City",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
  {
    resortId: "snowbird",
    resortName: "Snowbird",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
  {
    resortId: "mammoth",
    resortName: "Mammoth",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
  {
    resortId: "palisades",
    resortName: "Palisades Tahoe",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
  {
    resortId: "stowe",
    resortName: "Stowe",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
  {
    resortId: "killington",
    resortName: "Killington",
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset in repo.",
    notes: "Text wordmark fallback.",
  },
];

const BY_ID = new Map(BRAND_ROWS.map((row) => [row.resortId, row]));

function textFallbackFor(resort: DemoResort): ResortBrand {
  return {
    resortId: resort.id,
    resortName: resort.name,
    mode: "text-fallback",
    assetLightUrl: null,
    assetDarkUrl: null,
    permission: "none",
    source: "No authorized logo asset mapped for this resort.",
    notes: "Text wordmark fallback.",
  };
}

export function brandForResortId(resortId: string | null | undefined): ResortBrand | null {
  if (!resortId) return null;
  const mapped = BY_ID.get(resortId);
  if (mapped) return mapped;
  const resort = DEMO_RESORTS.find((r) => r.id === resortId);
  return resort ? textFallbackFor(resort) : null;
}

export function brandForResort(resort: DemoResort): ResortBrand {
  return brandForResortId(resort.id) ?? textFallbackFor(resort);
}

/** True when an authorized image URL exists for the requested surface tone. */
export function hasAuthorizedBrandAsset(
  brand: ResortBrand,
  surface: "light" | "dark" = "dark",
): boolean {
  if (brand.mode !== "authorized-asset" || brand.permission !== "authorized") return false;
  return Boolean(surface === "light" ? brand.assetLightUrl : brand.assetDarkUrl);
}

export function allResortBrands(): ResortBrand[] {
  return DEMO_RESORTS.map((r) => brandForResort(r));
}

/** Resorts that still need an authorized asset (all of them until grants land). */
export function resortsNeedingBrandAsset(): string[] {
  return allResortBrands()
    .filter((b) => b.mode === "text-fallback")
    .map((b) => b.resortId);
}
