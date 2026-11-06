// @vitest-environment jsdom
/**
 * t1182u — plate ingest + Look-2 mint gate + eight-look matrix (fail-closed).
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PRIMARY_TABS } from "@/components/stomp/alpine-chrome";
import { AvatarLocker } from "@/components/stomp/avatar/avatar-locker";
import { AvatarOnboard } from "@/components/stomp/avatar/avatar-onboard";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
} from "@/lib/stomp/avatar/artwork";
import { AVATAR_FLAGS } from "@/lib/stomp/avatar/flags";
import {
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  LOOK2_MINT_REQUIRED_PATHS,
  eightLookPlateMatrix,
  evaluateLook2MintGate,
  ingestLook2MintReceipt,
  lookPlateSlotByStarterId,
} from "@/lib/stomp/avatar/plate-registry";
import { ROSTER_V24 } from "@/lib/stomp/avatar/roster-v24";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useStomp } from "@/lib/stomp/store";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAvatar.getState().resetAll();
    useStomp.getState().setScreen("greet");
  });
});

/** Production-shaped Look 2 config for Android-gate positive cases (not Franz prototype). */
function look2Config(overrides?: {
  jacket?: string;
  pants?: string;
  goggles?: string;
  backpack?: string;
  board?: string;
  face?: string;
  hair?: string;
  headwear?: string;
  gloves?: string;
  boots?: string;
  displayName?: string;
  /** When true, keep Franz prototype layers from starter (fail-closed for Android). */
  prototype?: boolean;
}) {
  const base = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
    stomperId: "t1182",
    displayName: overrides?.displayName ?? "TedRider",
  });
  if (overrides?.prototype) {
    return {
      ...base,
      layers: {
        ...base.layers,
        jacket: {
          ...base.layers.jacket,
          itemId: overrides?.jacket ?? LOOK2_JACKET_ITEM_ID,
        },
        pants: {
          ...base.layers.pants,
          itemId: overrides?.pants ?? LOOK2_PANTS_ITEM_ID,
        },
        backpack: {
          ...base.layers.backpack,
          itemId: overrides?.backpack ?? BACKPACK_OFF_ITEM_ID,
        },
      },
    };
  }
  return {
    ...base,
    layers: {
      ...base.layers,
      body: { ...base.layers.body, itemId: "body-athletic" },
      face: { ...base.layers.face, itemId: overrides?.face ?? "face-female" },
      hair: { ...base.layers.hair, itemId: overrides?.hair ?? "hair-straight" },
      jacket: {
        ...base.layers.jacket,
        itemId: overrides?.jacket ?? LOOK2_JACKET_ITEM_ID,
      },
      pants: {
        ...base.layers.pants,
        itemId: overrides?.pants ?? LOOK2_PANTS_ITEM_ID,
      },
      backpack: {
        ...base.layers.backpack,
        itemId: overrides?.backpack ?? BACKPACK_OFF_ITEM_ID,
      },
      gloves: { ...base.layers.gloves, itemId: overrides?.gloves ?? "gloves-basic" },
      headwear: {
        ...base.layers.headwear,
        itemId: overrides?.headwear ?? "helmet-basic",
      },
      goggles: {
        ...base.layers.goggles,
        itemId: overrides?.goggles ?? EYEWEAR_ITEM_IDS.goggles,
      },
      boots: { ...base.layers.boots, itemId: overrides?.boots ?? "boots-basic" },
      board: { ...base.layers.board, itemId: overrides?.board ?? "board-basic" },
    },
  };
}

