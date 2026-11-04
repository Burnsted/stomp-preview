// @vitest-environment jsdom
/**
 * t1171u — Character Roster v2.4 technical mapping + artwork integration contracts.
 * Design phase CLOSED. No redesign. SVG fallback until modular plates arrive.
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
import {
  advanceCarouselLook,
  emptyCarouselRiders,
  ridersAreIndependent,
  setCarouselLook,
} from "@/lib/stomp/avatar/carousel-riders";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
import { applyJacketSet, coordinatedPantsForJacket, jacketSetFor } from "@/lib/stomp/avatar/jacket-sets";
import { LOCKER_CATALOG, itemById, starterUnlocks } from "@/lib/stomp/avatar/locker";
import {
  ROSTER_V24,
  ROSTER_V24_ADULT_STARTER_IDS,
  ROSTER_V24_GROM_STARTER_IDS,
  assertRosterV24Integrity,
  approvedAdultStarters,
  approvedGromPreviewStarters,
  isRosterV24StarterId,
  rosterEntryByStarterId,
  rosterLookOrdinalLabel,
} from "@/lib/stomp/avatar/roster-v24";
import { ADULT_STARTERS, GROM_STARTERS, configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
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

describe("t1171u — roster v2.4 eight-look mapping", () => {
  it("maps exactly eight approved looks to existing starter IDs", () => {
    const integrity = assertRosterV24Integrity();
    expect(integrity.ok).toBe(true);
    expect(integrity.adultCount).toBe(6);
    expect(integrity.gromCount).toBe(2);
    expect(ROSTER_V24).toHaveLength(8);
    expect(ROSTER_V24_ADULT_STARTER_IDS).toEqual([
      "m-samir",
      "f-hana",
      "f-priya",
      "m-devon",
      "f-nova",
      "m-leo",
    ]);
    expect(ROSTER_V24_GROM_STARTER_IDS).toEqual(["g-milo", "g-aria"]);
  });

  it("preserves full AF catalogs (12 adult + 6 grom) for stored-identity compatibility", () => {
    expect(ADULT_STARTERS).toHaveLength(12);
    expect(GROM_STARTERS).toHaveLength(6);
    expect(approvedAdultStarters()).toHaveLength(6);
    expect(approvedGromPreviewStarters()).toHaveLength(2);
    for (const id of ROSTER_V24_ADULT_STARTER_IDS) {
      expect(starterById(id)?.ageBand).toBe("adult");
      expect(isRosterV24StarterId(id)).toBe(true);
    }
  });

  it("exposes Look N of M ordinals for approved adults (never personality labels)", () => {
    const adults = ROSTER_V24.filter((e) => e.ageBand === "adult");
    adults.forEach((e, i) => {
      expect(rosterLookOrdinalLabel(e)).toBe(lookOrdinalLabel(i + 1, 6));
      expect(rosterLookOrdinalLabel(e)).not.toBe(starterById(e.starterId)!.label);
    });
    expect(rosterLookOrdinalLabel(ROSTER_V24.find((e) => e.lookKey === "grom-boy")!)).toBe("Look 1 of 2");
    expect(rosterLookOrdinalLabel(ROSTER_V24.find((e) => e.lookKey === "grom-girl")!)).toBe("Look 2 of 2");
  });

  it("locks silhouette per approved look to avoid unexplained proportion jumps", () => {
    for (const entry of ROSTER_V24) {
      expect(starterById(entry.starterId)!.silhouette).toBe(entry.silhouette);
    }
  });
});

describe("t1171u — identity + grom preview-only", () => {
  it("keeps gromFlowEnabled false; grom looks are preview mapping only", () => {
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(useAvatar.getState().availableStarters("grom")).toEqual([]);
    for (const entry of ROSTER_V24.filter((e) => e.ageBand === "grom")) {
      expect(entry.previewOnly).toBe(true);
    }
  });

  it("never silently assigns starter label as displayName for roster looks", () => {
    for (const id of ROSTER_V24_ADULT_STARTER_IDS) {
      const cfg = configFromStarter(starterById(id)!, { stomperId: "x" });
      expect(cfg.displayName).toBe("");
      expect(isValidStomperDisplayName(cfg.displayName)).toBe(false);
      expect(cfg.displayName).not.toBe(starterById(id)!.label);
    }
  });

  it("look change across roster starters preserves entered name", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("f-nova");
      useAvatar.getState().setDisplayName("RidgeFox");
      useAvatar.getState().selectStarter("m-samir");
    });
    expect(useAvatar.getState().draft.displayName).toBe("RidgeFox");
    expect(useAvatar.getState().draft.starterId).toBe("m-samir");
  });
});

describe("t1171u — jacket-set coordination + backpack default off", () => {
  it("coordinates pants/bibs when jacket is equipped (layers stay separate)", () => {
    expect(jacketSetFor("jacket-park-bold")?.pantsId).toBe("pants-park-bibs");
    expect(coordinatedPantsForJacket("jacket-freeride")?.itemId).toBe("pants-freeride");
    expect(itemById("pants-park-bibs")?.slot).toBe("pants");
    expect(itemById("jacket-park-bold")?.slot).toBe("jacket");

    act(() => {
      const s = starterById("f-nova")!;
      useAvatar.setState({
        config: configFromStarter(s, { stomperId: "ME0001", displayName: "Tester" }),
        unlocks: starterUnlocks(),
        onboardComplete: true,
      });
      useAvatar.getState().unlockItem("jacket-park-bold", "activity");
      useAvatar.getState().equipItem("jacket", "jacket-park-bold", "#ff3b78");
    });
    const layers = useAvatar.getState().config!.layers;
    expect(layers.jacket.itemId).toBe("jacket-park-bold");
    expect(layers.pants.itemId).toBe("pants-park-bibs");
    expect(layers.jacket.itemId).not.toBe(layers.pants.itemId);
  });

  it("applyJacketSet keeps jacket and pants as independent LayerRefs", () => {
    const base = configFromStarter(starterById("m-leo")!, { stomperId: "x", displayName: "L" }).layers;
    const next = applyJacketSet(base, "jacket-look6-white", "#f8fafc");
    expect(next.jacket.itemId).toBe("jacket-look6-white");
    expect(next.pants.itemId).toBe("pants-basic");
    expect(next.jacket).not.toBe(next.pants);
  });

  it("defaults backpack OFF on starter configs", () => {
    const cfg = configFromStarter(starterById("f-hana")!, { stomperId: "x", displayName: "H" });
    expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
    expect(itemById(BACKPACK_OFF_ITEM_ID)?.slot).toBe("backpack");
  });

  it("exposes Meta Oakley-style glasses + goggles on eyewear slot", () => {
    expect(itemById(EYEWEAR_ITEM_IDS.goggles)?.slot).toBe("goggles");
    expect(itemById(EYEWEAR_ITEM_IDS.glassesMetaOakley)?.slot).toBe("goggles");
    expect(itemById(EYEWEAR_ITEM_IDS.glassesMetaOakley)?.id).toBe("glasses-meta-oakley");
    expect(LOCKER_CATALOG.some((i) => i.id === "board-stomp-graphic")).toBe(true);
  });
});

describe("t1171u — artwork plate URL + SVG fallback", () => {
  it("builds plate URLs matching LOCKER itemIds and layer order", () => {
    expect(buildPlateUrl("adult", "jacket", "jacket-basic")).toBe(
      "/stomper/adult/jacket/jacket-basic@512.webp",
    );
    expect(buildPlateUrl("adult", "goggles", "glasses-meta-oakley", 1024)).toBe(
      "/stomper/adult/goggles/glasses-meta-oakley@1024.webp",
    );
    expect(buildStarterPreviewUrl("adult", "m-samir")).toBe(
      "/stomper/adult/starter/m-samir/preview@512.webp",
    );
    expect(ARTWORK_LAYER_ORDER).toContain("backpack");
    expect(ARTWORK_LAYER_ORDER.indexOf("board")).toBeLessThan(ARTWORK_LAYER_ORDER.indexOf("jacket"));
    expect(ARTWORK_LAYER_ORDER.indexOf("hair")).toBeLessThan(ARTWORK_LAYER_ORDER.indexOf("headwear"));
    expect(ARTWORK_LAYER_ORDER.indexOf("headwear")).toBeLessThan(ARTWORK_LAYER_ORDER.indexOf("goggles"));
  });

  it("resolves svg-fallback when plates are missing; backpack-off short-circuits", () => {
    const miss = resolveLayerPlate({
      ageBand: "adult",
      slot: "jacket",
      itemId: "jacket-basic",
      plateExists: () => false,
    });
    expect(miss.mode).toBe("svg-fallback");
    const off = resolveLayerPlate({
      ageBand: "adult",
      slot: "backpack",
      itemId: BACKPACK_OFF_ITEM_ID,
    });
    expect(off).toEqual({
      mode: "svg-fallback",
      slot: "backpack",
      itemId: BACKPACK_OFF_ITEM_ID,
      reason: "backpack-off",
    });
    const hit = resolveLayerPlate({
      ageBand: "adult",
      slot: "hair",
      itemId: "hair-straight",
      plateExists: () => true,
    });
    expect(hit.mode).toBe("plate");
  });

  it("AvatarRenderer uses plates for Man 1 prototype; backpack OFF; not acceptance-eligible", () => {
    const cfg = configFromStarter(starterById("m-samir")!, {
      stomperId: "a",
      displayName: "LookPreview",
    });
    render(<AvatarRenderer config={cfg} testId="roster-render" />);
    const el = screen.getByTestId("roster-render");
    // t1205u: Man 1 registered prototype plates shipped.
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    expect(el.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(el.getAttribute("data-prototype-only")).toBe("true");
    expect(el.getAttribute("data-backpack")).toBe("off");
    expect(el.getAttribute("data-starter")).toBe("m-samir");
  });
});

describe("t1171u — two-rider carousel independence", () => {
  it("advancing rider A never mutates rider B", () => {
    let state = emptyCarouselRiders();
    state = setCarouselLook(state, "riderA", "f-nova", "Alpha");
    state = setCarouselLook(state, "riderB", "m-leo", "Bravo");
    expect(ridersAreIndependent(state)).toBe(true);
    const bBefore = structuredClone(state.riderB);
    state = advanceCarouselLook(state, "riderA", 1);
    expect(state.riderA?.starterId).not.toBe("f-nova");
    expect(state.riderA?.displayName).toBe("Alpha");
    expect(state.riderB).toEqual(bBefore);
    expect(state.riderB?.displayName).toBe("Bravo");
    expect(state.riderB?.starterId).toBe("m-leo");
  });

  it("each rider keeps its own displayName across look changes", () => {
    let state = emptyCarouselRiders();
    state = setCarouselLook(state, "riderA", "m-samir", "Ted");
    state = setCarouselLook(state, "riderB", "f-hana", "Ria");
    state = advanceCarouselLook(state, "riderB", 1);
    expect(state.riderA?.displayName).toBe("Ted");
    expect(state.riderA?.starterId).toBe("m-samir");
    expect(state.riderB?.displayName).toBe("Ria");
    expect(rosterEntryByStarterId(state.riderB!.starterId)?.ageBand).toBe("adult");
  });
});
