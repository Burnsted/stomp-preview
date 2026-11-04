// @vitest-environment jsdom
/**
 * t1202u — Look 2 finishing harness (draft #27 only).
 * Registration / mint↔ink / jacket-off / persist / fail-closed.
 * Browser evidence ≠ Android PASS. Status REGISTERED_VISUAL_PROTOTYPE_ONLY.
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvatarLocker } from "@/components/stomp/avatar/avatar-locker";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  LOOK2_BOOTS_PHOTO_ITEM_ID,
  LOOK2_FACE_LOCKED_ITEM_ID,
  LOOK2_GATE_STATUS,
  LOOK2_GLOVES_PHOTO_ITEM_ID,
  LOOK2_JACKET_INK_ITEM_ID,
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_INK_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
  look2IsPrototypeOutfit,
  look2PrototypeConfig,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  BOARD_OFF_ITEM_ID,
  BACKPACK_OFF_ITEM_ID,
  JACKET_OFF_ITEM_ID,
} from "@/lib/stomp/avatar/artwork";
import { evaluateLook2MintGate } from "@/lib/stomp/avatar/plate-registry";
import { jacketPantsAreSeparateLayers } from "@/lib/stomp/avatar/plate-assembly";
import { starterUnlocks } from "@/lib/stomp/avatar/locker";
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

const REPO_ROOT = resolve(__dirname, "../../../../");
const FINISH = resolve(REPO_ROOT, "docs/modular-prototype-t1197u/finishing");

function seedLook2(displayName = "FinishHana") {
  const cfg = look2PrototypeConfig("B", {
    stomperId: "ME-T1202",
    displayName,
  });
  act(() => {
    useAvatar.setState({
      config: cfg,
      unlocks: starterUnlocks(),
      onboardComplete: true,
    });
    useStomp.getState().setScreen("avatar-locker");
  });
  return cfg;
}

describe("t1202u — Look 2 finishing harness (prototype only)", () => {
  it("A/B/C AvatarRenderer plates; jacket+pants independent itemIds; backpack OFF", () => {
    for (const variant of ["A", "B", "C"] as const) {
      const cfg = look2PrototypeConfig(variant, { displayName: `Proto${variant}` });
      expect(jacketPantsAreSeparateLayers(cfg.layers)).toBe(true);
      expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
      expect(cfg.layers.board.itemId).toBe(BOARD_OFF_ITEM_ID);
      expect(cfg.layers.face.itemId).toBe(LOOK2_FACE_LOCKED_ITEM_ID);
      expect(look2IsPrototypeOutfit(cfg)).toBe(true);

      if (variant === "A") {
        expect(cfg.layers.jacket.itemId).toBe(JACKET_OFF_ITEM_ID);
        expect(cfg.layers.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
      } else if (variant === "B") {
        expect(cfg.layers.jacket.itemId).toBe(LOOK2_JACKET_ITEM_ID);
        expect(cfg.layers.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
      } else {
        expect(cfg.layers.jacket.itemId).toBe(LOOK2_JACKET_INK_ITEM_ID);
        expect(cfg.layers.pants.itemId).toBe(LOOK2_PANTS_INK_ITEM_ID);
      }

      render(<AvatarRenderer config={cfg} testId={`t1202-${variant}`} />);
      const el = screen.getByTestId(`t1202-${variant}`);
      expect(el.getAttribute("data-render-mode")).toBe("plates");
      expect(el.getAttribute("data-acceptance-eligible")).toBe("false");
      expect(el.getAttribute("data-backpack")).toBe("off");
      expect(el.getAttribute("data-board")).toBe(BOARD_OFF_ITEM_ID);
      expect(el.getAttribute("data-starter")).toBe(LOOK2_STARTER_ID);
      if (variant === "A") {
        expect(el.getAttribute("data-jacket")).toBe(JACKET_OFF_ITEM_ID);
      } else if (variant === "B") {
        expect(el.getAttribute("data-jacket")).toBe(LOOK2_JACKET_ITEM_ID);
        expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_ITEM_ID);
      } else {
        expect(el.getAttribute("data-jacket")).toBe(LOOK2_JACKET_INK_ITEM_ID);
        expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_INK_ITEM_ID);
      }
      cleanup();
    }
  });

  it("Locker mint↔ink swap + jacket-off keeps face/gloves/boots; acceptanceEligible false", () => {
    seedLook2("FinishHana");
    render(<AvatarLocker />);
    const locker = screen.getByTestId("avatar-locker");
    expect(locker.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(screen.getByText("FinishHana")).toBeTruthy();

    const avatar = screen.getByTestId("locker-avatar");
    expect(avatar.getAttribute("data-jacket")).toBe(LOOK2_JACKET_ITEM_ID);
    expect(avatar.getAttribute("data-pants")).toBe(LOOK2_PANTS_ITEM_ID);
    expect(avatar.getAttribute("data-acceptance-eligible")).toBe("false");
    expect(avatar.getAttribute("data-backpack")).toBe("off");

    act(() => {
      useAvatar.getState().equipItem("jacket", LOOK2_JACKET_INK_ITEM_ID);
    });
    expect(useAvatar.getState().config!.layers.jacket.itemId).toBe(LOOK2_JACKET_INK_ITEM_ID);
    expect(useAvatar.getState().config!.layers.pants.itemId).toBe(LOOK2_PANTS_INK_ITEM_ID);
    expect(useAvatar.getState().config!.layers.face.itemId).toBe(LOOK2_FACE_LOCKED_ITEM_ID);
    expect(useAvatar.getState().config!.layers.gloves.itemId).toBe(LOOK2_GLOVES_PHOTO_ITEM_ID);
    expect(useAvatar.getState().config!.layers.boots.itemId).toBe(LOOK2_BOOTS_PHOTO_ITEM_ID);
    expect(useAvatar.getState().config!.displayName).toBe("FinishHana");

    act(() => {
      useAvatar.getState().equipItem("jacket", LOOK2_JACKET_ITEM_ID);
    });
    expect(useAvatar.getState().config!.layers.jacket.itemId).toBe(LOOK2_JACKET_ITEM_ID);
    expect(useAvatar.getState().config!.layers.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);

    act(() => {
      useAvatar.getState().equipItem("jacket", JACKET_OFF_ITEM_ID);
    });
    expect(useAvatar.getState().config!.layers.jacket.itemId).toBe(JACKET_OFF_ITEM_ID);
    // pants stay independent mint pants when jacket-off (no jacket-set)
    expect(useAvatar.getState().config!.layers.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
    expect(useAvatar.getState().config!.layers.face.itemId).toBe(LOOK2_FACE_LOCKED_ITEM_ID);
    expect(useAvatar.getState().config!.layers.body.itemId).toBe("body-athletic");

    const gate = evaluateLook2MintGate({ config: useAvatar.getState().config! });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.prototypeOnly).toBe(true);
    expect(gate.failReasons).toContain("prototype-outfit");
  });

  it("name + outfit survive screen hop; backpack stays OFF; gate honesty", () => {
    seedLook2("FinishHana");
    act(() => {
      useAvatar.getState().equipItem("jacket", LOOK2_JACKET_INK_ITEM_ID);
    });
    const before = structuredClone(useAvatar.getState().config!);
    act(() => {
      useStomp.getState().setScreen("greet");
      useStomp.getState().setScreen("avatar-locker");
    });
    const after = useAvatar.getState().config!;
    expect(after.displayName).toBe("FinishHana");
    expect(after.starterId).toBe(LOOK2_STARTER_ID);
    expect(after.layers.jacket.itemId).toBe(before.layers.jacket.itemId);
    expect(after.layers.pants.itemId).toBe(before.layers.pants.itemId);
    expect(after.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
    expect(after.layers.face.itemId).toBe(LOOK2_FACE_LOCKED_ITEM_ID);

    expect(LOOK2_GATE_STATUS.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
    expect(LOOK2_GATE_STATUS.androidAccepted).toBe(false);
    expect(LOOK2_GATE_STATUS.modularPlates).toBe("PROTOTYPE_8_OF_11");
    expect(LOOK2_GATE_STATUS.androidQa).toBe("OPEN_DEVICE");
  });

  it("fail-closed when required prototype piece missing from gate probe", () => {
    const cfg = look2PrototypeConfig("B", { displayName: "MissingProbe" });
    const gate = evaluateLook2MintGate({
      config: cfg,
      pathExists: (p) => !p.includes("jacket-look2-mint"),
      plateProbe: (url) => (url.includes("jacket-look2-mint") ? "missing" : "present"),
    });
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.dataMissingPlates).toBeGreaterThan(0);
  });

  it("documents finishing phone proofs when present (not required for unit pass)", () => {
    // Proofs are produced by scripts/look2-finishing-phone-proofs.mjs — optional here.
    if (!existsSync(resolve(FINISH, "phone-viewport-manifest.json"))) {
      expect(LOOK2_GATE_STATUS.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
      return;
    }
    const manifest = JSON.parse(
      readFileSync(resolve(FINISH, "phone-viewport-manifest.json"), "utf8"),
    ) as {
      status: string;
      honesty: { androidPass: boolean; browserPhoneViewportIsNotDevicePass: boolean };
      results: {
        A: { attrs: { jacket: string; acceptanceEligible: string } };
        B: { attrs: { jacket: string; pants: string } };
        C: { attrs: { jacket: string; pants: string } };
        persist: { nameOk: boolean; backpackOff: boolean; acceptanceEligibleFalse: boolean };
      };
    };
    expect(manifest.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
    expect(manifest.honesty.androidPass).toBe(false);
    expect(manifest.honesty.browserPhoneViewportIsNotDevicePass).toBe(true);
    expect(manifest.results.A.attrs.jacket).toBe(JACKET_OFF_ITEM_ID);
    expect(manifest.results.A.attrs.acceptanceEligible).toBe("false");
    expect(manifest.results.B.attrs.jacket).toBe(LOOK2_JACKET_ITEM_ID);
    expect(manifest.results.B.attrs.pants).toBe(LOOK2_PANTS_ITEM_ID);
    expect(manifest.results.C.attrs.jacket).toBe(LOOK2_JACKET_INK_ITEM_ID);
    expect(manifest.results.C.attrs.pants).toBe(LOOK2_PANTS_INK_ITEM_ID);
    expect(manifest.results.persist.nameOk).toBe(true);
    expect(manifest.results.persist.backpackOff).toBe(true);
    expect(manifest.results.persist.acceptanceEligibleFalse).toBe(true);
    for (const key of [
      "A-jacket-off-phone-390x844.png",
      "B-mint-phone-390x844.png",
      "C-ink-phone-390x844.png",
    ]) {
      expect(existsSync(resolve(FINISH, key))).toBe(true);
    }
  });
});