describe("t1182u — plate ingest + Look-2 mint gate", () => {
  it("LOOK2_MINT_REQUIRED_PATHS match GB handoff exact paths", () => {
    expect(LOOK2_MINT_REQUIRED_PATHS).toEqual([
      "/stomper/adult/jacket/jacket-look2-mint@512.webp",
      "/stomper/adult/pants/pants-look2-mint@512.webp",
      "/stomper/adult/body/body-athletic@512.webp",
      "/stomper/adult/face/face-female@512.webp",
      "/stomper/adult/hair/hair-straight@512.webp",
      "/stomper/adult/headwear/helmet-basic@512.webp",
      "/stomper/adult/goggles/goggles-basic@512.webp",
      "/stomper/adult/gloves/gloves-basic@512.webp",
      "/stomper/adult/boots/boots-basic@512.webp",
      "/stomper/adult/board/board-basic@512.webp",
      "/stomper/adult/starter/f-hana/preview@512.webp",
    ]);
  });

  it("ingest receipt BLOCKED when probe says absent (fail-closed)", () => {
    const receipt = ingestLook2MintReceipt(() => false);
    expect(receipt.ingested).toBe(false);
    expect(receipt.blocked).toBe(true);
    expect(receipt.missingPaths).toHaveLength(LOOK2_MINT_REQUIRED_PATHS.length);
    expect(receipt.readyPaths).toHaveLength(0);
  });

  it("ingest receipt PRESENT for shipped Look 2 mint set (t1189u)", () => {
    const receipt = ingestLook2MintReceipt();
    expect(receipt.ingested).toBe(true);
    expect(receipt.blocked).toBe(false);
    expect(receipt.missingPaths).toHaveLength(0);
    expect(receipt.readyPaths).toHaveLength(LOOK2_MINT_REQUIRED_PATHS.length);
    expect(receipt.note).toMatch(/PRESENT/i);
  });

  it("eight-look matrix: Look 2 ingest-ready; Man1/Woman3/Man2 prototype; only Look 2 is gate", () => {
    const matrix = eightLookPlateMatrix();
    expect(matrix).toHaveLength(ROSTER_V24.length);
    expect(matrix).toHaveLength(8);
    const look2 = matrix.find((s) => s.starterId === LOOK2_STARTER_ID)!;
    expect(look2.androidAcceptanceGate).toBe(true);
    expect(look2.status).toBe("ingest-ready");
    expect(look2.missingPaths).toHaveLength(0);
    expect(look2.requiredPaths).toEqual([...LOOK2_MINT_REQUIRED_PATHS]);
    const others = matrix.filter((s) => s.starterId !== LOOK2_STARTER_ID);
    expect(others.every((s) => s.androidAcceptanceGate === false)).toBe(true);
    expect(matrix.find((s) => s.starterId === "m-samir")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === "f-priya")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === "m-devon")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === "f-nova")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "m-leo")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "g-milo")!.status).toBe("appearance-preview");
    expect(matrix.find((s) => s.starterId === "g-aria")!.status).toBe("appearance-preview");
    expect(others.filter((s) => s.previewOnly).map((s) => s.starterId).sort()).toEqual([
      "g-aria",
      "g-milo",
    ]);
  });

  it("FAIL CLOSED: incomplete set → never acceptance-eligible", () => {
    const cfg = look2Config();
    const onlyJacket = (url: string) => url.includes(LOOK2_JACKET_ITEM_ID);
    const gate = evaluateLook2MintGate({ config: cfg, pathExists: onlyJacket });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.plateComplete).toBe(false);
    expect(gate.failReasons).toContain("incomplete-set");
    expect(gate.failReasons).toContain("plates-absent");
    expect(gate.dataMissingPlates).toBeGreaterThan(0);
  });

  it("FAIL CLOSED: wrong jacket ID", () => {
    const cfg = look2Config({ jacket: "jacket-basic" });
    const gate = evaluateLook2MintGate({
      config: cfg,
      pathExists: () => true,
    });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.failReasons).toContain("wrong-jacket-id");
  });

  it("FAIL CLOSED: eyewear-on (Meta Oakley) during Look-2 acceptance", () => {
    const cfg = look2Config({ goggles: EYEWEAR_ITEM_IDS.glassesMetaOakley });
    const gate = evaluateLook2MintGate({
      config: cfg,
      pathExists: () => true,
    });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.failReasons).toContain("eyewear-on");
  });

  it("FAIL CLOSED: backpack-on during Look-2 acceptance", () => {
    const cfg = look2Config({ backpack: "backpack-daypack" });
    const gate = evaluateLook2MintGate({
      config: cfg,
      pathExists: () => true,
    });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.failReasons).toContain("backpack-on");
  });

  it("eligible only when full production outfit + mint jacket/pants + goggles-basic + backpack OFF", () => {
    const cfg = look2Config();
    const gate = evaluateLook2MintGate({
      config: cfg,
      pathExists: () => true,
      plateProbe: () => "present",
    });
    expect(gate.failReasons).toEqual([]);
    expect(gate.plateComplete).toBe(true);
    expect(gate.prototypeOnly).toBe(false);
    expect(gate.acceptanceEligible).toBe(true);
    expect(gate.dataMissingPlates).toBe(0);
  });

  it("FAIL CLOSED: Franz prototype outfit never Android-acceptance-eligible", () => {
    const cfg = look2Config({ prototype: true });
    const gate = evaluateLook2MintGate({
      config: cfg,
      pathExists: () => true,
      plateProbe: () => "present",
    });
    expect(gate.prototypeOnly).toBe(true);
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.failReasons).toContain("prototype-outfit");
  });

  it("AvatarRenderer uses plates mode when Look 2 production mint set is shipped", () => {
    const cfg = look2Config();
    render(<AvatarRenderer config={cfg} testId="t1182-renderer" />);
    const el = screen.getByTestId("t1182-renderer");
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    expect(el.getAttribute("data-acceptance-eligible")).toBe("true");
    expect(el.getAttribute("data-plate-complete")).toBe("true");
    expect(el.getAttribute("data-jacket")).toBe(LOOK2_JACKET_ITEM_ID);
    expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_ITEM_ID);
    expect(el.getAttribute("data-backpack")).toBe("off");
  });

  it("Locker: prototype starter not Android-eligible; plates ingest-ready", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useAvatar.getState().selectStarter(LOOK2_STARTER_ID);
      useAvatar.getState().setDisplayName("LockerRider");
      useAvatar.getState().commitOnboarding("ME-T1182");
      useStomp.getState().setScreen("avatar-locker");
    });
    expect(useAvatar.getState().config!.displayName).toBe("LockerRider");
    render(<AvatarLocker />);
    const locker = screen.getByTestId("avatar-locker");
    // Franz prototype 8-of-11 — honest fail-closed for Android acceptance
    expect(locker.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(locker.getAttribute("data-missing-plates")).toBe("0");
    expect(locker.getAttribute("data-android-acceptance-gate")).toBe("true");
    expect(locker.getAttribute("data-plate-slot-status")).toBe("ingest-ready");
    const gate = screen.getByTestId("locker-plate-gate");
    expect(gate.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(screen.getByText(/registered visual prototype/i)).toBeTruthy();
    // Name preserved — no silent Nova/Mira/Kai
    expect(screen.getByText("LockerRider")).toBeTruthy();
  });

  it("Create first-ship: OPEN Woman 2 / Man 1 omitted; PARTIAL Woman 3 / Man 2 shown", () => {
    act(() => {
      useAvatar.getState().startOnboarding("adult");
      useStomp.getState().setScreen("avatar-onboard");
    });
    render(<AvatarOnboard />);
    // OPEN prototypes stay QA-ingestable via store, but are not Create-screen characters.
    expect(screen.queryByTestId("starter-f-hana")).toBeNull();
    expect(screen.queryByTestId("starter-m-samir")).toBeNull();

    const priya = screen.getByTestId("starter-f-priya");
    expect(priya.getAttribute("data-create-ship-status")).toBe("partial-not-create-cleared");
    expect(priya.getAttribute("data-create-cleared")).toBe("false");
    expect(priya.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(priya.getAttribute("data-slot-label")).toBe("Woman 3");

    const devon = screen.getByTestId("starter-m-devon");
    expect(devon.getAttribute("data-create-ship-status")).toBe("partial-not-create-cleared");
    expect(devon.getAttribute("data-create-cleared")).toBe("false");
    expect(devon.getAttribute("data-slot-label")).toBe("Man 2");

    // Gate metadata for Look 2 remains available off Create (registry).
    expect(lookPlateSlotByStarterId(LOOK2_STARTER_ID)?.androidAcceptanceGate).toBe(true);
    expect(lookPlateSlotByStarterId("m-samir")?.status).toBe("prototype-ingest-ready");
  });

  it("Home / five-tab / gromFlow / identity locks stay green", () => {
    expect(PRIMARY_TABS.map((t) => t.label)).toEqual([
      "Home",
      "Map",
      "Music",
      "Stats",
      "Crew",
    ]);
    expect(AVATAR_FLAGS.gromFlowEnabled).toBe(false);
    const cfg = look2Config({ displayName: "KeepMyName" });
    expect(cfg.displayName).toBe("KeepMyName");
    expect(cfg.displayName).not.toMatch(/Nova|Mira|Kai/i);
    const slot = lookPlateSlotByStarterId("g-milo");
    expect(slot?.previewOnly).toBe(true);
    expect(slot?.androidAcceptanceGate).toBe(false);
  });
});
