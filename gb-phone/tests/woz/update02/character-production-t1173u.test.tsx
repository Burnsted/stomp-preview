// @vitest-environment jsdom
/**
 * t1173u → t1175u — Eight APPROVED_MASTER visual refs; modular plates still OPEN.
 * Provenance hashes from ASSET_MAP; grom preview-only; no poster-crop plates.
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
  buildPlateUrl,
  buildStarterPreviewUrl,
  resolveLayerPlate,
} from "@/lib/stomp/avatar/artwork";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
import {
  APPROVAL_STAGE,
  APPROVED_MASTER_LOOK_KEYS,
  APPROVED_MASTER_SHA256,
  APPROVED_VISUAL_MASTER_PATHS,
  AWAITING_MASTER_LOOK_KEYS,
  CONSISTENCY_SURFACES,
  FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES,
  GB_FIRST_ACCEPTANCE,
  HANDOFF_ZIP_SHA256,
  LOOK6_EYEWEAR_CONTRACT,
  OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS,
  allCharacterSlotReadiness,
  approvedMasterSlots,
  assertSlotReadinessIntegrity,
  awaitingMasterFileSlots,
  awaitingMasterSlots,
  consistencyLayerOrder,
  defaultPlateOrSvgFallback,
  expectedRuntimePlatePath,
  isForbiddenAgentStomperName,
  look6AllowsEyewearItemId,
  look6StatusLabel,
  plateUrlForSlotItem,
  slotReadinessByStarterId,
} from "@/lib/stomp/avatar/slot-readiness";
import {
  ROSTER_V24,
  ROSTER_V24_ADULT_STARTER_IDS,
  ROSTER_V24_GROM_STARTER_IDS,
  assertRosterV24Integrity,
  rosterLookOrdinalLabel,
} from "@/lib/stomp/avatar/roster-v24";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAvatar.getState().resetAll();
  });
});

describe("t1175u — eight APPROVED_MASTER slots", () => {
  it("flips all eight slots to APPROVED_MASTER with provenance hashes", () => {
    const integrity = assertSlotReadinessIntegrity();
    expect(integrity.ok).toBe(true);
    expect(integrity.slotCount).toBe(8);
    expect(integrity.approvedMasterCount).toBe(8);
    expect(integrity.awaitingMasterFileCount).toBe(0);
    expect(integrity.awaitingMasterCount).toBe(0);
    expect(integrity.visualApproval).toBe("CLOSED");
    expect(integrity.modularPlates).toBe("OPEN");
    expect(integrity.look6Status).toBe("APPROVED_MASTER");
    expect(APPROVED_MASTER_LOOK_KEYS).toHaveLength(8);
    expect(approvedMasterSlots()).toHaveLength(8);
    expect(awaitingMasterFileSlots()).toHaveLength(0);
    expect(awaitingMasterSlots()).toHaveLength(0);
    expect(OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS).toHaveLength(0);
    expect(AWAITING_MASTER_LOOK_KEYS).toHaveLength(0);
    expect(assertRosterV24Integrity().ok).toBe(true);
  });

  it("binds each starterId to docs master path + ASSET_MAP sha256", () => {
    const expectedIds = [
      "m-samir",
      "f-hana",
      "f-priya",
      "m-devon",
      "f-nova",
      "m-leo",
      "g-milo",
      "g-aria",
    ];
    expect(approvedMasterSlots().map((s) => s.starterId)).toEqual(expectedIds);
    for (const id of expectedIds) {
      const s = slotReadinessByStarterId(id)!;
      expect(s.masterStatus).toBe("APPROVED_MASTER");
      expect(s.statusLabel).toBe("APPROVED_MASTER");
      expect(s.visualMasterPath).toBe(APPROVED_VISUAL_MASTER_PATHS[s.lookKey]);
      expect(s.visualMasterPath).toMatch(/^docs\/character-production-t1173u\/masters\//);
      expect(s.masterSha256).toBe(APPROVED_MASTER_SHA256[id]);
      expect(s.masterSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(s.mastersAreNotModularPlates).toBe(true);
      expect(s.svgFallbackUntilPlates).toBe(true);
    }
    // Looks 1–3 prior hashes unchanged (ASSET_MAP)
    expect(APPROVED_MASTER_SHA256["m-samir"]).toBe(
      "d51aa5263c8621c57b929f85dc753b7c97710f7d92533edc1ae8975cef87c992",
    );
    expect(APPROVED_MASTER_SHA256["f-hana"]).toBe(
      "b92ba262a516b29c3512a5e63371b30797dcaf5d6b93f47163588c04659a80da",
    );
    expect(APPROVED_MASTER_SHA256["f-priya"]).toBe(
      "2970a7254774e9919253a4bffc399788daa1a54f9ad69aa5a794e3d9001184cf",
    );
    expect(HANDOFF_ZIP_SHA256).toBe(
      "235809785812df057f29dae1b18be8903b762877fb50fca870f38ea3597b0446",
    );
  });

  it("clears Look 6 AWAITING_MASTER_FILE; Look 6 remains goggles-only", () => {
    expect(look6StatusLabel()).toBe("APPROVED_MASTER");
    expect(look6AllowsEyewearItemId(EYEWEAR_ITEM_IDS.goggles)).toBe(true);
    expect(look6AllowsEyewearItemId(EYEWEAR_ITEM_IDS.glassesMetaOakley)).toBe(false);
    expect(LOOK6_EYEWEAR_CONTRACT.forbiddenItemIds).toContain("glasses-meta-oakley");
  });

  it("keeps plate URL contracts ready without inventing plates", () => {
    expect(expectedRuntimePlatePath("adult", "jacket", "jacket-basic")).toBe(
      "/stomper/adult/jacket/jacket-basic@512.webp",
    );
    expect(buildStarterPreviewUrl("adult", "f-hana")).toBe(
      "/stomper/adult/starter/f-hana/preview@512.webp",
    );
    for (const id of [...ROSTER_V24_ADULT_STARTER_IDS, ...ROSTER_V24_GROM_STARTER_IDS]) {
      const slot = slotReadinessByStarterId(id)!;
      expect(plateUrlForSlotItem(slot.ageBand, "pants", "pants-basic")).toBe(
        buildPlateUrl(slot.ageBand, "pants", "pants-basic"),
      );
      expect(
        defaultPlateOrSvgFallback({
          ageBand: slot.ageBand,
          slot: "jacket",
          itemId: "jacket-basic",
        }).mode,
      ).toBe("svg-fallback");
    }
  });

  it("names Look 2 as first GB Android acceptance target", () => {
    expect(GB_FIRST_ACCEPTANCE.starterId).toBe("f-hana");
    expect(APPROVAL_STAGE.visualApproval).toBe("CLOSED");
    expect(APPROVAL_STAGE.modularPlateDelivery).toBe("OPEN");
    expect(APPROVAL_STAGE.androidFunctionalityQa).toBe("AWAITING_GB_PLATES");
    expect(APPROVAL_STAGE.firstAcceptanceLook).toBe("f-hana");
  });
});

describe("t1175u — identity / Woz ban / consistency", () => {
  it("forbids Woz as STOMPER displayName; preserves Look N of M", () => {
    expect(isForbiddenAgentStomperName("Woz")).toBe(true);
    const look6 = ROSTER_V24.find((e) => e.starterId === "m-leo")!;
    expect(rosterLookOrdinalLabel(look6)).toBe(lookOrdinalLabel(6, 6));
    expect(rosterLookOrdinalLabel(look6)).not.toBe(starterById("m-leo")!.label);
  });

  it("shares silhouette + backpack-off across surfaces; SVG until plates", () => {
    expect(CONSISTENCY_SURFACES).toEqual(["selector", "build-your-look", "locker"]);
    expect(consistencyLayerOrder()).toEqual(ARTWORK_LAYER_ORDER);
    for (const entry of ROSTER_V24) {
      const cfg = configFromStarter(starterById(entry.starterId)!, {
        stomperId: "x",
        displayName: "ConsistencyCheck",
      });
      expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
      render(<AvatarRenderer config={cfg} testId={`consist-${entry.starterId}`} />);
      expect(screen.getByTestId(`consist-${entry.starterId}`).getAttribute("data-render-mode")).toBe(
        "svg-fallback",
      );
      cleanup();
    }
  });

  it("preserves user name across look changes", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-hana");
      useAvatar.getState().setDisplayName("MintRider");
      useAvatar.getState().selectStarter("m-devon");
    });
    expect(useAvatar.getState().draft.displayName).toBe("MintRider");
    expect(isValidStomperDisplayName("MintRider")).toBe(true);
  });
});

describe("t1175u — grom preview-only; masters ≠ plates", () => {
  it("keeps gromFlowEnabled false with APPROVED_MASTER grom previews", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(useAvatar.getState().availableStarters("grom")).toEqual([]);
    for (const id of ROSTER_V24_GROM_STARTER_IDS) {
      const s = slotReadinessByStarterId(id)!;
      expect(s.masterStatus).toBe("APPROVED_MASTER");
      expect(s.previewOnly).toBe(true);
    }
  });

  it("forbids poster-crop; SVG fallback until modular plates exist", () => {
    expect(FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES).toBe(true);
    const miss = resolveLayerPlate({
      ageBand: "adult",
      slot: "jacket",
      itemId: "jacket-basic",
      plateExists: () => false,
    });
    expect(miss.mode).toBe("svg-fallback");
    if (miss.mode === "svg-fallback") expect(miss.reason).toBe("missing-plate");
  });
});
