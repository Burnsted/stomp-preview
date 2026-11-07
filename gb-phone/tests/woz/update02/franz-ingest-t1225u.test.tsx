/**
 * t1225u — Franz 8-package ingest + 18-slot honest roster.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPEARANCE_PREVIEW_RIDERS,
  isAppearancePreviewStarter,
} from "@/lib/stomp/avatar/appearance-preview-riders";
import { LOOK2_GATE_STATUS } from "@/lib/stomp/avatar/look2-acceptance";
import { modularRiderByStarterId } from "@/lib/stomp/avatar/modular-riders";
import { eightLookPlateMatrix } from "@/lib/stomp/avatar/plate-registry";
import {
  CREATE_DISPLAY_SCALE_TARGET,
  isOpenPrototypeStarter,
} from "@/lib/stomp/avatar/create-ship-gate";
import {
  assertEighteenSlotRoster,
  createScreenRosterSlots,
  missingArtworkSlots,
  rosterArtworkSlot,
} from "@/lib/stomp/avatar/roster-artwork-status";
import { ADULT_STARTERS, GROM_STARTERS } from "@/lib/stomp/avatar/starters";

const ROOT = resolve(__dirname, "../../../..");
const PUBLIC = resolve(ROOT, "gb-phone/public");

const ZIP_SHA = {
  woman1: "8c24cafa76b5491f648d4d423ad5df9837c1d61a95642e6580c2332f80a78b52",
  woman2: "c006bcc25b8370defab935a8702b10b5579991d1ba99c1bbf8d509dd6081d5dd",
  woman3: "b8d9fee95a9d12234bf178d43914cb86fcf6ef9716b51f4c21caf118d8330a6d",
  man1: "5105bcea04ab2b27eb0708e3aaa207b5d17ba1b8c72e1300416db654b93d534e",
  man2: "7f11f205db0b673f5918fbae7cd7d8161471d19b75b10fa74c0269dc7f6aaf04",
  man3: "2ba7e982c9fad9dd6926cf57ce34b5d6206fb65dec1278bbe58f66ec7ae576c3",
  grom1: "563d711bb648e703c40591545a743e9ab53464502889ef58ca42942ec1ea1e5a",
  grom2: "f65affe08999558ed07e885df860a8a52d081e1927cb9be0f4dc4f734161943a",
} as const;

describe("t1225u Franz ingest + 18-slot roster", () => {
  it("keeps exactly 12 adult + 6 grom catalog IDs", () => {
    expect(ADULT_STARTERS).toHaveLength(12);
    expect(GROM_STARTERS).toHaveLength(6);
    expect(assertEighteenSlotRoster()).toEqual({
      ok: true,
      total: 18,
      ingested: 8,
      missing: 10,
      createVisible: 6,
      openOmitted: 2,
    });
  });

  it("pins Franz delivery zip sha256 on modular + appearance riders", () => {
    expect(modularRiderByStarterId("m-samir")!.sourceZipSha256).toBe(ZIP_SHA.man1);
    expect(modularRiderByStarterId("f-hana")!.sourceZipSha256).toBe(ZIP_SHA.woman2);
    expect(modularRiderByStarterId("f-priya")!.sourceZipSha256).toBe(ZIP_SHA.woman3);
    expect(modularRiderByStarterId("m-devon")!.sourceZipSha256).toBe(ZIP_SHA.man2);
    expect(LOOK2_GATE_STATUS.sourceZipSha256).toBe(ZIP_SHA.woman2);
    expect(APPEARANCE_PREVIEW_RIDERS.map((r) => r.sourceZipSha256).sort()).toEqual(
      [ZIP_SHA.woman1, ZIP_SHA.man3, ZIP_SHA.grom1, ZIP_SHA.grom2].sort(),
    );
  });

  it("Man 2 remains NOT owner visual PASS; white alt is not Man 3", () => {
    const man2 = modularRiderByStarterId("m-devon")!;
    expect(man2.ownerVisualReview).toBe("NOT_OWNER_REVIEWED");
    expect(man2.altJacketItemId).toBe("jacket-look4-white");
    expect(man2.acceptanceEligible).toBe(false);
    expect(rosterArtworkSlot("m-leo")!.slotLabel).toBe("Stomper Man Three");
    expect(isAppearancePreviewStarter("m-leo")).toBe(true);
  });

  it("ships runtime WebPs for all eight ingested looks", () => {
    const paths = [
      "stomper/adult/jacket/jacket-look1-tan@512.webp",
      "stomper/adult/jacket/jacket-look2-mint@512.webp",
      "stomper/adult/jacket/jacket-look3-purple@512.webp",
      "stomper/adult/jacket/jacket-look4-orange@512.webp",
      "stomper/adult/starter/m-samir/preview@512.webp",
      "stomper/adult/starter/f-hana/preview@512.webp",
      "stomper/adult/starter/f-priya/preview@512.webp",
      "stomper/adult/starter/m-devon/preview@512.webp",
      "stomper/adult/starter/f-nova/preview@512.webp",
      "stomper/adult/starter/m-leo/preview@512.webp",
      "stomper/grom/starter/g-milo/preview@512.webp",
      "stomper/grom/starter/g-aria/preview@512.webp",
    ];
    for (const rel of paths) {
      expect(existsSync(resolve(PUBLIC, rel)), rel).toBe(true);
    }
  });

  it("marks ten missing slots source-missing / not selectable", () => {
    const missing = missingArtworkSlots();
    expect(missing).toHaveLength(10);
    expect(missing.every((s) => !s.selectable)).toBe(true);
    expect(missing.every((s) => s.availability === "source-missing")).toBe(true);
    expect(missing.map((s) => s.starterId).sort()).toEqual(
      [
        "f-mira",
        "f-jade",
        "f-elena",
        "m-kai",
        "m-owen",
        "m-jonas",
        "g-zoe",
        "g-nina",
        "g-reed",
        "g-theo",
      ].sort(),
    );
  });

  it("eight-look matrix uses appearance-preview / prototype statuses honestly", () => {
    const matrix = eightLookPlateMatrix();
    expect(matrix.find((s) => s.starterId === "f-nova")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "m-leo")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "g-milo")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "g-aria")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "m-samir")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === "m-devon")!.ownerVisualReview).toBe(
      "NOT_OWNER_REVIEWED",
    );
  });

  it("records ingest receipt with all eight zip pins", () => {
    const receiptPath = resolve(ROOT, "docs/franz-ingest-t1225u/ingested-runtime-sha256.json");
    expect(existsSync(receiptPath)).toBe(true);
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as {
      zipSha256Verified: Record<string, string>;
      appearancePreviews: unknown[];
    };
    expect(receipt.zipSha256Verified["Woman 1"]).toBe(ZIP_SHA.woman1);
    expect(receipt.zipSha256Verified["Man 1 / Rider 1"]).toBe(ZIP_SHA.man1);
    expect(receipt.appearancePreviews).toHaveLength(4);
  });

  it("uses Woman/Man/Grom N labels — never Woz", () => {
    expect(rosterArtworkSlot("f-nova")!.slotLabel).toBe("Stomper Woman One");
    expect(rosterArtworkSlot("m-samir")!.slotLabel).toBe("Stomper Man One");
    expect(rosterArtworkSlot("g-milo")!.slotLabel).toBe("Stomper Grom One");
    expect(rosterArtworkSlot("g-aria")!.slotLabel).toBe("Stomper Grom Two");
    expect(
      [...ADULT_STARTERS, ...GROM_STARTERS].some((s) => /woz/i.test(s.label)),
    ).toBe(false);
  });

  it("Create first-ship lock: omit OPEN + SOURCE MISSING; no Create-cleared", () => {
    const create = createScreenRosterSlots();
    expect(create.map((s) => s.starterId).sort()).toEqual(
      ["f-nova", "f-priya", "g-aria", "g-milo", "m-devon", "m-leo"].sort(),
    );
    expect(create.every((s) => s.createShipStatus === "partial-not-create-cleared")).toBe(
      true,
    );
    expect(isOpenPrototypeStarter("f-hana")).toBe(true);
    expect(isOpenPrototypeStarter("m-samir")).toBe(true);
    expect(rosterArtworkSlot("f-hana")!.createScreenVisible).toBe(false);
    expect(rosterArtworkSlot("m-samir")!.createScreenVisible).toBe(false);
    expect(rosterArtworkSlot("m-kai")!.createScreenVisible).toBe(false);
    expect(CREATE_DISPLAY_SCALE_TARGET.status).toBe(
      "DOCUMENTED_WAIT_TED_CREATE_ELIGIBLE",
    );
    expect(CREATE_DISPLAY_SCALE_TARGET.targetDrawnPx).toBe(565);
  });

  it("applies Franz QA v2 alpha fills (4 promoted; Man 1 glove quarantined)", () => {
    const receiptPath = resolve(ROOT, "docs/franz-ingest-t1225u/alpha-fill-v2-receipt.json");
    expect(existsSync(receiptPath)).toBe(true);
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as {
      promotedAlphaFillV2: { runtime: string; sha256: string }[];
      quarantinedNotIngested: { char: string }[];
    };
    expect(receipt.promotedAlphaFillV2).toHaveLength(4);
    expect(receipt.quarantinedNotIngested[0]?.char).toBe("Man-1-Rider-1");
    expect(LOOK2_GATE_STATUS.pantsMintSha256).toBe(
      "274c1368e1e21b5fe08bafc993b62473bdad5411c8601867625adaa58123bb72",
    );
    for (const row of receipt.promotedAlphaFillV2) {
      expect(existsSync(resolve(PUBLIC, row.runtime))).toBe(true);
    }
  });
});
