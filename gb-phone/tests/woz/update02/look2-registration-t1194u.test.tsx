// @vitest-environment jsdom
/**
 * t1194u → t1197u — TRUE modular Look 2 registration gate (visual honesty).
 * File presence ≠ Android PASS. Art-pass body/ink = REGISTERED_VISUAL_PROTOTYPE_ONLY.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AvatarRenderer } from "@/components/stomp/avatar/avatar-renderer";
import {
  LOOK2_GATE_STATUS,
  LOOK2_STARTER_ID,
  look2PrototypeConfig,
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  LOOK2_PLATE_MANIFEST,
  look2MintRequiredAllShipped,
  look2PrototypeRequiredAllShipped,
  look2VisualRegistrationStatus,
} from "@/lib/stomp/avatar/look2-plate-manifest";
import { evaluateLook2MintGate } from "@/lib/stomp/avatar/plate-registry";
import { configFromStarter, starterById } from "@/lib/stomp/avatar/starters";

afterEach(() => {
  cleanup();
});

const REPO_ROOT = resolve(__dirname, "../../../../");
const PUBLIC_ROOT = resolve(__dirname, "../../../public");
const T1194 = resolve(REPO_ROOT, "docs/modular-alignment-t1194u");
const T1197 = resolve(REPO_ROOT, "docs/modular-prototype-t1197u");

describe("t1194u/t1197u — Look 2 fixed registration (honest visual gate)", () => {
  it("registration contract: 1024→512 common scale; banned independent fit", () => {
    const regPath = resolve(T1194, "registration-transform.json");
    expect(existsSync(regPath)).toBe(true);
    const reg = JSON.parse(readFileSync(regPath, "utf8")) as {
      prod_canvas: number;
      runtime_canvas: number;
      common_scale: number;
      banned: string[];
    };
    expect(reg.prod_canvas).toBe(1024);
    expect(reg.runtime_canvas).toBe(512);
    expect(reg.common_scale).toBe(0.5);
    for (const ban of [
      "tight_crop_center",
      "fit_to_canvas_per_piece",
      "aligned_stack_canvas",
      "enrich_with_iso_reposition",
    ]) {
      expect(reg.banned).toContain(ban);
    }
    expect(LOOK2_PLATE_MANIFEST.productionCanvas).toBe(1024);
    expect(LOOK2_PLATE_MANIFEST.runtimeCanvas).toBe(512);
    expect(LOOK2_PLATE_MANIFEST.commonScale).toBe(0.5);
  });

  it("manifest + gate: art-pass PROTOTYPE; no fake Android PASS", () => {
    expect(LOOK2_PLATE_MANIFEST.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");
    expect(LOOK2_PLATE_MANIFEST.underJacketBody).toBe("PROTOTYPE_PRESENT");
    expect(LOOK2_PLATE_MANIFEST.visualRegistrationGate).toBe(
      "PROTOTYPE_AWAITING_ACCEPTANCE",
    );
    expect(LOOK2_PLATE_MANIFEST.compositeA).toBe("PROTOTYPE_RENDERED");
    expect(LOOK2_PLATE_MANIFEST.compositeB).toBe("PROTOTYPE_RENDERED");
    expect(LOOK2_PLATE_MANIFEST.compositeC).toBe("PROTOTYPE_RENDERED");
    expect(LOOK2_PLATE_MANIFEST.inkVariants).toBe("PRESENT");
    expect(LOOK2_PLATE_MANIFEST.androidAccepted).toBe(false);
    expect(LOOK2_GATE_STATUS.underJacketBody).toBe("PROTOTYPE_PRESENT");
    expect(LOOK2_GATE_STATUS.visualRegistrationGate).toBe(
      "PROTOTYPE_AWAITING_ACCEPTANCE",
    );
    expect(LOOK2_GATE_STATUS.modularPlates).toBe("PROTOTYPE_8_OF_11");
    expect(LOOK2_GATE_STATUS.androidAccepted).toBe(false);
    expect(LOOK2_GATE_STATUS.androidQa).toBe("OPEN_DEVICE");
    expect(LOOK2_GATE_STATUS.status).toBe("REGISTERED_VISUAL_PROTOTYPE_ONLY");

    const visual = look2VisualRegistrationStatus();
    expect(visual.underJacketBody).toBe("PROTOTYPE_PRESENT");
    expect(visual.visualRegistrationGate).toBe("PROTOTYPE_AWAITING_ACCEPTANCE");
    expect(visual.compositeA).toBe("PROTOTYPE_RENDERED");
    expect(visual.compositeC).toBe("PROTOTYPE_RENDERED");
    expect(visual.inkVariants).toBe("PRESENT");
    expect(visual.androidDevicePassClaimed).toBe(false);
    expect(visual.visualRegistrationGate).not.toBe("PASS");
  });

  it("art-pass ink + body present; verified hashes; Franz open repairs listed", () => {
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/jacket/jacket-look2-ink@512.webp")),
    ).toBe(true);
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/pants/pants-look2-ink@512.webp")),
    ).toBe(true);
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/body/body-athletic@512.webp")),
    ).toBe(true);
    const body = LOOK2_PLATE_MANIFEST.plates.find((p) => p.url.includes("body-athletic"))!;
    const inkJ = LOOK2_PLATE_MANIFEST.plates.find((p) =>
      p.url.includes("jacket-look2-ink"),
    )!;
    const inkP = LOOK2_PLATE_MANIFEST.plates.find((p) =>
      p.url.includes("pants-look2-ink"),
    )!;
    expect(body.sha256).toBe(
      "c69f7d872043c36432f7e0035deb2021c54514d5b781e18f23ffa04d11b0a999",
    );
    expect(body.bytes).toBe(7082);
    expect(LOOK2_GATE_STATUS.crotchClip).toBe("DONE");
    expect(LOOK2_GATE_STATUS.bodySha256).toBe(
      "c69f7d872043c36432f7e0035deb2021c54514d5b781e18f23ffa04d11b0a999",
    );
    expect(inkJ.sha256).toBe(
      "d22534a9e700cf29b0b45a2c0106c6848136288ecc8e3b9c23bdbb3e33ce5206",
    );
    expect(inkP.sha256).toBe(
      "6fe342fea91bc14086a3d9d2006e256d5cf1f81c0ad4b2103cc49e893adf9279",
    );
    expect(LOOK2_PLATE_MANIFEST.sourceZipSha256).toBe(
      "b713687909462d4e91efcd19032a2b0ebd575d1e44628bdc58564815377f7f86",
    );
    expect(LOOK2_PLATE_MANIFEST.preferredPack).toBe("franz-body-clip");
    expect(LOOK2_PLATE_MANIFEST.crotchClip?.status).toBe("DONE");
    expect(LOOK2_GATE_STATUS.openArtRepairs.join(" ")).toMatch(/chin notch/);
    expect(LOOK2_GATE_STATUS.openArtRepairs.join(" ")).toMatch(/braid wisp/);
    expect(LOOK2_GATE_STATUS.openArtRepairs.join(" ")).toMatch(/chest slashes/);
    expect(existsSync(resolve(T1197, "art-pass/ARTWORK-STATUS.md"))).toBe(true);
    expect(existsSync(resolve(T1197, "evidence/ABC-artpass-side-by-side.png"))).toBe(true);
    // Historical t1194u underlayer evidence retained for audit trail
    expect(existsSync(resolve(T1194, "evidence/validation-summary.json"))).toBe(true);
    const summary = JSON.parse(
      readFileSync(resolve(T1194, "evidence/validation-summary.json"), "utf8"),
    ) as { artworkUnderlayer: { status: string }; androidDevicePass: string };
    expect(summary.artworkUnderlayer.status).toBe("AWAITING_FRANZ_BODY");
    expect(summary.androidDevicePass).toBe("NOT_CLAIMED");
  });

  it("prototype plates render; Android gate stays fail-closed", () => {
    expect(look2MintRequiredAllShipped()).toBe(true);
    expect(look2PrototypeRequiredAllShipped()).toBe(true);
    for (const url of LOOK2_PLATE_MANIFEST.prototypeRequiredUrls ?? []) {
      const entry = LOOK2_PLATE_MANIFEST.plates.find((p) => p.url === url)!;
      const disk = resolve(PUBLIC_ROOT, entry.url.replace(/^\//, ""));
      expect(existsSync(disk)).toBe(true);
      const sha = createHash("sha256").update(readFileSync(disk)).digest("hex");
      expect(sha).toBe(entry.sha256);
      expect(entry.size).toEqual([512, 512]);
    }

    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "t1197",
      displayName: "ProtoRider",
    });
    const gate = evaluateLook2MintGate({ config: cfg });
    expect(gate.prototypeOnly).toBe(true);
    expect(gate.acceptanceEligible).toBe(false);
    expect(gate.failReasons).toContain("prototype-outfit");
    expect(LOOK2_GATE_STATUS.visualRegistrationGate).toBe(
      "PROTOTYPE_AWAITING_ACCEPTANCE",
    );

    for (const variant of ["A", "B", "C"] as const) {
      const proto = look2PrototypeConfig(variant);
      render(<AvatarRenderer config={proto} testId={`t1197-${variant}`} />);
      const el = screen.getByTestId(`t1197-${variant}`);
      expect(el.getAttribute("data-render-mode")).toBe("plates");
      expect(el.getAttribute("data-plate-complete")).toBe("true");
      cleanup();
    }
  });
});
