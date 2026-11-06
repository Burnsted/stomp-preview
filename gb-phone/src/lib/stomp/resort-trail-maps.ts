/**
 * Official resort trail-map catalog (t1218u).
 * Bundle/hotlink ONLY when embedAuthorized === true.
 * When unclear or denied → official-map link card (no invented trail diagrams).
 */
import { DEMO_RESORTS, type DemoResort } from "@/lib/stomp/home-mountain";

export type TrailMapPermission =
  | "embed-authorized"
  | "link-only"
  | "unclear";

export type ResortTrailMap = {
  resortId: string;
  resortName: string;
  operator: string;
  officialMapPageUrl: string;
  /** Authorized static image only — never set without written permission. */
  authorizedImageUrl: string | null;
  permission: TrailMapPermission;
  attribution: string;
  licenseNotes: string;
};

/**
 * Research snapshot 2026-11-05 — see docs/restore-approved-ui-t1218u/RESORT-TRAIL-MAP-LICENSING.md
 * All current resorts are link-only: no written embed grant found for this app.
 */
export const RESORT_TRAIL_MAPS: ResortTrailMap[] = [
  {
    resortId: "beaver-creek",
    resortName: "Beaver Creek",
    operator: "Vail Resorts",
    officialMapPageUrl:
      "https://www.beavercreek.com/the-mountain/about-the-mountain/trail-map.aspx",
    authorizedImageUrl: null,
    permission: "link-only",
    attribution: "Trail map © Vail Resorts / Beaver Creek. Link only — not embedded.",
    licenseNotes:
      "Vail Resorts Terms prohibit posting/transmitting Site content on other websites without prior written permission. Personal noncommercial single-copy download does not authorize app embedding or hotlinking.",
  },
  {
    resortId: "vail",
    resortName: "Vail",
    operator: "Vail Resorts",
    officialMapPageUrl: "https://www.vail.com/the-mountain/about-the-mountain/trail-maps.aspx",
    authorizedImageUrl: null,
    permission: "link-only",
    attribution: "Trail map © Vail Resorts / Vail. Link only — not embedded.",
    licenseNotes:
      "Same Vail Resorts content Terms of Use — no public embed grant located for third-party apps.",
  },
  {
    resortId: "breckenridge",
    resortName: "Breckenridge",
    operator: "Vail Resorts",
    officialMapPageUrl:
      "https://www.breckenridge.com/the-mountain/about-the-mountain/trail-maps.aspx",
    authorizedImageUrl: null,
    permission: "link-only",
    attribution: "Trail map © Vail Resorts / Breckenridge. Link only — not embedded.",
    licenseNotes:
      "Same Vail Resorts content Terms of Use — no public embed grant located for third-party apps.",
  },
  {
    resortId: "keystone",
    resortName: "Keystone",
    operator: "Vail Resorts",
    officialMapPageUrl:
      "https://www.keystoneresort.com/the-mountain/about-the-mountain/trail-maps.aspx",
    authorizedImageUrl: null,
    permission: "link-only",
    attribution: "Trail map © Vail Resorts / Keystone. Link only — not embedded.",
    licenseNotes: "Vail Resorts property — link to official map page only.",
  },
  {
    resortId: "park-city",
    resortName: "Park City",
    operator: "Vail Resorts",
    officialMapPageUrl:
      "https://www.parkcitymountain.com/the-mountain/about-the-mountain/trail-maps.aspx",
    authorizedImageUrl: null,
    permission: "link-only",
    attribution: "Trail map © Vail Resorts / Park City. Link only — not embedded.",
    licenseNotes: "Vail Resorts property — link to official map page only.",
  },
  {
    resortId: "stowe",
    resortName: "Stowe",
    operator: "Vail Resorts",
    officialMapPageUrl: "https://www.stowe.com/the-mountain/about-the-mountain/trail-maps.aspx",
    authorizedImageUrl: null,
    permission: "link-only",
    attribution: "Trail map © Vail Resorts / Stowe. Link only — not embedded.",
    licenseNotes: "Vail Resorts property — link to official map page only.",
  },
  {
    resortId: "snowbird",
    resortName: "Snowbird",
    operator: "Snowbird Ski & Summer Resort",
    officialMapPageUrl: "https://www.snowbird.com/the-mountain/maps/",
    authorizedImageUrl: null,
    permission: "unclear",
    attribution: "Trail map © Snowbird. Official page link only — embed permission unclear.",
    licenseNotes:
      "Official maps page exists; no clear public license for third-party embedding found. Do not invent or hotlink map art.",
  },
  {
    resortId: "mammoth",
    resortName: "Mammoth",
    operator: "Mammoth Mountain (Alterra)",
    officialMapPageUrl: "https://www.mammothmountain.com/on-the-mountain/trail-map",
    authorizedImageUrl: null,
    permission: "unclear",
    attribution: "Trail map © Mammoth Mountain. Official page link only — embed permission unclear.",
    licenseNotes:
      "Official trail map page exists; no written embed grant located for this demo app.",
  },
  {
    resortId: "palisades",
    resortName: "Palisades Tahoe",
    operator: "Palisades Tahoe (Alterra)",
    officialMapPageUrl: "https://www.palisadestahoe.com/mountain-information/trail-maps",
    authorizedImageUrl: null,
    permission: "unclear",
    attribution:
      "Trail map © Palisades Tahoe. Official page link only — embed permission unclear.",
    licenseNotes:
      "Official interactive/download maps exist; embedding/hotlinking not clearly authorized.",
  },
  {
    resortId: "killington",
    resortName: "Killington",
    operator: "Killington Resort (Alterra)",
    officialMapPageUrl: "https://www.killington.com/the-mountain/trail-map",
    authorizedImageUrl: null,
    permission: "unclear",
    attribution: "Trail map © Killington. Official page link only — embed permission unclear.",
    licenseNotes:
      "Interactive map at map.killington.com; no clear third-party embed license for static assets.",
  },
];

export function trailMapFor(resortId: string | null | undefined): ResortTrailMap | null {
  if (!resortId) return null;
  return RESORT_TRAIL_MAPS.find((m) => m.resortId === resortId) ?? null;
}

export function trailMapForResort(resort: DemoResort): ResortTrailMap {
  return (
    trailMapFor(resort.id) ?? {
      resortId: resort.id,
      resortName: resort.name,
      operator: "Unknown",
      officialMapPageUrl: "https://www.google.com/search?q=" + encodeURIComponent(resort.name + " official trail map"),
      authorizedImageUrl: null,
      permission: "unclear",
      attribution: `${resort.name} trail map — official source only. Not embedded.`,
      licenseNotes: "No catalog entry — treat as link-only until researched.",
    }
  );
}

export function canEmbedTrailMap(map: ResortTrailMap): boolean {
  return map.permission === "embed-authorized" && Boolean(map.authorizedImageUrl);
}

/** All demo resorts should have a catalog row (or explicit fallback). */
export function missingTrailMapCatalogIds(): string[] {
  return DEMO_RESORTS.map((r) => r.id).filter((id) => !trailMapFor(id));
}
