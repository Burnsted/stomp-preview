/**
 * Franz appearance-preview packages (t1225u) — Woman 1, Man 3, Grom 1, Grom 2.
 *
 * SOURCE_APPEARANCE_PREVIEW_ONLY: one flattened runtime WebP, NOT modular masters.
 * No jacket-off, no independent equipment, no invented clothing swaps.
 * Grom 1 / Grom 2 remain fictional appearance previews — no youth social activation.
 */
import { buildStarterPreviewUrl } from "@/lib/stomp/avatar/artwork";
import { publicLabelForStarter } from "@/lib/stomp/avatar/identity";
import type { AgeBand } from "@/lib/stomp/avatar/types";

export type AppearancePreviewSlotLabel =
  | "Stomper Woman One"
  | "Stomper Man Three"
  | "Stomper Grom One"
  | "Stomper Grom Two";

export type AppearancePreviewRiderDef = {
  starterId: string;
  lookKey: string;
  slotLabel: AppearancePreviewSlotLabel;
  ageBand: AgeBand;
  status: "SOURCE_APPEARANCE_PREVIEW_ONLY";
  modular: false;
  jacketOffSupported: false;
  independentEquipmentSupported: false;
  /** Grom looks stay preview-only; never enables youth social. */
  previewOnly: boolean;
  ownerVisualPass: false;
  androidAccepted: false;
  sourceZipSha256: string;
  previewUrl: string;
};

export const APPEARANCE_PREVIEW_ZIP_SHA256 = {
  "f-nova": "8c24cafa76b5491f648d4d423ad5df9837c1d61a95642e6580c2332f80a78b52",
  "m-leo": "2ba7e982c9fad9dd6926cf57ce34b5d6206fb65dec1278bbe58f66ec7ae576c3",
  "g-milo": "563d711bb648e703c40591545a743e9ab53464502889ef58ca42942ec1ea1e5a",
  "g-aria": "f65affe08999558ed07e885df860a8a52d081e1927cb9be0f4dc4f734161943a",
} as const;

export const APPEARANCE_PREVIEW_RIDERS: readonly AppearancePreviewRiderDef[] = [
  {
    starterId: "f-nova",
    lookKey: "adult-look-5",
    slotLabel: publicLabelForStarter("f-nova") as AppearancePreviewSlotLabel,
    ageBand: "adult",
    status: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    modular: false,
    jacketOffSupported: false,
    independentEquipmentSupported: false,
    previewOnly: false,
    ownerVisualPass: false,
    androidAccepted: false,
    sourceZipSha256: APPEARANCE_PREVIEW_ZIP_SHA256["f-nova"],
    previewUrl: buildStarterPreviewUrl("adult", "f-nova", 512),
  },
  {
    starterId: "m-leo",
    lookKey: "adult-look-6",
    slotLabel: publicLabelForStarter("m-leo") as AppearancePreviewSlotLabel,
    ageBand: "adult",
    status: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    modular: false,
    jacketOffSupported: false,
    independentEquipmentSupported: false,
    previewOnly: false,
    ownerVisualPass: false,
    androidAccepted: false,
    sourceZipSha256: APPEARANCE_PREVIEW_ZIP_SHA256["m-leo"],
    previewUrl: buildStarterPreviewUrl("adult", "m-leo", 512),
  },
  {
    starterId: "g-milo",
    lookKey: "grom-boy",
    slotLabel: publicLabelForStarter("g-milo") as AppearancePreviewSlotLabel,
    ageBand: "grom",
    status: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    modular: false,
    jacketOffSupported: false,
    independentEquipmentSupported: false,
    previewOnly: true,
    ownerVisualPass: false,
    androidAccepted: false,
    sourceZipSha256: APPEARANCE_PREVIEW_ZIP_SHA256["g-milo"],
    previewUrl: buildStarterPreviewUrl("grom", "g-milo", 512),
  },
  {
    starterId: "g-aria",
    lookKey: "grom-girl",
    slotLabel: publicLabelForStarter("g-aria") as AppearancePreviewSlotLabel,
    ageBand: "grom",
    status: "SOURCE_APPEARANCE_PREVIEW_ONLY",
    modular: false,
    jacketOffSupported: false,
    independentEquipmentSupported: false,
    previewOnly: true,
    ownerVisualPass: false,
    androidAccepted: false,
    sourceZipSha256: APPEARANCE_PREVIEW_ZIP_SHA256["g-aria"],
    previewUrl: buildStarterPreviewUrl("grom", "g-aria", 512),
  },
] as const;

export function appearancePreviewByStarterId(
  starterId: string,
): AppearancePreviewRiderDef | undefined {
  return APPEARANCE_PREVIEW_RIDERS.find((r) => r.starterId === starterId);
}

export function isAppearancePreviewStarter(starterId: string): boolean {
  return appearancePreviewByStarterId(starterId) !== undefined;
}

/** Appearance-preview groms may be selected as fictional looks without enabling youth flow. */
export function isAppearancePreviewGrom(starterId: string): boolean {
  const r = appearancePreviewByStarterId(starterId);
  return r?.ageBand === "grom" && r.previewOnly === true;
}

export function appearancePreviewUrl(starterId: string): string | null {
  return appearancePreviewByStarterId(starterId)?.previewUrl ?? null;
}
