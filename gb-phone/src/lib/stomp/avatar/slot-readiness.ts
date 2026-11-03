/**
 * Character production slot readiness (t1173u → t1174u Look 6 lock).
 *
 * Tracks whether each Roster v2.4 look has an owner-approved visual MASTER
 * on disk for QA/provenance. Masters are NOT modular transparent clothing
 * plates — AvatarRenderer still uses plate URL → SVG fallback until GB
 * delivers true modular layers.
 *
 * HARD: Do not crop master composites / posters into fake production plates.
 * HARD: Do not insert substitute artwork or regenerate approved faces.
 * HARD: Do not invent look6-m-leo-APPROVED.png (or Look 4/5 masters) until Ted re-attaches.
 */
import {
  ARTWORK_LAYER_ORDER,
  EYEWEAR_ITEM_IDS,
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

/**
 * File-on-disk master status.
 * - APPROVED_MASTER: owner PNG committed under docs/.../masters/
 * - AWAITING_MASTER_FILE: owner prose LOCKED/approved but PNG not on disk yet
 * - AWAITING_MASTER: production approval and/or file still pending
 */
export type MasterStatus =
  | "APPROVED_MASTER"
  | "AWAITING_MASTER_FILE"
  | "AWAITING_MASTER";

/** Owner decision layer (independent of whether the PNG has landed). */
export type OwnerApprovalState =
  | "OWNER_LOCKED"
  | "OWNER_APPROVED_PENDING_FILE"
  | "PENDING_PRODUCTION_APPROVAL";

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
 * Only Looks 1–3 are on disk today — do NOT invent Look 4/5/6 paths.
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

/** Looks whose master PNG is committed (t1173u / t1174ua2). */
export const APPROVED_MASTER_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "adult-look-1",
  "adult-look-2",
  "adult-look-3",
] as const;

/**
 * Look 6 — Ted t1174u OWNER LOCK prose complete; master PNG pending re-attach.
 * Status string: OWNER_LOCKED + AWAITING_MASTER_FILE
 */
export const OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "adult-look-6",
] as const;

/**
 * Looks 4–5 — Ted says Adults 1–6 APPROVED; PNGs not on disk; no substitutes.
 */
export const OWNER_APPROVED_PENDING_FILE_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "adult-look-4",
  "adult-look-5",
] as const;

/** Grom — individual production approval still pending. */
export const AWAITING_MASTER_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "grom-boy",
  "grom-girl",
] as const;

/** Expected path when Ted re-attaches Look 6 (do not invent the file). */
export const LOOK6_MASTER_PENDING_PATH =
  "docs/character-production-t1173u/masters/look6-m-leo-APPROVED.png" as const;

/**
 * Look 6 eyewear lock (t1174u): black snow goggles on head ONLY.
 * Meta Oakley Vanguard / glasses-meta-oakley are FORBIDDEN on m-leo.
 */
export const LOOK6_EYEWEAR_CONTRACT = {
  starterId: "m-leo",
  lookKey: "adult-look-6" as RosterV24LookKey,
  allowedItemIds: [EYEWEAR_ITEM_IDS.goggles] as const,
  forbiddenItemIds: [EYEWEAR_ITEM_IDS.glassesMetaOakley] as const,
  note: "goggles-on-head ONLY — no Meta Oakley Vanguard glasses on Look 6",
} as const;

/**
 * Woz is the development agent — NEVER a STOMPER character / preset displayName.
 * Starters remain appearance templates (Look N of M), not rider names.
 */
export const FORBIDDEN_STOMPER_AGENT_NAMES = ["Woz", "woz", "WOZ"] as const;

export function isForbiddenAgentStomperName(raw: string): boolean {
  const t = raw.trim();
  return FORBIDDEN_STOMPER_AGENT_NAMES.some((n) => n.toLowerCase() === t.toLowerCase());
}

