// @vitest-environment jsdom
/**
 * t1188u/t1189u → t1197u — Look 2 plates on disk (mint + art-pass ink/body).
 * Prototype 8-of-11 ≠ Android PASS.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  BACKPACK_OFF_ITEM_ID,
  BOARD_OFF_ITEM_ID,
} from "@/lib/stomp/avatar/artwork";
import {
  LOOK2_FACE_LOCKED_ITEM_ID,
  LOOK2_GATE_STATUS,
  LOOK2_JACKET_INK_ITEM_ID,
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_INK_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
  look2PrototypeConfig,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  LOOK2_PLATE_MANIFEST,
  look2MintRequiredAllShipped,
  look2PrototypeRequiredAllShipped,
  shippedPlatePathExists,
} from "@/lib/stomp/avatar/look2-plate-manifest";
import {
  LOOK2_MINT_REQUIRED_PATHS,
  evaluateLook2MintGate,
  eightLookPlateMatrix,
  ingestLook2MintReceipt,
} from "@/lib/stomp/avatar/plate-registry";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";

afterEach(() => {
  cleanup();
});

const PUBLIC_ROOT = resolve(__dirname, "../../../public");

describe("t1189u/t1197u — Look 2 modular prototype plates PRESENT", () => {
  it("owner modular sheet provenance + ink PRESENT (art-pass)", () => {
    expect(LOOK2_PLATE_MANIFEST.sourceSha256).toBe(
      "e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322",
    );
    expect(LOOK2_PLATE_MANIFEST.inkVariants).toBe("PRESENT");
    expect(LOOK2_GATE_STATUS.modularPlates).toBe("PROTOTYPE_8_OF_11");
    expect(LOOK2_GATE_STATUS.androidQa).toBe("OPEN_DEVICE");
    expect(LOOK2_GATE_STATUS.inkVariants).toBe("PRESENT");
    expect(LOOK2_GATE_STATUS.androidAccepted).toBe(false);
    expect(LOOK2_GATE_STATUS.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
    expect(
      existsSync(
        resolve(
          __dirname,
          "../../../../docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png",
        ),
      ),
    ).toBe(true);
  });

  it("production mint scaffolding + prototype 8 art-pass plates match sha256", () => {
    expect(look2MintRequiredAllShipped()).toBe(true);
    expect(look2PrototypeRequiredAllShipped()).toBe(true);
    expect(LOOK2_MINT_REQUIRED_PATHS.every(shippedPlatePathExists)).toBe(true);
    for (const url of LOOK2_MINT_REQUIRED_PATHS) {
      const entry = LOOK2_PLATE_MANIFEST.plates.find((p) => p.url === url);
      expect(entry).toBeTruthy();
      const disk = resolve(PUBLIC_ROOT, url.replace(/^\//, ""));
      expect(existsSync(disk)).toBe(true);
      const sha = createHash("sha256").update(readFileSync(disk)).digest("hex");
      expect(sha).toBe(entry!.sha256);
      expect(entry!.size).toEqual([512, 512]);
    }
    // Art-pass ink plates PRESENT (not invented earlier)
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/jacket/jacket-look2-ink@512.webp")),
    ).toBe(true);
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/pants/pants-look2-ink@512.webp")),
    ).toBe(true);
    expect(shippedPlatePathExists("/stomper/adult/jacket/jacket-look2-ink@512.webp")).toBe(
      true,
    );
  });

  it("prototype starter: plates render; Android gate fail-closed; jacket-set swap works", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "t1189",
      displayName: "PlateRider",
    });
    expect(cfg.layers.jacket.itemId).toBe(LOOK2_JACKET_ITEM_ID);
    expect(cfg.layers.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
    expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
    expect(cfg.layers.face.itemId).toBe(LOOK2_FACE_LOCKED_ITEM_ID);
    expect(cfg.layers.board.itemId).toBe(BOARD_OFF_ITEM_ID);
    expect(cfg.layers.goggles.itemId).toBe("goggles-locked-included");

    const ok = evaluateLook2MintGate({ config: cfg });
    expect(ok.acceptanceEligible).toBe(false);
    expect(ok.prototypeOnly).toBe(true);
    expect(ok.failReasons).toContain("prototype-outfit");
    expect(ingestLook2MintReceipt().ingested).toBe(true);

    const jacketOff = {
      ...cfg,
      layers: {
        ...cfg.layers,
        jacket: { ...cfg.layers.jacket, itemId: "jacket-basic" },
      },
    };
    const bad = evaluateLook2MintGate({ config: jacketOff });
    expect(bad.acceptanceEligible).toBe(false);
    expect(bad.failReasons).toContain("wrong-jacket-id");
  });

  it("AvatarRenderer composites A/B/C prototype; other looks stay missing-plates", () => {
    for (const variant of ["A", "B", "C"] as const) {
      const cfg = look2PrototypeConfig(variant, { displayName: `Proto${variant}` });
      render(<AvatarRenderer config={cfg} testId={`t1189-${variant}`} />);
      const el = screen.getByTestId(`t1189-${variant}`);
      expect(el.getAttribute("data-render-mode")).toBe("plates");
      expect(el.getAttribute("data-plate-complete")).toBe("true");
      expect(el.getAttribute("data-missing-plates")).toBe("0");
      if (variant === "A") {
        expect(el.getAttribute("data-jacket")).toBe("jacket-none");
        expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_ITEM_ID);
      } else if (variant === "B") {
        expect(el.getAttribute("data-jacket")).toBe(LOOK2_JACKET_ITEM_ID);
        expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_ITEM_ID);
      } else {
        expect(el.getAttribute("data-jacket")).toBe(LOOK2_JACKET_INK_ITEM_ID);
        expect(el.getAttribute("data-pants")).toBe(LOOK2_PANTS_INK_ITEM_ID);
      }
      cleanup();
    }

    const matrix = eightLookPlateMatrix();
    expect(matrix.find((s) => s.starterId === "m-samir")!.status).toBe("missing-plates");
    expect(matrix.find((s) => s.starterId === LOOK2_STARTER_ID)!.status).toBe(
      "ingest-ready",
    );
  });
});
