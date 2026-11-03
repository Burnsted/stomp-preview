/**
 * Character production slot readiness (t1173u → t1175u / t1176ua0).
 *
 * All eight Roster v2.4 looks are OWNER APPROVED_MASTER (visual refs on disk).
 * Masters are NOT modular transparent clothing plates — AvatarRenderer still
 * uses plate URL → SVG fallback until GB delivers true modular WebP layers.
 *
 * HARD: Do not crop master composites / posters into fake production plates.
 * HARD: Do not regenerate / reinterpret / recolor / substitute approved faces.
 * Handoff package: docs/character-production-t1173u/handoff-t1175u/
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

/** File-on-disk master status — visual approval CLOSED for all eight. */
export type MasterStatus = "APPROVED_MASTER" | "AWAITING_MASTER_FILE" | "AWAITING_MASTER";

/** Owner decision layer. */
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

/** Handoff package root (docs provenance). */
export const HANDOFF_T1175U_ROOT = "docs/character-production-t1173u/handoff-t1175u" as const;

/** ZIP sha256 verified on Woz box before fold-in. */
export const HANDOFF_ZIP_SHA256 =
  "235809785812df057f29dae1b18be8903b762877fb50fca870f38ea3597b0446" as const;

/**
 * Provenance paths for owner-approved visual masters (docs only).
 * Relative to repo root. Not served as modular runtime plates.
 */
export const APPROVED_VISUAL_MASTER_PATHS: Readonly<Record<RosterV24LookKey, string>> = {
  "adult-look-1":
    "docs/character-production-t1173u/masters/look1-m-samir-APPROVED.png",
  "adult-look-2":
    "docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png",
  "adult-look-3":
    "docs/character-production-t1173u/masters/look3-f-priya-APPROVED.png",
  "adult-look-4":
    "docs/character-production-t1173u/masters/look4-m-devon-APPROVED.png",
  "adult-look-5":
    "docs/character-production-t1173u/masters/look5-f-nova-APPROVED.png",
  "adult-look-6":
    "docs/character-production-t1173u/masters/look6-m-leo-APPROVED.png",
  "grom-boy":
    "docs/character-production-t1173u/masters/grom-boy-g-milo-APPROVED.png",
  "grom-girl":
    "docs/character-production-t1173u/masters/grom-girl-g-aria-APPROVED.png",
};

/** Roster composite for identity cross-check (docs only). */
export const ROSTER_COMPOSITE_MASTER_PATH =
  "docs/character-production-t1173u/masters/00-roster-v24-APPROVED-composite.png" as const;

/**
 * SHA-256 from handoff ASSET_MAP.json / SHA256SUMS.txt (canonical provenance).
 * Keys = starterId.
 */
export const APPROVED_MASTER_SHA256: Readonly<Record<string, string>> = {
  "m-samir": "d51aa5263c8621c57b929f85dc753b7c97710f7d92533edc1ae8975cef87c992",
  "f-hana": "b92ba262a516b29c3512a5e63371b30797dcaf5d6b93f47163588c04659a80da",
  "f-priya": "2970a7254774e9919253a4bffc399788daa1a54f9ad69aa5a794e3d9001184cf",
  "m-devon": "5dc68660db8db27e9a0d7989d601da5598a5e3d0292bc80f1f9f9754e3c70270",
  "f-nova": "4d9a2942f8f603f6277ae69aa1ed8be501745d8138c3b9cdd65fb8b08540eeeb",
  "m-leo": "5e57e8601717a4134153eb2973d8a2fc156a88b0aef8c1da4db3f67dc185cb4b",
  "g-milo": "c842a1cafd0425f0312704353c1ed9e5abab8d2da87bb1687776f8219279339a",
  "g-aria": "e858de9374a9c7a47d36ee9a7be22f6a7b4cb42695c4b47a89e5843a36cf4d89",
};

