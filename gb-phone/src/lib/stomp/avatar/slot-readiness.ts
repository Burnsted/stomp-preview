/**
 * Character production slot readiness (t1173u).
 *
 * Tracks whether each Roster v2.4 look has an owner-approved visual MASTER
 * on disk for QA/provenance. Masters are NOT modular transparent clothing
 * plates — AvatarRenderer still uses plate URL → SVG fallback until GB
 * delivers true modular layers.
 *
 * HARD: Do not crop master composites / posters into fake production plates.
 * HARD: Do not insert substitute artwork or regenerate approved faces.
 */
import {
  ARTWORK_LAYER_ORDER,
  buildPlateUrl,
  buildStarterPreviewUrl,
  resolveLayerPlate,
  type ArtworkSize,
} from "@/lib/stomp/avatar/artwork";
import {
  ROSTER_V24,
  type RosterV24Entry,
  type RosterV24LookKey,
} from "@/lib/stomp/avatar/roster-v24";
import type { AgeBand, AvatarSlot } from "@/lib/stomp/avatar/types";

/** Owner visual-master status for a roster look slot. */
export type MasterStatus = "APPROVED_MASTER" | "AWAITING_MASTER";

/** Surfaces that must share the same starterId / silhouette / layers. */
export type ConsistencySurface = "selector" | "build-your-look" | "locker";

export const CONSISTENCY_SURFACES: readonly ConsistencySurface[] = [
  "selector",
  "build-your-look",
  "locker",
] as const;

/**
 * Provenance paths for owner-approved visual masters (docs only).
 * Relative to repo root. Not served as modular runtime plates.
 */
export const APPROVED_VISUAL_MASTER_PATHS: Readonly<
  Partial<Record<RosterV24LookKey, string>>
> = {
  "adult-look-1":
    "docs/character-production-t1173u/masters/look1-m-samir-APPROVED.png",
  "adult-look-2":
    "docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png",
  "adult-look-3":
    "docs/character-production-t1173u/masters/look3-f-priya-APPROVED.png",
};

/** Looks whose owner visual master is APPROVED (t1173u / t1174ua2). */
export const APPROVED_MASTER_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "adult-look-1",
  "adult-look-2",
  "adult-look-3",
] as const;

/** Looks still awaiting owner visual masters (no substitute art). */
export const AWAITING_MASTER_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "adult-look-4",
  "adult-look-5",
  "adult-look-6",
  "grom-boy",
  "grom-girl",
] as const;

export type CharacterSlotReadiness = {
  lookKey: RosterV24LookKey;
  starterId: string;
  ageBand: AgeBand;
  lookIndex1Based: number;
  lookTotal: number;
  masterStatus: MasterStatus;
  /** Docs-only provenance path when APPROVED_MASTER; null when awaiting. */
  visualMasterPath: string | null;
  /** Preview plate URL contract (loads when file exists under public/stomper). */
  starterPreviewUrl: string;
  /** SVG fallback remains until modular plates land. */
  svgFallbackUntilPlates: true;
  /** Surfaces wired to this starterId. */
  surfaces: readonly ConsistencySurface[];
  /** Modular plates are separate from visual masters. */
  mastersAreNotModularPlates: true;
  previewOnly: boolean;
};

function masterStatusFor(lookKey: RosterV24LookKey): MasterStatus {
  return APPROVED_MASTER_LOOK_KEYS.includes(lookKey)
    ? "APPROVED_MASTER"
    : "AWAITING_MASTER";
}

export function slotReadinessForEntry(entry: RosterV24Entry): CharacterSlotReadiness {
  const masterStatus = masterStatusFor(entry.lookKey);
  const visualMasterPath =
    masterStatus === "APPROVED_MASTER"
      ? (APPROVED_VISUAL_MASTER_PATHS[entry.lookKey] ?? null)
      : null;
  return {
    lookKey: entry.lookKey,
    starterId: entry.starterId,
    ageBand: entry.ageBand,
    lookIndex1Based: entry.lookIndex1Based,
    lookTotal: entry.lookTotal,
    masterStatus,
    visualMasterPath,
    starterPreviewUrl: buildStarterPreviewUrl(entry.ageBand, entry.starterId),
    svgFallbackUntilPlates: true,
    surfaces: CONSISTENCY_SURFACES,
    mastersAreNotModularPlates: true,
    previewOnly: entry.previewOnly,
  };
}

