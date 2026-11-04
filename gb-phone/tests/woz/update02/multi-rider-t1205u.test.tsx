// @vitest-environment jsdom
/**
 * t1205u — Multi-rider modular registered visual prototypes.
 * Man 1 / Woman 2 / Woman 3 / Man 2 (Look 4). Status REGISTERED_VISUAL_PROTOTYPE_ONLY.
 * No Android PASS / acceptanceEligible / owner visual PASS for incomplete sets.
 * Man 2 framework only — NOT owner-visually-reviewed.
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarLocker } from "@/components/stomp/avatar/avatar-locker";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  BACKPACK_OFF_ITEM_ID,
  BOARD_OFF_ITEM_ID,
  JACKET_OFF_ITEM_ID,
} from "@/lib/stomp/avatar/artwork";
import { jacketSetFor } from "@/lib/stomp/avatar/jacket-sets";
import { LOOK2_STARTER_ID, LOOK2_GATE_STATUS } from "@/lib/stomp/avatar/look2-acceptance";
import { shippedPlatePathExists } from "@/lib/stomp/avatar/look2-plate-manifest";
import { itemById, starterUnlocks } from "@/lib/stomp/avatar/locker";
import {
  MODULAR_RIDERS,
  modularAssetCompletenessMatrix,
  modularIsPrototypeOutfit,
  modularPrototypeConfig,
  modularPrototypePlateUrls,
  modularRiderByStarterId,
  riderLockerStorageKey,
} from "@/lib/stomp/avatar/modular-riders";
import { jacketPantsAreSeparateLayers } from "@/lib/stomp/avatar/plate-assembly";
import { eightLookPlateMatrix, evaluateLook2MintGate } from "@/lib/stomp/avatar/plate-registry";
import { useAvatar } from "@/lib/stomp/avatar/store";
import { useStomp } from "@/lib/stomp/store";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  act(() => {
    useAvatar.getState().resetAll();
  });
});

const REPO = resolve(__dirname, "../../../../");
const PUBLIC = resolve(REPO, "gb-phone/public/stomper/adult");

function sha256File(rel: string): string {
  const buf = readFileSync(resolve(PUBLIC, rel));
  return createHash("sha256").update(buf).digest("hex");
}

describe("t1205u — multi-rider modular prototypes", () => {
  it("registry: slot labels only; status honesty; Man 2 not owner-reviewed", () => {
    expect(MODULAR_RIDERS.map((r) => r.slotLabel)).toEqual([
      "Man 1",
      "Woman 2",
      "Woman 3",
      "Man 2",
    ]);
    for (const r of MODULAR_RIDERS) {
      expect(r.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
      expect(r.androidAccepted).toBe(false);
      expect(r.androidQa).toBe("NOT_RUN");
      expect(r.acceptanceEligible).toBe(false);
      expect(r.altIsTestOnly).toBe(true);
    }
    expect(modularRiderByStarterId("m-devon")!.ownerVisualReview).toBe(
      "NOT_OWNER_REVIEWED",
    );
    expect(LOOK2_GATE_STATUS.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
    expect(LOOK2_GATE_STATUS.androidAccepted).toBe(false);
  });

  it("completeness matrix: PRESENT 8/11; ABSENT hair/helmet/goggles/board/backpack", () => {
    const rows = modularAssetCompletenessMatrix();
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.plates8of11).toBe("PRESENT");
      expect(row.hairSeparated).toBe("ABSENT");
      expect(row.headwearSeparated).toBe("ABSENT");
      expect(row.gogglesSeparated).toBe("ABSENT");
      expect(row.boardBindings).toBe("ABSENT");
      expect(row.backpackIndependent).toBe("ABSENT");
      expect(row.altOutfit).toBe("TEST-ONLY");
      expect(row.acceptanceEligible).toBe(false);
      expect(row.androidQa).toBe("NOT_RUN");
    }
  });

  it("runtime WebPs exist with unique itemIds (no shared body clobber)", () => {
    const bodies = [
      "body/body-athletic@512.webp",
      "body/body-look1-male@512.webp",
      "body/body-look3-solid@512.webp",
      "body/body-look4-lean@512.webp",
    ];
    for (const p of bodies) {
      expect(existsSync(resolve(PUBLIC, p))).toBe(true);
    }
    const hashes = bodies.map(sha256File);
    expect(new Set(hashes).size).toBe(4);

    for (const starterId of ["m-samir", "f-priya", "m-devon", LOOK2_STARTER_ID]) {
      const urls = modularPrototypePlateUrls(starterId);
      expect(urls.length).toBe(8);
      expect(urls.every(shippedPlatePathExists)).toBe(true);
      for (const url of urls) {
        const rel = url.replace("/stomper/adult/", "");
        expect(existsSync(resolve(PUBLIC, rel))).toBe(true);
      }
    }
  });

  it("catalog + jacket sets wired for Man1 / Woman3 / Man2", () => {
    for (const r of MODULAR_RIDERS) {
      for (const id of [
        r.bodyItemId,
        r.faceLockedItemId,
        r.defaultJacketItemId,
        r.defaultPantsItemId,
        r.altJacketItemId,
        r.altPantsItemId,
        r.glovesItemId,
        r.bootsItemId,
      ]) {
        expect(itemById(id), id).toBeTruthy();
      }
      const def = jacketSetFor(r.defaultJacketItemId);
      expect(def?.pantsId).toBe(r.defaultPantsItemId);
      const alt = jacketSetFor(r.altJacketItemId);
      expect(alt?.pantsId).toBe(r.altPantsItemId);
    }
  });

  it.each([
    ["m-samir", "Man 1"] as const,
    [LOOK2_STARTER_ID, "Woman 2"] as const,
    ["f-priya", "Woman 3"] as const,
    ["m-devon", "Man 2"] as const,
  ])("%s (%s) A/B/C AvatarRenderer plates; acceptanceEligible=false", (starterId, slotLabel) => {
    for (const variant of ["A", "B", "C"] as const) {
      const cfg = modularPrototypeConfig(starterId, variant, {
        displayName: `Proto${slotLabel.replace(/\s/g, "")}${variant}`,
      })!;
      expect(cfg).toBeTruthy();
      expect(jacketPantsAreSeparateLayers(cfg.layers)).toBe(true);
      expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
      expect(cfg.layers.board.itemId).toBe(BOARD_OFF_ITEM_ID);
      expect(modularIsPrototypeOutfit(cfg)).toBe(true);

      const rider = modularRiderByStarterId(starterId)!;
      if (variant === "A") {
        expect(cfg.layers.jacket.itemId).toBe(JACKET_OFF_ITEM_ID);
        expect(cfg.layers.pants.itemId).toBe(rider.defaultPantsItemId);
      } else if (variant === "B") {
        expect(cfg.layers.jacket.itemId).toBe(rider.defaultJacketItemId);
        expect(cfg.layers.pants.itemId).toBe(rider.defaultPantsItemId);
      } else {
        expect(cfg.layers.jacket.itemId).toBe(rider.altJacketItemId);
        expect(cfg.layers.pants.itemId).toBe(rider.altPantsItemId);
      }

      render(
        <AvatarRenderer
          config={cfg}
          testId={`t1205-${starterId}-${variant}`}
        />,
      );
      const el = screen.getByTestId(`t1205-${starterId}-${variant}`);
      expect(el.getAttribute("data-render-mode")).toBe("plates");
      expect(el.getAttribute("data-acceptance-eligible")).toBe("false");
      expect(el.getAttribute("data-prototype-only")).toBe("true");
      expect(el.getAttribute("data-slot-label")).toBe(slotLabel);
      expect(el.getAttribute("data-status")).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
      expect(el.getAttribute("data-backpack")).toBe("off");
      expect(el.getAttribute("data-board")).toBe(BOARD_OFF_ITEM_ID);
      cleanup();
    }
  });

  it("Look2 mint gate still fail-closed for prototype; Man2 never claims visual approval", () => {
    const look2 = modularPrototypeConfig(LOOK2_STARTER_ID, "B")!;
    const gate = evaluateLook2MintGate({ config: look2 });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.prototypeOnly).toBe(true);

    const devon = modularRiderByStarterId("m-devon")!;
    expect(devon.ownerVisualReview).toBe("NOT_OWNER_REVIEWED");
    expect(devon.androidQa).toBe("NOT_RUN");
  });

  it("multi-rider Locker isolation: per-rider storage keys never overwrite", () => {
    const man1 = modularPrototypeConfig("m-samir", "B", {
      stomperId: "ME-M1",
      displayName: "RiderAlpha",
    })!;
    const woman3 = modularPrototypeConfig("f-priya", "C", {
      stomperId: "ME-W3",
      displayName: "RiderBeta",
    })!;

    act(() => {
      useAvatar.setState({
        config: man1,
        unlocks: starterUnlocks(),
        onboardComplete: true,
        riderConfigs: { "m-samir": man1 },
      });
    });
    expect(riderLockerStorageKey("m-samir")).toBe(
      "stomp-avatar-locker-rider:m-samir",
    );
    expect(riderLockerStorageKey("f-priya")).toBe(
      "stomp-avatar-locker-rider:f-priya",
    );
    expect(riderLockerStorageKey("m-samir")).not.toBe(
      riderLockerStorageKey("f-priya"),
    );

    act(() => {
      useAvatar.getState().equipItem("jacket", "jacket-look1-orange");
    });
    const afterMan1 = useAvatar.getState().config!;
    expect(afterMan1.starterId).toBe("m-samir");
    expect(afterMan1.layers.jacket.itemId).toBe("jacket-look1-orange");
    expect(afterMan1.layers.pants.itemId).toBe("pants-look1-charcoal");
    expect(afterMan1.displayName).toBe("RiderAlpha");

    // Persist Man1 slice, then activate Woman 3 with independent C outfit.
    act(() => {
      useAvatar.setState({
        riderConfigs: {
          "m-samir": afterMan1,
          "f-priya": woman3,
        },
      });
      useAvatar.getState().activateModularRider("f-priya");
    });
    const activeW3 = useAvatar.getState().config!;
    expect(activeW3.starterId).toBe("f-priya");
    expect(activeW3.layers.jacket.itemId).toBe("jacket-look3-fuchsia");
    expect(activeW3.displayName).toBe("RiderBeta");

    // Switch back — Man 1 orange/charcoal must still be intact.
    act(() => {
      useAvatar.getState().activateModularRider("m-samir");
    });
    const back = useAvatar.getState().config!;
    expect(back.starterId).toBe("m-samir");
    expect(back.layers.jacket.itemId).toBe("jacket-look1-orange");
    expect(back.layers.pants.itemId).toBe("pants-look1-charcoal");
    expect(back.displayName).toBe("RiderAlpha");
    expect(useAvatar.getState().riderConfigs["f-priya"]!.layers.jacket.itemId).toBe(
      "jacket-look3-fuchsia",
    );

    // Per-rider localStorage keys hold independent JSON.
    const rawM1 = localStorage.getItem(riderLockerStorageKey("m-samir"));
    const rawW3 = localStorage.getItem(riderLockerStorageKey("f-priya"));
    expect(rawM1).toBeTruthy();
    expect(rawW3).toBeTruthy();
    expect(JSON.parse(rawM1!).config.layers.jacket.itemId).toBe("jacket-look1-orange");
    expect(JSON.parse(rawW3!).config.layers.jacket.itemId).toBe("jacket-look3-fuchsia");
  });

  it("Locker surface: Man1 prototype gate strip honest", () => {
    const cfg = modularPrototypeConfig("m-samir", "B", {
      stomperId: "ME-LOCK",
      displayName: "LockerMan1",
    })!;
    act(() => {
      useAvatar.setState({
        config: cfg,
        unlocks: starterUnlocks(),
        onboardComplete: true,
        riderConfigs: { "m-samir": cfg },
      });
      useStomp.getState().setScreen("avatar-locker");
    });
    render(<AvatarLocker />);
    const locker = screen.getByTestId("avatar-locker");
    expect(locker.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(locker.getAttribute("data-prototype-only")).toBe("true");
    expect(locker.getAttribute("data-slot-label")).toBe("Man 1");
    expect(screen.getByText("LockerMan1")).toBeTruthy();
  });

  it("matrix status + fail-closed when required prototype URL absent", () => {
    const matrix = eightLookPlateMatrix();
    expect(matrix.find((s) => s.starterId === "m-samir")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === "f-priya")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === "m-devon")!.status).toBe(
      "prototype-ingest-ready",
    );
    expect(matrix.find((s) => s.starterId === LOOK2_STARTER_ID)!.status).toBe(
      "ingest-ready",
    );

    const broken = eightLookPlateMatrix((url) => {
      if (url.includes("jacket-look1-tan")) return false;
      return shippedPlatePathExists(url);
    });
    expect(broken.find((s) => s.starterId === "m-samir")!.status).toBe(
      "missing-plates",
    );
    expect(broken.find((s) => s.starterId === "m-samir")!.missingPaths.length).toBeGreaterThan(
      0,
    );
  });

  it("source ZIP sha256 pins match Franz registered packs", () => {
    expect(modularRiderByStarterId("m-samir")!.sourceZipSha256).toBe(
      "d51249b715a46872fbc54d122217aaa3351c1c538f334ea0b79f2b951b605365",
    );
    expect(modularRiderByStarterId("f-priya")!.sourceZipSha256).toBe(
      "c23e0ceb6f332b5f55ba253844b8926eb6ab3f80fd9c95e7312e551b6de2f758",
    );
    expect(modularRiderByStarterId("m-devon")!.sourceZipSha256).toBe(
      "d7d6484409c4da276ca095f21d765ff00c7d915d16befe2cccebd075d7fa7a02",
    );
  });
});
