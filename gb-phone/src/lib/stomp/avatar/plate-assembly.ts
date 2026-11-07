/**
 * Plate assembly policy (t1178u) — all-or-nothing compositing.
 *
 * NEVER show a partially assembled rider because only some layers loaded.
 * Docs visual masters are NEVER runtime plates.
 */
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  PLATE_SKIP_ITEM_IDS,
  buildPlateUrl,
  type ArtworkSize,
} from "@/lib/stomp/avatar/artwork";
import type { AgeBand, AvatarConfig, AvatarLayers, AvatarSlot } from "@/lib/stomp/avatar/types";

export type PlateProbeStatus = "pending" | "present" | "missing";

export type RequiredPlateRef = {
  slot: AvatarSlot;
  itemId: string;
  url: string;
};

export type PlateAssemblyEvaluation = {
  /** True only when every required plate is confirmed present. */
  complete: boolean;
  /** True while any required plate probe has not finished. */
  pending: boolean;
  /** Render mode for AvatarRenderer shell. */
  renderMode: "plates" | "svg-fallback";
  /** Human/machine reason when not in plates mode. */
  reason: "complete" | "pending-probes" | "incomplete-set" | "no-plates" | "forbidden-path";
  required: RequiredPlateRef[];
  presentUrls: string[];
  missingUrls: string[];
  pendingUrls: string[];
  /** False-success guard — incomplete must never claim plates success. */
  acceptanceEligible: boolean;
};

/** Paths that must never be used as runtime layer plates. */
const FORBIDDEN_RUNTIME_PATH_MARKERS = [
  "/docs/",
  "character-production-t1173u/masters/",
  "handoff-t1175u/",
  "APPROVED_REFERENCES/",
] as const;

export function isForbiddenRuntimePlatePath(url: string): boolean {
  const u = url.toLowerCase();
  if (!u.includes("/stomper/")) {
    // Runtime plates must live under /stomper/… (public).
    if (u.startsWith("docs/") || u.includes("/docs/")) return true;
    return FORBIDDEN_RUNTIME_PATH_MARKERS.some((m) => u.includes(m.toLowerCase()));
  }
  return FORBIDDEN_RUNTIME_PATH_MARKERS.some((m) => u.includes(m.toLowerCase()));
}

export function isRuntimeStomperPlatePath(url: string): boolean {
  return (
    url.startsWith("/stomper/") &&
    url.endsWith(".webp") &&
    !isForbiddenRuntimePlatePath(url)
  );
}

/**
 * Slots that must all have loadable plates for plate-mode compositing.
 * Backpack OFF is omitted (intentional no-draw).
 */
export function requiredPlateRefs(
  config: Pick<AvatarConfig, "ageBand" | "layers">,
  size: ArtworkSize = 512,
): RequiredPlateRef[] {
  const layers: AvatarLayers = {
    ...config.layers,
    backpack: config.layers.backpack ?? { itemId: BACKPACK_OFF_ITEM_ID },
  };
  const out: RequiredPlateRef[] = [];
  for (const slot of ARTWORK_LAYER_ORDER) {
    const ref = layers[slot];
    if (!ref?.itemId) continue;
    // Intentional no-draw sentinels (backpack/jacket/board off; locked-head includes).
    if (PLATE_SKIP_ITEM_IDS.has(ref.itemId)) continue;
    const url = buildPlateUrl(config.ageBand as AgeBand, slot, ref.itemId, size);
    out.push({ slot, itemId: ref.itemId, url });
  }
  return out;
}

/**
 * Evaluate whether the required plate set is complete.
 * `probe` maps url → pending | present | missing.
 */
export function evaluatePlateAssembly(
  config: Pick<AvatarConfig, "ageBand" | "layers">,
  probe: (url: string) => PlateProbeStatus,
  size: ArtworkSize = 512,
): PlateAssemblyEvaluation {
  const required = requiredPlateRefs(config, size);

  if (required.some((r) => isForbiddenRuntimePlatePath(r.url))) {
    return {
      complete: false,
      pending: false,
      renderMode: "svg-fallback",
      reason: "forbidden-path",
      required,
      presentUrls: [],
      missingUrls: required.map((r) => r.url),
      pendingUrls: [],
      acceptanceEligible: false,
    };
  }

  const presentUrls: string[] = [];
  const missingUrls: string[] = [];
  const pendingUrls: string[] = [];

  for (const r of required) {
    const status = probe(r.url);
    if (status === "present") presentUrls.push(r.url);
    else if (status === "missing") missingUrls.push(r.url);
    else pendingUrls.push(r.url);
  }

  if (pendingUrls.length > 0) {
    return {
      complete: false,
      pending: true,
      renderMode: "svg-fallback",
      reason: "pending-probes",
      required,
      presentUrls,
      missingUrls,
      pendingUrls,
      acceptanceEligible: false,
    };
  }

  if (required.length === 0) {
    return {
      complete: false,
      pending: false,
      renderMode: "svg-fallback",
      reason: "no-plates",
      required,
      presentUrls,
      missingUrls,
      pendingUrls,
      acceptanceEligible: false,
    };
  }

  if (missingUrls.length === 0 && presentUrls.length === required.length) {
    return {
      complete: true,
      pending: false,
      renderMode: "plates",
      reason: "complete",
      required,
      presentUrls,
      missingUrls,
      pendingUrls,
      acceptanceEligible: true,
    };
  }

  // Partial set — NEVER render as plates (false success / half-dressed rider).
  return {
    complete: false,
    pending: false,
    renderMode: "svg-fallback",
    reason: presentUrls.length === 0 ? "no-plates" : "incomplete-set",
    required,
    presentUrls,
    missingUrls,
    pendingUrls,
    acceptanceEligible: false,
  };
}

/** Jacket + pants must remain distinct itemIds (never one merged bitmap). */
export function jacketPantsAreSeparateLayers(layers: AvatarLayers): boolean {
  const j = layers.jacket?.itemId;
  const p = layers.pants?.itemId;
  return Boolean(j && p && j !== p);
}