/** All eight roster slots — integration-ready; art may still be awaiting. */
export function allCharacterSlotReadiness(): CharacterSlotReadiness[] {
  return ROSTER_V24.map(slotReadinessForEntry);
}

export function slotReadinessByStarterId(
  starterId: string,
): CharacterSlotReadiness | undefined {
  const entry = ROSTER_V24.find((e) => e.starterId === starterId);
  return entry ? slotReadinessForEntry(entry) : undefined;
}

export function approvedMasterSlots(): CharacterSlotReadiness[] {
  return allCharacterSlotReadiness().filter((s) => s.masterStatus === "APPROVED_MASTER");
}

export function awaitingMasterSlots(): CharacterSlotReadiness[] {
  return allCharacterSlotReadiness().filter((s) => s.masterStatus === "AWAITING_MASTER");
}

/**
 * Plate URL contract for a slot item — same builder used by selector / Build /
 * Locker via AvatarRenderer. Existence probe optional; missing → svg-fallback.
 */
export function plateUrlForSlotItem(
  ageBand: AgeBand,
  slot: AvatarSlot,
  itemId: string,
  size: ArtworkSize = 512,
): string {
  return buildPlateUrl(ageBand, slot, itemId, size);
}

/** Default resolve path until modular plates exist on disk. */
export function defaultPlateOrSvgFallback(opts: {
  ageBand: AgeBand;
  slot: AvatarSlot;
  itemId: string;
}): ReturnType<typeof resolveLayerPlate> {
  return resolveLayerPlate({ ...opts, plateExists: () => false });
}

/** Paint-order slots every surface must honor for clothing consistency. */
export function consistencyLayerOrder(): readonly AvatarSlot[] {
  return ARTWORK_LAYER_ORDER;
}

/**
 * Forbidden production practice — documented + asserted in tests.
 * Visual masters / composite posters MUST NOT be cropped into fake plates.
 */
export const FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES = true as const;

export function assertSlotReadinessIntegrity(): {
  ok: true;
  approvedMasterCount: number;
  awaitingMasterCount: number;
  slotCount: number;
} {
  const slots = allCharacterSlotReadiness();
  if (slots.length !== 8) throw new Error("Expected 8 character slots");
  const approved = slots.filter((s) => s.masterStatus === "APPROVED_MASTER");
  const awaiting = slots.filter((s) => s.masterStatus === "AWAITING_MASTER");
  if (approved.length !== 3) throw new Error("Expected exactly 3 APPROVED_MASTER slots (Looks 1–3)");
  if (awaiting.length !== 5) throw new Error("Expected 5 AWAITING_MASTER slots (Looks 4–6 + Grom)");
  for (const s of approved) {
    if (!s.visualMasterPath) throw new Error(`APPROVED_MASTER ${s.lookKey} missing visualMasterPath`);
    if (!s.visualMasterPath.includes("docs/character-production-t1173u/masters/")) {
      throw new Error(`Master path must stay under docs provenance folder: ${s.starterId}`);
    }
    if (s.mastersAreNotModularPlates !== true) {
      throw new Error("Masters must not be treated as modular plates");
    }
  }
  for (const s of awaiting) {
    if (s.visualMasterPath !== null) {
      throw new Error(`AWAITING_MASTER ${s.lookKey} must not claim a visualMasterPath`);
    }
  }
  for (const s of slots) {
    if (s.svgFallbackUntilPlates !== true) {
      throw new Error(`Slot ${s.starterId} must keep SVG fallback until plates arrive`);
    }
    if (s.surfaces.length !== CONSISTENCY_SURFACES.length) {
      throw new Error(`Slot ${s.starterId} missing consistency surfaces`);
    }
  }
  if (!FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES) {
    throw new Error("Poster-crop forbid flag must remain true");
  }
  return {
    ok: true,
    approvedMasterCount: approved.length,
    awaitingMasterCount: awaiting.length,
    slotCount: slots.length,
  };
}