export type CharacterSlotReadiness = {
  lookKey: RosterV24LookKey;
  starterId: string;
  ageBand: AgeBand;
  lookIndex1Based: number;
  lookTotal: number;
  masterStatus: MasterStatus;
  ownerApproval: OwnerApprovalState;
  /** Human-readable combined status for reports. */
  statusLabel: string;
  /** Docs-only provenance path when APPROVED_MASTER; null when file absent. */
  visualMasterPath: string | null;
  /** Documented future path when AWAITING_MASTER_FILE (Look 6); never invent file. */
  pendingMasterPath: string | null;
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

function statusesFor(lookKey: RosterV24LookKey): {
  masterStatus: MasterStatus;
  ownerApproval: OwnerApprovalState;
  statusLabel: string;
  visualMasterPath: string | null;
  pendingMasterPath: string | null;
} {
  if (APPROVED_MASTER_LOOK_KEYS.includes(lookKey)) {
    return {
      masterStatus: "APPROVED_MASTER",
      ownerApproval: "OWNER_LOCKED",
      statusLabel: "APPROVED_MASTER",
      visualMasterPath: APPROVED_VISUAL_MASTER_PATHS[lookKey] ?? null,
      pendingMasterPath: null,
    };
  }
  if (OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS.includes(lookKey)) {
    return {
      masterStatus: "AWAITING_MASTER_FILE",
      ownerApproval: "OWNER_LOCKED",
      statusLabel: "OWNER_LOCKED + AWAITING_MASTER_FILE",
      visualMasterPath: null,
      pendingMasterPath: LOOK6_MASTER_PENDING_PATH,
    };
  }
  if (OWNER_APPROVED_PENDING_FILE_LOOK_KEYS.includes(lookKey)) {
    return {
      masterStatus: "AWAITING_MASTER",
      ownerApproval: "OWNER_APPROVED_PENDING_FILE",
      statusLabel: "OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER",
      visualMasterPath: null,
      pendingMasterPath: null,
    };
  }
  // Grom
  return {
    masterStatus: "AWAITING_MASTER",
    ownerApproval: "PENDING_PRODUCTION_APPROVAL",
    statusLabel: "AWAITING_MASTER",
    visualMasterPath: null,
    pendingMasterPath: null,
  };
}

export function slotReadinessForEntry(entry: RosterV24Entry): CharacterSlotReadiness {
  const st = statusesFor(entry.lookKey);
  return {
    lookKey: entry.lookKey,
    starterId: entry.starterId,
    ageBand: entry.ageBand,
    lookIndex1Based: entry.lookIndex1Based,
    lookTotal: entry.lookTotal,
    masterStatus: st.masterStatus,
    ownerApproval: st.ownerApproval,
    statusLabel: st.statusLabel,
    visualMasterPath: st.visualMasterPath,
    pendingMasterPath: st.pendingMasterPath,
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

export function awaitingMasterFileSlots(): CharacterSlotReadiness[] {
  return allCharacterSlotReadiness().filter((s) => s.masterStatus === "AWAITING_MASTER_FILE");
}

export function awaitingMasterSlots(): CharacterSlotReadiness[] {
  return allCharacterSlotReadiness().filter((s) => s.masterStatus === "AWAITING_MASTER");
}

/** Look 6 combined status for reports. */
export function look6StatusLabel(): string {
  const s = slotReadinessByStarterId("m-leo");
  if (!s) throw new Error("m-leo slot missing");
  return s.statusLabel;
}

export function look6AllowsEyewearItemId(itemId: string): boolean {
  if ((LOOK6_EYEWEAR_CONTRACT.forbiddenItemIds as readonly string[]).includes(itemId)) {
    return false;
  }
  return (LOOK6_EYEWEAR_CONTRACT.allowedItemIds as readonly string[]).includes(itemId);
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
  awaitingMasterFileCount: number;
  awaitingMasterCount: number;
  slotCount: number;
  look6Status: string;
} {
  const slots = allCharacterSlotReadiness();
  if (slots.length !== 8) throw new Error("Expected 8 character slots");
  const approved = slots.filter((s) => s.masterStatus === "APPROVED_MASTER");
  const awaitingFile = slots.filter((s) => s.masterStatus === "AWAITING_MASTER_FILE");
  const awaiting = slots.filter((s) => s.masterStatus === "AWAITING_MASTER");
  if (approved.length !== 3) throw new Error("Expected exactly 3 APPROVED_MASTER slots (Looks 1–3)");
  if (awaitingFile.length !== 1) {
    throw new Error("Expected exactly 1 AWAITING_MASTER_FILE slot (Look 6 m-leo)");
  }
  if (awaiting.length !== 4) {
    throw new Error("Expected 4 AWAITING_MASTER slots (Looks 4–5 + Grom)");
  }
  for (const s of approved) {
    if (!s.visualMasterPath) throw new Error(`APPROVED_MASTER ${s.lookKey} missing visualMasterPath`);
    if (!s.visualMasterPath.includes("docs/character-production-t1173u/masters/")) {
      throw new Error(`Master path must stay under docs provenance folder: ${s.starterId}`);
    }
    if (s.mastersAreNotModularPlates !== true) {
      throw new Error("Masters must not be treated as modular plates");
    }
  }
  const look6 = slots.find((s) => s.starterId === "m-leo");
  if (!look6) throw new Error("m-leo missing");
  if (look6.statusLabel !== "OWNER_LOCKED + AWAITING_MASTER_FILE") {
    throw new Error(`Look 6 statusLabel mismatch: ${look6.statusLabel}`);
  }
  if (look6.visualMasterPath !== null) {
    throw new Error("Look 6 must not claim visualMasterPath until PNG is committed");
  }
  if (look6.pendingMasterPath !== LOOK6_MASTER_PENDING_PATH) {
    throw new Error("Look 6 pendingMasterPath must document look6-m-leo-APPROVED.png");
  }
  for (const s of [...awaitingFile, ...awaiting]) {
    if (s.visualMasterPath !== null) {
      throw new Error(`${s.masterStatus} ${s.lookKey} must not claim a visualMasterPath`);
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
  if (!look6AllowsEyewearItemId(EYEWEAR_ITEM_IDS.goggles)) {
    throw new Error("Look 6 must allow goggles-basic");
  }
  if (look6AllowsEyewearItemId(EYEWEAR_ITEM_IDS.glassesMetaOakley)) {
    throw new Error("Look 6 must forbid glasses-meta-oakley");
  }
  if (!isForbiddenAgentStomperName("Woz")) {
    throw new Error("Woz must remain a forbidden STOMPER displayName");
  }
  return {
    ok: true,
    approvedMasterCount: approved.length,
    awaitingMasterFileCount: awaitingFile.length,
    awaitingMasterCount: awaiting.length,
    slotCount: slots.length,
    look6Status: look6.statusLabel,
  };
}