/** All eight looks — visual approval CLOSED (t1175u). */
export const APPROVED_MASTER_LOOK_KEYS: readonly RosterV24LookKey[] = [
  "adult-look-1",
  "adult-look-2",
  "adult-look-3",
  "adult-look-4",
  "adult-look-5",
  "adult-look-6",
  "grom-boy",
  "grom-girl",
] as const;

/** @deprecated empty — Look 6 PNG delivered in t1175u */
export const OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS: readonly RosterV24LookKey[] = [] as const;

/** @deprecated empty — Looks 4–5 masters delivered in t1175u */
export const OWNER_APPROVED_PENDING_FILE_LOOK_KEYS: readonly RosterV24LookKey[] = [] as const;

/** @deprecated empty — Grom visual masters delivered; enrollment still held */
export const AWAITING_MASTER_LOOK_KEYS: readonly RosterV24LookKey[] = [] as const;

/** Expected Look 6 path (now committed). */
export const LOOK6_MASTER_PENDING_PATH =
  "docs/character-production-t1173u/masters/look6-m-leo-APPROVED.png" as const;

/**
 * First GB acceptance target: Adult Look 2 (f-hana) mint jacket+pants layered
 * in real selector + Locker on Android — not a poster crop.
 */
export const GB_FIRST_ACCEPTANCE = {
  lookKey: "adult-look-2" as RosterV24LookKey,
  starterId: "f-hana",
  requirement:
    "Real mint jacket + matching pants modular plates composited in selector + Locker on physical Android",
} as const;

/** Look 4: black NON-reflective goggles (not Meta glasses). */
export const LOOK4_EYEWEAR_CONTRACT = {
  starterId: "m-devon",
  lookKey: "adult-look-4" as RosterV24LookKey,
  allowedItemIds: [EYEWEAR_ITEM_IDS.goggles] as const,
  note: "black NON-reflective goggles on helmet",
} as const;

/** Look 5: red-orange wraparound glasses + plain black beanie NO bun. */
export const LOOK5_EYEWEAR_CONTRACT = {
  starterId: "f-nova",
  lookKey: "adult-look-5" as RosterV24LookKey,
  allowedItemIds: [EYEWEAR_ITEM_IDS.glassesMetaOakley] as const,
  note: "red-orange wraparound glasses over eyes; plain black beanie — NO bun",
} as const;

/**
 * Look 6 eyewear lock: black snow goggles on head ONLY.
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
  /** Docs-only provenance path when APPROVED_MASTER. */
  visualMasterPath: string | null;
  /** Documented path (same as visual when APPROVED_MASTER). */
  pendingMasterPath: string | null;
  /** Provenance sha256 from ASSET_MAP.json */
  masterSha256: string | null;
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

export function slotReadinessForEntry(entry: RosterV24Entry): CharacterSlotReadiness {
  const path = APPROVED_VISUAL_MASTER_PATHS[entry.lookKey];
  const sha = APPROVED_MASTER_SHA256[entry.starterId] ?? null;
  return {
    lookKey: entry.lookKey,
    starterId: entry.starterId,
    ageBand: entry.ageBand,
    lookIndex1Based: entry.lookIndex1Based,
    lookTotal: entry.lookTotal,
    masterStatus: "APPROVED_MASTER",
    ownerApproval: "OWNER_LOCKED",
    statusLabel: "APPROVED_MASTER",
    visualMasterPath: path,
    pendingMasterPath: null,
    masterSha256: sha,
    starterPreviewUrl: buildStarterPreviewUrl(entry.ageBand, entry.starterId),
    svgFallbackUntilPlates: true,
    surfaces: CONSISTENCY_SURFACES,
    mastersAreNotModularPlates: true,
    previewOnly: entry.previewOnly,
  };
}

/** All eight roster slots — visual masters APPROVED; modular plates still OPEN. */
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
 * Canonical runtime plate path GB must deliver (do not invent by cropping masters).
 * Example: /stomper/adult/jacket/jacket-basic@512.webp
 */
export function expectedRuntimePlatePath(
  ageBand: AgeBand,
  slot: AvatarSlot,
  itemId: string,
  size: ArtworkSize = 512,
): string {
  return buildPlateUrl(ageBand, slot, itemId, size);
}

