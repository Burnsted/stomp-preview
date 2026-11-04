// @vitest-environment jsdom
/**
 * t1179u Batch D — Woz verify+harden regression (all eight D items).
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  ARTWORK_LAYER_ORDER,
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
} from "@/lib/stomp/avatar/artwork";
import {
  BATCH_D_ITEMS,
  assertBatchDHardening,
  batchEWozReadinessRows,
} from "@/lib/stomp/avatar/batch-d-hardening";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import { isValidStomperDisplayName, lookOrdinalLabel } from "@/lib/stomp/avatar/identity";
import { applyJacketSet } from "@/lib/stomp/avatar/jacket-sets";
import {
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
} from "@/lib/stomp/avatar/look2-acceptance";
import { evaluatePlateAssembly } from "@/lib/stomp/avatar/plate-assembly";
import {
  ROSTER_V24,
  ROSTER_V24_ADULT_STARTER_IDS,
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

describe("t1179u Batch D — verify + harden", () => {
  it("assertBatchDHardening covers D1–D8 contract surface", () => {
    const r = assertBatchDHardening();
    expect(r.ok).toBe(true);
    expect(r.paintOrder).toEqual(ARTWORK_LAYER_ORDER);
    expect(r.adultIds).toHaveLength(6);
    expect(r.gromIds).toHaveLength(2);
    expect(r.tabs).toEqual(["Home", "Map", "Music", "Stats", "Crew"]);
    expect(r.gromFlowEnabled).toBe(false);
    expect(BATCH_D_ITEMS).toHaveLength(8);
  });

  it("D1 all-or-nothing: partial plates never acceptance-eligible", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, { stomperId: "d1" });
    const partial = evaluatePlateAssembly(cfg, (url) =>
      url.includes(LOOK2_JACKET_ITEM_ID) ? "present" : "missing",
    );
    expect(partial.reason).toBe("incomplete-set");
    expect(partial.acceptanceEligible).toBe(false);
    expect(partial.renderMode).toBe("svg-fallback");
  });

  it("D2 paint order board→boots→pants→body→face→jacket→backpack→gloves→hair→headwear→goggles", () => {
    expect([...ARTWORK_LAYER_ORDER]).toEqual([
      "board",
      "boots",
      "pants",
      "body",
      "face",
      "jacket",
      "backpack",
      "gloves",
      "hair",
      "headwear",
      "goggles",
    ]);
  });

  it("D3 jacket/pants coordination uses two itemIds", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, { stomperId: "d3" });
    const next = applyJacketSet(cfg.layers, LOOK2_JACKET_ITEM_ID, "#14b8a6");
    expect(next.jacket.itemId).toBe(LOOK2_JACKET_ITEM_ID);
    expect(next.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
    expect(next.jacket.itemId).not.toBe(next.pants.itemId);
  });

  it("D4 eyewear / board / backpack toggle (OFF default)", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter(LOOK2_STARTER_ID);
      useAvatar.getState().setDisplayName("BatchDRider");
      useAvatar.getState().commitOnboarding("ME-D4");
    });
    const cfg = useAvatar.getState().config!;
    expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
    // t1197u prototype defaults: locked-head goggles include + board-none
    expect(cfg.layers.goggles.itemId).toBe("goggles-locked-included");
    expect(cfg.layers.board.itemId).toBe("board-none");

    act(() => {
      useAvatar.getState().equipItem("goggles", EYEWEAR_ITEM_IDS.glassesMetaOakley);
    });
    expect(useAvatar.getState().config!.layers.goggles.itemId).toBe(
      EYEWEAR_ITEM_IDS.glassesMetaOakley,
    );

    act(() => {
      useAvatar.getState().unlockItem("backpack-daypack", "activity");
      useAvatar.getState().equipItem("backpack", "backpack-daypack");
    });
    expect(useAvatar.getState().config!.layers.backpack.itemId).toBe("backpack-daypack");

    act(() => {
      useAvatar.getState().equipItem("backpack", BACKPACK_OFF_ITEM_ID);
    });
    expect(useAvatar.getState().config!.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
  });

  it("D5 name + outfit persistence across eight starter IDs", () => {
    expect(ROSTER_V24_ADULT_STARTER_IDS).toEqual([
      "m-samir",
      "f-hana",
      "f-priya",
      "m-devon",
      "f-nova",
      "m-leo",
    ]);
    ROSTER_V24.filter((e) => e.ageBand === "adult").forEach((e, i) => {
      expect(rosterLookOrdinalLabel(e)).toBe(lookOrdinalLabel(i + 1, 6));
      expect(rosterLookOrdinalLabel(e)).not.toBe(starterById(e.starterId)!.label);
    });

    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter("m-samir");
      useAvatar.getState().setDisplayName("PersistName");
      useAvatar.getState().selectStarter("f-hana");
      useAvatar.getState().selectStarter("m-leo");
    });
    expect(useAvatar.getState().draft.displayName).toBe("PersistName");
    expect(isValidStomperDisplayName("PersistName")).toBe(true);
    expect(useAvatar.getState().draft.displayName).not.toBe("Leo");
    expect(useAvatar.getState().draft.displayName).not.toBe("Nova");
  });

  it("D6 honest plate state: Look 2 complete when mint set shipped; partial still incomplete", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "d6",
      displayName: "Honest",
    });
    render(<AvatarRenderer config={cfg} testId="batch-d-look2" />);
    const el = screen.getByTestId("batch-d-look2");
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    // Prototype starter outfit: plates complete, Android acceptanceEligible stays false
    expect(el.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(el.getAttribute("data-prototype-only")).toBe("true");
    expect(el.getAttribute("data-plate-complete")).toBe("true");
    expect(Number(el.getAttribute("data-required-plates"))).toBeGreaterThan(5);

    // Non–Look-2 starter still incomplete / svg-fallback (no invented plates)
    const other = configFromStarter(starterById("m-samir")!, { stomperId: "d6b" });
    render(<AvatarRenderer config={other} testId="batch-d-other" />);
    expect(screen.getByTestId("batch-d-other").getAttribute("data-render-mode")).toBe(
      "svg-fallback",
    );
    expect(screen.getByTestId("batch-d-other").getAttribute("data-acceptance-eligible")).toBe(
      "false",
    );
  });

  it("D7 STOMPER-first nav preserved (Home + five tabs); grom held", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Map",
      "Music",
      "Stats",
      "Crew",
    ]);
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    expect(useAvatar.getState().availableStarters("grom")).toEqual([]);
  });

  it("Batch E Woz rows honest: engineering PASS, Android/plates BLOCKED", () => {
    const rows = batchEWozReadinessRows();
    expect(rows.filter((r) => r.owner === "Woz").every((r) => r.status === "PASS")).toBe(true);
    expect(rows.find((r) => r.id === "E-look2-android-preview")?.status).toBe("BLOCKED");
    expect(rows.find((r) => r.id === "E-modular-plates")?.status).toBe("BLOCKED");
    expect(rows.find((r) => r.id === "E-artwork-production")?.status).toBe("BLOCKED");
    // Do not fake Android evidence as PASS
    expect(rows.some((r) => r.id.includes("android") && r.status === "PASS")).toBe(false);
  });
});
