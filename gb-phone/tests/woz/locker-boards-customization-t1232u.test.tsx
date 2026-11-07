// @vitest-environment jsdom
/**
 * t1232u — Woman 3 Locker/Boards end-to-end customization.
 * Character-scoped plates; board collection vs visual equip; persistence.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarLocker } from "@/components/stomp/avatar/avatar-locker";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import { HomeStomperStage } from "@/components/stomp/avatar/home-stomper-stage";
import { StomperIdScreen } from "@/components/stomp/avatar/stomper-id";
import { RiderHub } from "@/components/stomp/rider-hub";
import { Form7SMenu } from "@/components/stomp/brand/form7-s-menu";
import { Form7Brand } from "@/components/stomp/brand/form7-brand";
import {
  BOARD_OFF_ITEM_ID,
  JACKET_OFF_ITEM_ID,
} from "@/lib/stomp/avatar/artwork";
import {
  describeBoardEntry,
  useBoardsCollection,
} from "@/lib/stomp/avatar/boards-collection";
import {
  GENERIC_BOARD_PLATE_PATH,
  GENERIC_BOARD_VISUAL_ITEM_ID,
  canVisuallyEquip,
  modularCharacterPlateMatrix,
  modularSlotOptions,
} from "@/lib/stomp/avatar/locker-compat";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
import { shippedPlatePathExists } from "@/lib/stomp/avatar/look2-plate-manifest";
import {
  modularPrototypeConfig,
  riderLockerStorageKey,
} from "@/lib/stomp/avatar/modular-riders";
import {
  OPEN_PROTOTYPE_STARTER_IDS,
  PARTIAL_CREATE_VISIBLE_STARTER_IDS,
} from "@/lib/stomp/avatar/create-ship-gate";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useSMenu } from "@/lib/stomp/s-menu";

const PUBLIC = resolve(__dirname, "../../public/stomper/adult");

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAvatar.getState().resetAll();
    useBoardsCollection.getState().resetBoards();
    useSMenu.setState({ open: false, pendingHubPanel: null });
  });
});

function seedWoman3(variant: "A" | "B" | "C" = "B") {
  const cfg = modularPrototypeConfig("f-priya", variant, {
    stomperId: "ME-W3-T1232",
    displayName: "Stomper Woman Three",
  })!;
  act(() => {
    useAvatar.setState({
      config: cfg,
      unlocks: starterUnlocks(),
      onboardComplete: true,
      riderConfigs: { "f-priya": cfg },
    });
  });
  return cfg;
}

describe("t1232u — modular character plate matrix (disk honesty)", () => {
  it("matrix lists all eight ingested characters with ABSENT board bindings", () => {
    const rows = modularCharacterPlateMatrix();
    expect(rows).toHaveLength(8);
    expect(rows.map((r) => r.slotLabel)).toEqual([
      "Stomper Woman One",
      "Stomper Woman Two",
      "Stomper Woman Three",
      "Stomper Man One",
      "Stomper Man Two",
      "Stomper Man Three",
      "Stomper Grom One",
      "Stomper Grom Two",
    ]);
    for (const row of rows) {
      expect(row.snowboardBindings).toMatch(/ABSENT/);
    }
    const w3 = rows.find((r) => r.starterId === "f-priya")!;
    expect(w3.jacket).toMatch(/PRESENT/);
    expect(w3.pants).toMatch(/PRESENT/);
    expect(w3.createStatus).toMatch(/on Create/);
    const w2 = rows.find((r) => r.starterId === "f-hana")!;
    expect(w2.createStatus).toMatch(/omitted from Create/);
    const m1 = rows.find((r) => r.starterId === "m-samir")!;
    expect(m1.createStatus).toMatch(/omitted from Create/);
  });

  it("Woman 3 runtime plates exist; character board bindings do not", () => {
    const required = [
      "body/body-look3-solid@512.webp",
      "face/face-f-priya-locked-composite@512.webp",
      "jacket/jacket-look3-purple@512.webp",
      "jacket/jacket-look3-fuchsia@512.webp",
      "pants/pants-look3-purple@512.webp",
      "pants/pants-look3-charcoal@512.webp",
      "gloves/gloves-look3-photo@512.webp",
      "boots/boots-look3-photo@512.webp",
    ];
    for (const rel of required) {
      expect(existsSync(resolve(PUBLIC, rel)), rel).toBe(true);
    }
    expect(existsSync(resolve(PUBLIC, "board/board-basic@512.webp"))).toBe(true);
    expect(existsSync(resolve(PUBLIC, "board/board-look3@512.webp"))).toBe(false);
    expect(existsSync(resolve(PUBLIC, "bindings"))).toBe(false);
    expect(shippedPlatePathExists(GENERIC_BOARD_PLATE_PATH)).toBe(true);
  });

  it("Create omits Woman 2 and Man 1; Woman 3 remains on Create", () => {
    expect(PARTIAL_CREATE_VISIBLE_STARTER_IDS).toContain("f-priya");
    expect(PARTIAL_CREATE_VISIBLE_STARTER_IDS).not.toContain("f-hana");
    expect(PARTIAL_CREATE_VISIBLE_STARTER_IDS).not.toContain("m-samir");
    expect(OPEN_PROTOTYPE_STARTER_IDS).toEqual(["f-hana", "m-samir"]);
  });
});

describe("t1232u — Woman 3 Locker jacket/pants/board", () => {
  it("scopes jacket options to Woman 3 plates only (no Look 2 mint)", () => {
    seedWoman3("B");
    render(<AvatarLocker />);
    expect(screen.getByTestId("avatar-locker").getAttribute("data-slot-label")).toBe(
      "Stomper Woman Three",
    );
    expect(screen.getByTestId("avatar-locker").getAttribute("data-modular-scoped")).toBe(
      "true",
    );
    expect(screen.getByTestId("locker-equip-jacket-look3-purple")).toBeTruthy();
    expect(screen.getByTestId("locker-equip-jacket-look3-fuchsia")).toBeTruthy();
    expect(screen.getByTestId("locker-equip-jacket-none")).toBeTruthy();
    expect(screen.queryByTestId("locker-equip-jacket-look2-mint")).toBeNull();
    expect(screen.queryByTestId("locker-equip-jacket-look1-tan")).toBeNull();
  });

  it("jacket swap updates AvatarRenderer immediately and persists", () => {
    seedWoman3("B");
    render(<AvatarLocker />);
    const before = screen.getByTestId("locker-avatar");
    expect(before.getAttribute("data-jacket")).toBe("jacket-look3-purple");
    expect(before.getAttribute("data-render-mode")).toBe("plates");

    act(() => {
      fireEvent.click(screen.getByTestId("locker-equip-jacket-look3-fuchsia"));
    });
    const after = screen.getByTestId("locker-avatar");
    expect(after.getAttribute("data-jacket")).toBe("jacket-look3-fuchsia");
    expect(after.getAttribute("data-pants")).toBe("pants-look3-charcoal");
    expect(useAvatar.getState().config!.layers.jacket.itemId).toBe(
      "jacket-look3-fuchsia",
    );

    const raw = localStorage.getItem(riderLockerStorageKey("f-priya"));
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).config.layers.jacket.itemId).toBe("jacket-look3-fuchsia");
  });

  it("pants swap changes the actual pants layer", () => {
    seedWoman3("B");
    render(<AvatarLocker />);
    act(() => {
      fireEvent.click(screen.getByTestId("locker-equip-pants-look3-charcoal"));
    });
    expect(screen.getByTestId("locker-avatar").getAttribute("data-pants")).toBe(
      "pants-look3-charcoal",
    );
  });

  it("jacket-off A-state omits jacket plate (provisional underbody)", () => {
    seedWoman3("B");
    render(<AvatarLocker />);
    act(() => {
      fireEvent.click(screen.getByTestId("locker-equip-jacket-none"));
    });
    expect(useAvatar.getState().config!.layers.jacket.itemId).toBe(JACKET_OFF_ITEM_ID);
    expect(screen.getByTestId("locker-avatar").getAttribute("data-jacket")).toBe(
      JACKET_OFF_ITEM_ID,
    );
  });

  it("generic board-basic visually equips; collection-only boards do not invent plates", () => {
    seedWoman3("B");
    render(<AvatarLocker />);
    expect(screen.getByTestId("locker-equip-board-basic").getAttribute("data-visually-available")).toBe(
      "true",
    );
    expect(screen.getByTestId("locker-equip-board-park-graphic").getAttribute("data-visually-available")).toBe(
      "false",
    );
    expect(
      screen.getByTestId("locker-equip-board-park-graphic").getAttribute("data-missing-plate"),
    ).toBe("/stomper/adult/board/board-park-graphic@512.webp");

    act(() => {
      fireEvent.click(screen.getByTestId("locker-equip-board-basic"));
    });
    expect(useAvatar.getState().config!.layers.board.itemId).toBe(
      GENERIC_BOARD_VISUAL_ITEM_ID,
    );
    expect(screen.getByTestId("locker-avatar").getAttribute("data-board")).toBe(
      GENERIC_BOARD_VISUAL_ITEM_ID,
    );
    expect(useBoardsCollection.getState().activeBoardId).toBe(GENERIC_BOARD_VISUAL_ITEM_ID);
    expect(useBoardsCollection.getState().visuallyEquippedItemId).toBe(
      GENERIC_BOARD_VISUAL_ITEM_ID,
    );
  });

  it("rejects wrong-rider equip via store guard", () => {
    seedWoman3("B");
    act(() => {
      useAvatar.getState().equipItem("jacket", "jacket-look2-mint");
    });
    expect(useAvatar.getState().config!.layers.jacket.itemId).toBe(
      "jacket-look3-purple",
    );
    expect(canVisuallyEquip("f-priya", "jacket", "jacket-look2-mint").ok).toBe(false);
  });
});

describe("t1232u — Home / Profile / ID consistency + boards", () => {
  it("Home and STOMPER ID show the same jacket after Locker change", () => {
    seedWoman3("B");
    act(() => {
      useAvatar.getState().equipItem("jacket", "jacket-look3-fuchsia");
    });
    const cfg = useAvatar.getState().config!;
    expect(cfg.layers.jacket.itemId).toBe("jacket-look3-fuchsia");

    render(<HomeStomperStage config={cfg} />);
    expect(screen.getByTestId("home-stomper-avatar").getAttribute("data-jacket")).toBe(
      "jacket-look3-fuchsia",
    );
    cleanup();

    render(<StomperIdScreen />);
    expect(screen.getByTestId("id-card-avatar").getAttribute("data-jacket")).toBe(
      "jacket-look3-fuchsia",
    );
  });

  it("Profile boards: select visual board vs collection-only", () => {
    seedWoman3("B");
    render(<RiderHub initial="Profile" />);
    expect(screen.getByTestId("profile-boards")).toBeTruthy();
    expect(screen.getByTestId("profile-stomper-avatar")).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByTestId("profile-board-board-basic"));
    });
    expect(screen.getByTestId("profile-active-board").textContent).toBe("board-basic");
    expect(screen.getByTestId("profile-visual-board").textContent).toBe("board-basic");
    expect(useAvatar.getState().config!.layers.board.itemId).toBe("board-basic");
    expect(screen.getByTestId("profile-stomper-avatar").getAttribute("data-board")).toBe(
      "board-basic",
    );

    act(() => {
      fireEvent.click(screen.getByTestId("profile-board-board-family-deck"));
    });
    expect(screen.getByTestId("profile-active-board").textContent).toBe(
      "board-family-deck",
    );
    // No visual plate → fall back to board-none on the avatar.
    expect(screen.getByTestId("profile-visual-board").textContent).toBe(BOARD_OFF_ITEM_ID);
    expect(useAvatar.getState().config!.layers.board.itemId).toBe(BOARD_OFF_ITEM_ID);
    expect(
      screen.getByTestId("profile-board-board-family-deck").getAttribute("data-has-visual-plate"),
    ).toBe("false");
    expect(
      screen.getByTestId("profile-board-board-family-deck").getAttribute("data-missing-plate"),
    ).toBe("/stomper/adult/board/board-family-deck@512.webp");
  });

  it("boards collection persists active + visual ids", () => {
    act(() => {
      useBoardsCollection.getState().setActiveBoard("board-basic");
    });
    expect(useBoardsCollection.getState().activeBoardId).toBe("board-basic");
    const raw = localStorage.getItem("stomp-boards-collection");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    // zustand persist wraps state
    const state = parsed.state ?? parsed;
    expect(state.activeBoardId).toBe("board-basic");
    expect(state.visuallyEquippedItemId).toBe("board-basic");
    expect(describeBoardEntry("board-park-graphic").hasVisualPlate).toBe(false);
  });
});

describe("t1232u — S menu regression (preserve tip behavior)", () => {
  it("S inactive until STOMPER saved; active after; Escape dismisses", () => {
    render(
      <>
        <Form7Brand />
        <Form7SMenu />
      </>,
    );
    const trigger = screen.getByTestId("form7-s-menu-trigger");
    expect(trigger.getAttribute("data-menu-active")).toBe("false");
    act(() => {
      fireEvent.click(trigger);
    });
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();

    seedWoman3("B");
    cleanup();
    render(
      <>
        <Form7Brand />
        <Form7SMenu />
      </>,
    );
    const active = screen.getByTestId("form7-s-menu-trigger");
    expect(active.getAttribute("data-menu-active")).toBe("true");
    act(() => {
      fireEvent.click(active);
    });
    expect(screen.getByTestId("form7-s-menu")).toBeTruthy();
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByTestId("form7-s-menu")).toBeNull();
  });

  it("modularSlotOptions board honesty for Woman 3", () => {
    const boards = modularSlotOptions("f-priya", "board");
    const basic = boards.find((b) => b.itemId === "board-basic")!;
    expect(basic.visuallyAvailable).toBe(true);
    expect(basic.reason).toBe("scaffold-generic");
    const park = boards.find((b) => b.itemId === "board-park-graphic")!;
    expect(park.visuallyAvailable).toBe(false);
    expect(park.missingPlatePath).toBe(
      "/stomper/adult/board/board-park-graphic@512.webp",
    );
  });

  it("AvatarRenderer stays in plates mode for Woman 3 B + board-basic", () => {
    const cfg = modularPrototypeConfig("f-priya", "B", {
      displayName: "BoardViz",
    })!;
    cfg.layers.board = { itemId: "board-basic", color: "#d6f25a" };
    render(<AvatarRenderer config={cfg} testId="w3-board-viz" />);
    const el = screen.getByTestId("w3-board-viz");
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    expect(el.getAttribute("data-board")).toBe("board-basic");
    expect(el.getAttribute("data-acceptance-eligible")).toBe("false");
  });
});