export function plateUrlForSlotItem(
  ageBand: AgeBand,
  slot: AvatarSlot,
  itemId: string,
  size: ArtworkSize = 512,
): string {
  return buildPlateUrl(ageBand, slot, itemId, size);
}

export function defaultPlateOrSvgFallback(opts: {
  ageBand: AgeBand;
  slot: AvatarSlot;
  itemId: string;
}): ReturnType<typeof resolveLayerPlate> {
  return resolveLayerPlate({ ...opts, plateExists: () => false });
}

export function consistencyLayerOrder(): readonly AvatarSlot[] {
  return ARTWORK_LAYER_ORDER;
}

export const FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES = true as const;

/** Distinguishes approval stages for reports / GB. */
export const APPROVAL_STAGE = {
  visualApproval: "CLOSED" as const,
  modularPlateDelivery: "OPEN" as const,
  androidFunctionalityQa: "AWAITING_GB_PLATES" as const,
  firstAcceptanceLook: GB_FIRST_ACCEPTANCE.starterId,
} as const;

export function assertSlotReadinessIntegrity(): {
  ok: true;
  approvedMasterCount: number;
  awaitingMasterFileCount: number;
  awaitingMasterCount: number;
  slotCount: number;
  look6Status: string;
  visualApproval: "CLOSED";
  modularPlates: "OPEN";
} {
  const slots = allCharacterSlotReadiness();
  if (slots.length !== 8) throw new Error("Expected 8 character slots");
  const approved = slots.filter((s) => s.masterStatus === "APPROVED_MASTER");
  const awaitingFile = slots.filter((s) => s.masterStatus === "AWAITING_MASTER_FILE");
  const awaiting = slots.filter((s) => s.masterStatus === "AWAITING_MASTER");
  if (approved.length !== 8) throw new Error("Expected all 8 slots APPROVED_MASTER (t1175u)");
  if (awaitingFile.length !== 0) throw new Error("AWAITING_MASTER_FILE must be cleared after t1175u");
  if (awaiting.length !== 0) throw new Error("No AWAITING_MASTER slots after t1175u visual lock");
  for (const s of approved) {
    if (!s.visualMasterPath) throw new Error(`APPROVED_MASTER ${s.lookKey} missing visualMasterPath`);
    if (!s.visualMasterPath.includes("docs/character-production-t1173u/masters/")) {
      throw new Error(`Master path must stay under docs provenance folder: ${s.starterId}`);
    }
    if (!s.masterSha256 || s.masterSha256.length !== 64) {
      throw new Error(`Missing/invalid provenance sha256 for ${s.starterId}`);
    }
    if (APPROVED_MASTER_SHA256[s.starterId] !== s.masterSha256) {
      throw new Error(`SHA mismatch for ${s.starterId}`);
    }
    if (s.mastersAreNotModularPlates !== true) {
      throw new Error("Masters must not be treated as modular plates");
    }
    if (s.svgFallbackUntilPlates !== true) {
      throw new Error(`Slot ${s.starterId} must keep SVG fallback until plates arrive`);
    }
  }
  const look6 = slots.find((s) => s.starterId === "m-leo");
  if (!look6 || look6.statusLabel !== "APPROVED_MASTER") {
    throw new Error("Look 6 must be APPROVED_MASTER after t1175u");
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
  if (!FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES) {
    throw new Error("Poster-crop forbid flag must remain true");
  }
  const grom = slots.filter((s) => s.ageBand === "grom");
  if (grom.length !== 2 || !grom.every((s) => s.previewOnly)) {
    throw new Error("Grom slots must remain previewOnly");
  }
  return {
    ok: true,
    approvedMasterCount: approved.length,
    awaitingMasterFileCount: 0,
    awaitingMasterCount: 0,
    slotCount: slots.length,
    look6Status: look6.statusLabel,
    visualApproval: "CLOSED",
    modularPlates: "OPEN",
  };
}
