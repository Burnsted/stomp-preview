// @vitest-environment jsdom
/**
 * t1173u / t1174u — Character production readiness + Look 6 OWNER LOCK.
 * Slot status, approved masters, grom held, no substitute art / poster-crop plates.
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
  APPROVED_MASTER_LOOK_KEYS,
  APPROVED_VISUAL_MASTER_PATHS,
  AWAITING_MASTER_LOOK_KEYS,
  CONSISTENCY_SURFACES,
  FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES,
  LOOK6_EYEWEAR_CONTRACT,
  LOOK6_MASTER_PENDING_PATH,
  OWNER_APPROVED_PENDING_FILE_LOOK_KEYS,
  OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS,
  allCharacterSlotReadiness,
  approvedMasterSlots,
  assertSlotReadinessIntegrity,
  awaitingMasterFileSlots,
  awaitingMasterSlots,
  consistencyLayerOrder,
  defaultPlateOrSvgFallback,
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

describe("t1173u/t1174u — eight integration slots ready", () => {
  it("exposes exactly eight slots with plate URL + SVG fallback contracts", () => {
    const integrity = assertSlotReadinessIntegrity();
    expect(integrity.ok).toBe(true);
    expect(integrity.slotCount).toBe(8);
    expect(integrity.approvedMasterCount).toBe(3);
    expect(integrity.awaitingMasterFileCount).toBe(1);
    expect(integrity.awaitingMasterCount).toBe(4);
    expect(integrity.look6Status).toBe("OWNER_LOCKED + AWAITING_MASTER_FILE");
    expect(allCharacterSlotReadiness()).toHaveLength(8);
    expect(assertRosterV24Integrity().ok).toBe(true);
  });

  it("marks Looks 1–3 APPROVED_MASTER with docs provenance paths (not public plates)", () => {
    expect(APPROVED_MASTER_LOOK_KEYS).toEqual([
      "adult-look-1",
      "adult-look-2",
      "adult-look-3",
    ]);
    const approved = approvedMasterSlots();
    expect(approved).toHaveLength(3);
    expect(approved.map((s) => s.starterId)).toEqual(["m-samir", "f-hana", "f-priya"]);
    for (const s of approved) {
      expect(s.masterStatus).toBe("APPROVED_MASTER");
      expect(s.visualMasterPath).toBe(APPROVED_VISUAL_MASTER_PATHS[s.lookKey]);
      expect(s.visualMasterPath).toMatch(
        /^docs\/character-production-t1173u\/masters\/look\d-.+-APPROVED\.png$/,
      );
      expect(s.mastersAreNotModularPlates).toBe(true);
      expect(s.svgFallbackUntilPlates).toBe(true);
    }
  });

  it("marks Look 6 OWNER_LOCKED + AWAITING_MASTER_FILE without inventing PNG", () => {
    expect(OWNER_LOCKED_AWAITING_FILE_LOOK_KEYS).toEqual(["adult-look-6"]);
    expect(look6StatusLabel()).toBe("OWNER_LOCKED + AWAITING_MASTER_FILE");
    const look6 = slotReadinessByStarterId("m-leo")!;
    expect(look6.masterStatus).toBe("AWAITING_MASTER_FILE");
    expect(look6.ownerApproval).toBe("OWNER_LOCKED");
    expect(look6.statusLabel).toBe("OWNER_LOCKED + AWAITING_MASTER_FILE");
    expect(look6.visualMasterPath).toBeNull();
    expect(look6.pendingMasterPath).toBe(LOOK6_MASTER_PENDING_PATH);
    expect(look6.pendingMasterPath).toContain("look6-m-leo-APPROVED.png");
    expect(awaitingMasterFileSlots()).toHaveLength(1);
    // Must not claim APPROVED_MASTER without a committed file.
    expect(APPROVED_VISUAL_MASTER_PATHS["adult-look-6"]).toBeUndefined();
  });

  it("marks Looks 4–5 owner-approved pending file; Grom awaiting production", () => {
    expect(OWNER_APPROVED_PENDING_FILE_LOOK_KEYS).toEqual(["adult-look-4", "adult-look-5"]);
    expect(AWAITING_MASTER_LOOK_KEYS).toEqual(["grom-boy", "grom-girl"]);
    const awaiting = awaitingMasterSlots();
    expect(awaiting.map((s) => s.starterId)).toEqual(["m-devon", "f-nova", "g-milo", "g-aria"]);
    expect(slotReadinessByStarterId("m-devon")!.statusLabel).toBe(
      "OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER",
    );
    expect(slotReadinessByStarterId("f-nova")!.statusLabel).toBe(
      "OWNER_APPROVED_PENDING_FILE + AWAITING_MASTER",
    );
    expect(slotReadinessByStarterId("g-milo")!.ownerApproval).toBe("PENDING_PRODUCTION_APPROVAL");
    expect(slotReadinessByStarterId("g-aria")!.previewOnly).toBe(true);
  });

  it("builds plate URLs by itemId for every roster starter age band", () => {
    for (const id of [...ROSTER_V24_ADULT_STARTER_IDS, ...ROSTER_V24_GROM_STARTER_IDS]) {
      const slot = slotReadinessByStarterId(id)!;
      expect(plateUrlForSlotItem(slot.ageBand, "jacket", "jacket-basic")).toBe(
        buildPlateUrl(slot.ageBand, "jacket", "jacket-basic"),
      );
      const fb = defaultPlateOrSvgFallback({
        ageBand: slot.ageBand,
        slot: "jacket",
        itemId: "jacket-basic",
      });
      expect(fb.mode).toBe("svg-fallback");
    }
  });
});

describe("t1174u — Look 6 eyewear + Woz ban", () => {
  it("allows goggles-basic only; forbids Meta Oakley Vanguard on m-leo", () => {
    expect(LOOK6_EYEWEAR_CONTRACT.starterId).toBe("m-leo");
    expect(look6AllowsEyewearItemId(EYEWEAR_ITEM_IDS.goggles)).toBe(true);
    expect(look6AllowsEyewearItemId(EYEWEAR_ITEM_IDS.glassesMetaOakley)).toBe(false);
    expect(LOOK6_EYEWEAR_CONTRACT.forbiddenItemIds).toContain("glasses-meta-oakley");
  });

  it("forbids Woz as a STOMPER displayName (agent ≠ character)", () => {
    expect(isForbiddenAgentStomperName("Woz")).toBe(true);
    expect(isForbiddenAgentStomperName("woz")).toBe(true);
    expect(isForbiddenAgentStomperName("RidgeFox")).toBe(false);
    // Starters remain templates — Look N of M, not personality labels as names.
    const look6 = ROSTER_V24.find((e) => e.starterId === "m-leo")!;
    expect(rosterLookOrdinalLabel(look6)).toBe(lookOrdinalLabel(6, 6));
    expect(rosterLookOrdinalLabel(look6)).not.toBe(starterById("m-leo")!.label);
  });
});

describe("t1173u — consistency across selector / Build Your Look / Locker", () => {
  it("shares silhouette + layer order + backpack-off across surfaces", () => {
    expect(CONSISTENCY_SURFACES).toEqual(["selector", "build-your-look", "locker"]);
    expect(consistencyLayerOrder()).toEqual(ARTWORK_LAYER_ORDER);
    for (const entry of ROSTER_V24) {
      const readiness = slotReadinessByStarterId(entry.starterId)!;
      expect(readiness.surfaces).toEqual([...CONSISTENCY_SURFACES]);
      const cfg = configFromStarter(starterById(entry.starterId)!, {
        stomperId: "x",
        displayName: "ConsistencyCheck",
      });
      expect(cfg.starterId).toBe(entry.starterId);
      expect(starterById(cfg.starterId)!.silhouette).toBe(entry.silhouette);
      expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
      render(<AvatarRenderer config={cfg} testId={`consist-${entry.starterId}`} />);
      const el = screen.getByTestId(`consist-${entry.starterId}`);
      expect(el.getAttribute("data-starter")).toBe(entry.starterId);
      expect(el.getAttribute("data-render-mode")).toBe("svg-fallback");
      cleanup();
    }
  });

  it("preserves Look N of M + user name; never uses starter label as displayName", () => {
    const look1 = ROSTER_V24.find((e) => e.starterId === "m-samir")!;
    expect(rosterLookOrdinalLabel(look1)).toBe(lookOrdinalLabel(1, 6));
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("m-samir");
      useAvatar.getState().setDisplayName("TedBoard");
      useAvatar.getState().selectStarter("m-leo");
    });
    expect(useAvatar.getState().draft.displayName).toBe("TedBoard");
    expect(useAvatar.getState().draft.starterId).toBe("m-leo");
    expect(isValidStomperDisplayName("TedBoard")).toBe(true);
    const cfg = configFromStarter(starterById("f-hana")!, { stomperId: "y" });
    expect(cfg.displayName).toBe("");
    expect(cfg.displayName).not.toBe(starterById("f-hana")!.label);
  });
});

describe("t1173u — masters ≠ modular plates; grom held", () => {
  it("forbids poster-crop → fake modular plates", () => {
    expect(FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES).toBe(true);
    for (const s of approvedMasterSlots()) {
      expect(s.visualMasterPath!.startsWith("docs/")).toBe(true);
      expect(s.visualMasterPath!.includes("/public/stomper/")).toBe(false);
      expect(s.mastersAreNotModularPlates).toBe(true);
    }
  });

  it("keeps gromFlowEnabled false while grom slots remain mapped", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(useAvatar.getState().availableStarters("grom")).toEqual([]);
    const grom = awaitingMasterSlots().filter((s) => s.ageBand === "grom");
    expect(grom).toHaveLength(2);
    expect(grom.every((s) => s.previewOnly)).toBe(true);
    expect(ROSTER_V24_GROM_STARTER_IDS).toEqual(["g-milo", "g-aria"]);
  });

  it("resolveLayerPlate still svg-fallbacks until real modular plates exist", () => {
    const miss = resolveLayerPlate({
      ageBand: "adult",
      slot: "face",
      itemId: "face-male",
      plateExists: () => false,
    });
    expect(miss.mode).toBe("svg-fallback");
    if (miss.mode === "svg-fallback") {
      expect(miss.reason).toBe("missing-plate");
    }
  });
});
