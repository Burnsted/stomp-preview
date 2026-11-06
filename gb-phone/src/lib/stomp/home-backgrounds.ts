/**
 * Rotating Home mountain backgrounds (t1236u).
 * Generic / original / free-license scenery only — never labeled as the selected resort.
 * No paid CDN; assets are bundled under /stomp/home-bg/.
 */
import { publicUrl } from "@/lib/public-url";

export type HomeBackgroundKind = "original-svg" | "free-license-photo";

export type HomeBackground = {
  id: string;
  label: string;
  /** Public path via publicUrl */
  src: string;
  kind: HomeBackgroundKind;
  /** Honest provenance for OWNER-REPORT */
  provenance: string;
  /** Always false until authorized selected-resort photography ships */
  authorizedSelectedResort: false;
};

/** Ten environments — order is the rotate library. */
export const HOME_BACKGROUNDS: readonly HomeBackground[] = [
  {
    id: "alpine-morning",
    label: "Alpine morning",
    src: publicUrl("/stomp/home-bg/alpine-morning.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic alpine morning gradients; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "powder-bowl",
    label: "Powder bowl",
    src: publicUrl("/stomp/home-bg/powder-bowl.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic powder bowl; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "snow-forest",
    label: "Snow-covered forest",
    src: publicUrl("/stomp/home-bg/snow-forest.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic snow forest; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "terrain-park",
    label: "Terrain park",
    src: publicUrl("/stomp/home-bg/terrain-park.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic park features; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "sunset-ridge",
    label: "Sunset ridge",
    src: publicUrl("/stomp/home-bg/sunset-ridge.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic sunset ridge; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "high-alpine",
    label: "High-alpine panorama",
    src: publicUrl("/stomp/home-bg/high-alpine.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic high-alpine peaks; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "chairlift-view",
    label: "Chairlift mountain view",
    src: publicUrl("/stomp/home-bg/chairlift-view.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic chairlift silhouette; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "fresh-snowfall",
    label: "Fresh snowfall",
    src: publicUrl("/stomp/home-bg/fresh-snowfall.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic snowfall; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "bluebird-groomers",
    label: "Bluebird groomers",
    src: publicUrl("/stomp/home-bg/bluebird-groomers.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic bluebird groomers; not a resort photo.",
    authorizedSelectedResort: false,
  },
  {
    id: "mountain-village",
    label: "Mountain village",
    src: publicUrl("/stomp/home-bg/mountain-village.svg"),
    kind: "original-svg",
    provenance: "Original STOMP preview SVG (t1236u) — generic village silhouette; not a resort photo.",
    authorizedSelectedResort: false,
  },
] as const;

/** Optional free-license photo enrichments (not in the rotate-10 set; documented only). */
export const HOME_BG_FREE_LICENSE_EXTRAS = [
  {
    path: "/stomp/home-bg/pexels-2433353-air.jpg",
    provenance: "Pexels #2433353 (free license) via flutter-holding trailclip CREDITS.md — generic action, not selected-resort.",
  },
  {
    path: "/stomp/home-bg/unsplash-8af4e6624178-air.jpg",
    provenance: "Unsplash photo-1551524559-8af4e6624178 (Unsplash License) via trailclip CREDITS.md — generic, not selected-resort.",
  },
  {
    path: "/stomp/home-bg/ted-free-snow-selfie.jpg",
    provenance: "Ted-provided free-license snow selfie (Unsplash/Pexels) via trailclip CREDITS.md — not selected-resort.",
  },
  {
    path: "/stomp/home-bg/ted-free-filming-air.jpg",
    provenance: "Ted-provided free-license filming-air (Unsplash/Pexels) via trailclip CREDITS.md — not selected-resort.",
  },
] as const;

export const HOME_BG_ROTATE_MS = 12_000;

export function homeBackgroundAt(index: number): HomeBackground {
  const i = ((index % HOME_BACKGROUNDS.length) + HOME_BACKGROUNDS.length) % HOME_BACKGROUNDS.length;
  return HOME_BACKGROUNDS[i]!;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
