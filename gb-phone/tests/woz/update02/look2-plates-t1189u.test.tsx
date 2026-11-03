// @vitest-environment jsdom
/**
 * t1188u/t1189u — Look 2 mint plates from owner modular sheet on disk.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  BACKPACK_OFF_ITEM_ID,
  EYEWEAR_ITEM_IDS,
} from "@/lib/stomp/avatar/artwork";
import {
  LOOK2_GATE_STATUS,
  LOOK2_JACKET_ITEM_ID,
  LOOK2_PANTS_ITEM_ID,
  LOOK2_STARTER_ID,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  LOOK2_PLATE_MANIFEST,
  look2MintRequiredAllShipped,
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

describe("t1189u — Look 2 modular plates PRESENT", () => {
  it("owner modular sheet provenance + ink ABSENT", () => {
    expect(LOOK2_PLATE_MANIFEST.sourceSha256).toBe(
      "e273e6c13142cf068d25fc1c18503d1d59e947e8af52fee54b9c8e2abda93322",
    );
    expect(LOOK2_PLATE_MANIFEST.inkVariants).toBe("ABSENT");
    expect(LOOK2_GATE_STATUS.modularPlates).toBe("PRESENT");
    expect(LOOK2_GATE_STATUS.androidQa).toBe("OPEN_DEVICE");
    expect(LOOK2_GATE_STATUS.inkVariants).toBe("ABSENT");
    expect(existsSync(resolve(__dirname, "../../../../docs/character-production-t1173u/masters/look2-f-hana-MODULAR-SHEET.png"))).toBe(
      true,
    );
  });

  it("every LOOK2_MINT_REQUIRED_PATH exists under public/ with matching sha256", () => {
    expect(look2MintRequiredAllShipped()).toBe(true);
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
    // No invented ink plates
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/jacket/jacket-look2-ink@512.webp")),
    ).toBe(false);
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/pants/pants-look2-ink@512.webp")),
    ).toBe(false);
  });

  it("gate acceptanceEligible=true for Look 2 mint defaults; fail-closed on jacket-off wrong id", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "t1189",
      displayName: "PlateRider",
    });
    expect(cfg.layers.jacket.itemId).toBe(LOOK2_JACKET_ITEM_ID);
    expect(cfg.layers.pants.itemId).toBe(LOOK2_PANTS_ITEM_ID);
    expect(cfg.layers.backpack.itemId).toBe(BACKPACK_OFF_ITEM_ID);
    expect(cfg.layers.goggles.itemId).toBe(EYEWEAR_ITEM_IDS.goggles);

    const ok = evaluateLook2MintGate({ config: cfg });
    expect(ok.acceptanceEligible).toBe(true);
    expect(ok.failReasons).toEqual([]);
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

  it("AvatarRenderer composites plates for Look 2; other looks stay missing-plates", () => {
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "t1189",
      displayName: "PlateRider",
    });
    render(<AvatarRenderer config={cfg} testId="t1189-look2" />);
    const el = screen.getByTestId("t1189-look2");
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    expect(el.getAttribute("data-acceptance-eligible")).toBe("true");
    expect(el.getAttribute("data-missing-plates")).toBe("0");

    const matrix = eightLookPlateMatrix();
    expect(matrix.find((s) => s.starterId === "m-samir")!.status).toBe("missing-plates");
    expect(matrix.find((s) => s.starterId === LOOK2_STARTER_ID)!.status).toBe("ingest-ready");
  });
});
