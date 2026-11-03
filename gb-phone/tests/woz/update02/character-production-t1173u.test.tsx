// @vitest-environment jsdom
/**
 * t1173u — Character production readiness: slot status, approved masters,
 * consistency contract, grom held, no substitute art / poster-crop plates.
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
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
  allCharacterSlotReadiness,
  approvedMasterSlots,
  assertSlotReadinessIntegrity,
  awaitingMasterSlots,
  consistencyLayerOrder,
  defaultPlateOrSvgFallback,
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

describe("t1173u — eight integration slots ready", () => {
  it("exposes exactly eight slots with plate URL + SVG fallback contracts", () => {
    const integrity = assertSlotReadinessIntegrity();
    expect(integrity.ok).toBe(true);
    expect(integrity.slotCount).toBe(8);
    expect(allCharacterSlotReadiness()).toHaveLength(8);
    // Roster mapping from t1171u remains locked.
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
    expect(APPROVED_VISUAL_MASTER_PATHS["adult-look-1"]).toContain("look1-m-samir-APPROVED.png");
    expect(APPROVED_VISUAL_MASTER_PATHS["adult-look-2"]).toContain("look2-f-hana-APPROVED.png");
    expect(APPROVED_VISUAL_MASTER_PATHS["adult-look-3"]).toContain("look3-f-priya-APPROVED.png");
  });

  it("marks Looks 4–6 + Grom as AWAITING_MASTER with slots still wired", () => {
    expect(AWAITING_MASTER_LOOK_KEYS).toEqual([
      "adult-look-4",
      "adult-look-5",
      "adult-look-6",
      "grom-boy",
      "grom-girl",
    ]);
    const awaiting = awaitingMasterSlots();
    expect(awaiting).toHaveLength(5);
    expect(awaiting.map((s) => s.starterId)).toEqual([
      "m-devon",
      "f-nova",
      "m-leo",
      "g-milo",
      "g-aria",
    ]);
    for (const s of awaiting) {
      expect(s.masterStatus).toBe("AWAITING_MASTER");
      expect(s.visualMasterPath).toBeNull();
      expect(s.starterPreviewUrl).toBe(buildStarterPreviewUrl(s.ageBand, s.starterId));
      expect(s.surfaces).toEqual([...CONSISTENCY_SURFACES]);
    }
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
      // Same renderer contract on all surfaces.
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
      useAvatar.getState().selectStarter("f-priya");
    });
    expect(useAvatar.getState().draft.displayName).toBe("TedBoard");
    expect(useAvatar.getState().draft.starterId).toBe("f-priya");
    expect(isValidStomperDisplayName("TedBoard")).toBe(true);
    const cfg = configFromStarter(starterById("f-hana")!, { stomperId: "y" });
    expect(cfg.displayName).toBe("");
    expect(cfg.displayName).not.toBe(starterById("f-hana")!.label);
  });
});

describe("t1173u — masters ≠ modular plates; grom held", () => {
  it("forbids poster-crop → fake modular plates", () => {
    expect(FORBIDDEN_POSTER_CROP_TO_FAKE_PLATES).toBe(true);
    // Even when a plateExists probe is true for a fake path, production
    // contract still requires separate transparent layers — masters stay in docs/.
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
