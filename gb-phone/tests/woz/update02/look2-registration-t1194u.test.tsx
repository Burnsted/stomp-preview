// @vitest-environment jsdom
/**
 * t1194u — TRUE modular Look 2 registration gate (visual honesty).
 * File presence ≠ visual PASS. Underlayer AWAITING_FRANZ_BODY.
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
} from "@/lib/stomp/avatar/look2-acceptance";
import {
  LOOK2_PLATE_MANIFEST,
  look2MintRequiredAllShipped,
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

describe("t1194u — Look 2 fixed registration (honest visual gate)", () => {
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

  it("manifest + gate status: AWAITING_FRANZ_BODY; A/C BLOCKED; B EXTRACTED; no fake PASS", () => {
    expect(LOOK2_PLATE_MANIFEST.underJacketBody).toBe("AWAITING_FRANZ_BODY");
    expect(LOOK2_PLATE_MANIFEST.visualRegistrationGate).toBe("BLOCKED_UNDERLAYER");
    expect(LOOK2_PLATE_MANIFEST.compositeA).toBe("BLOCKED");
    expect(LOOK2_PLATE_MANIFEST.compositeB).toBe("EXTRACTED_REGISTERED");
    expect(LOOK2_PLATE_MANIFEST.compositeC).toBe("BLOCKED");
    expect(LOOK2_PLATE_MANIFEST.inkVariants).toBe("ABSENT");
    expect(LOOK2_GATE_STATUS.underJacketBody).toBe("AWAITING_FRANZ_BODY");
    expect(LOOK2_GATE_STATUS.visualRegistrationGate).toBe("BLOCKED_UNDERLAYER");
    expect(LOOK2_GATE_STATUS.androidQa).toBe("OPEN_DEVICE");

    const visual = look2VisualRegistrationStatus();
    expect(visual.underJacketBody).toBe("AWAITING_FRANZ_BODY");
    expect(visual.visualRegistrationGate).toBe("BLOCKED_UNDERLAYER");
    expect(visual.compositeA).toBe("BLOCKED");
    expect(visual.compositeC).toBe("BLOCKED");
    expect(visual.androidDevicePassClaimed).toBe(false);
    expect(visual.visualRegistrationGate).not.toBe("PASS");
  });

  it("ink plates absent; editable ORA + evidence composites present", () => {
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/jacket/jacket-look2-ink@512.webp")),
    ).toBe(false);
    expect(
      existsSync(resolve(PUBLIC_ROOT, "stomper/adult/pants/pants-look2-ink@512.webp")),
    ).toBe(false);
    expect(
      existsSync(
        resolve(
          REPO_ROOT,
          "docs/character-production-t1173u/masters/editable-look2/look2-f-hana-REGISTERED-MASTER.ora",
        ),
      ),
    ).toBe(true);
    expect(existsSync(resolve(T1194, "composites/A-STATUS.txt"))).toBe(true);
    expect(readFileSync(resolve(T1194, "composites/A-STATUS.txt"), "utf8")).toMatch(/BLOCKED/);
    expect(existsSync(resolve(T1194, "composites/B-STATUS.txt"))).toBe(true);
    expect(readFileSync(resolve(T1194, "composites/B-STATUS.txt"), "utf8")).toMatch(
      /EXTRACTED/,
    );
    expect(existsSync(resolve(T1194, "composites/C-STATUS.txt"))).toBe(true);
    expect(readFileSync(resolve(T1194, "composites/C-STATUS.txt"), "utf8")).toMatch(/BLOCKED/);
    expect(existsSync(resolve(T1194, "evidence/A-BLOCKED-underjacket-holes.png"))).toBe(true);
    expect(existsSync(resolve(T1194, "evidence/B-master-vs-layered-registered.png"))).toBe(true);
    expect(existsSync(resolve(T1194, "evidence/validation-summary.json"))).toBe(true);
    const summary = JSON.parse(
      readFileSync(resolve(T1194, "evidence/validation-summary.json"), "utf8"),
    ) as {
      engineeringRegistrationChecks: { ok: boolean };
      artworkUnderlayer: { ok: boolean; honest: boolean; status: string };
      overallVisualRegistrationGate: string;
      androidDevicePass: string;
    };
    expect(summary.engineeringRegistrationChecks.ok).toBe(true);
    expect(summary.artworkUnderlayer.ok).toBe(false);
    expect(summary.artworkUnderlayer.honest).toBe(true);
    expect(summary.artworkUnderlayer.status).toBe("AWAITING_FRANZ_BODY");
    expect(summary.overallVisualRegistrationGate).toBe("BLOCKED_UNDERLAYER");
    expect(summary.androidDevicePass).toBe("NOT_CLAIMED");
  });

  it("registered plates still satisfy #21 file contracts; sha matches manifest", () => {
    expect(look2MintRequiredAllShipped()).toBe(true);
    for (const entry of LOOK2_PLATE_MANIFEST.plates) {
      const disk = resolve(PUBLIC_ROOT, entry.url.replace(/^\//, ""));
      expect(existsSync(disk)).toBe(true);
      const sha = createHash("sha256").update(readFileSync(disk)).digest("hex");
      expect(sha).toBe(entry.sha256);
      expect(entry.size).toEqual([512, 512]);
    }
    const cfg = configFromStarter(starterById(LOOK2_STARTER_ID)!, {
      stomperId: "t1194",
      displayName: "RegRider",
    });
    const gate = evaluateLook2MintGate({ config: cfg });
    expect(gate.plateComplete).toBe(true);
    // File/outfit gate may be eligible; visual underlayer remains blocked separately.
    expect(gate.acceptanceEligible).toBe(true);
    expect(LOOK2_GATE_STATUS.visualRegistrationGate).toBe("BLOCKED_UNDERLAYER");

    render(<AvatarRenderer config={cfg} testId="t1194-look2" />);
    const el = screen.getByTestId("t1194-look2");
    expect(el.getAttribute("data-render-mode")).toBe("plates");
    expect(el.getAttribute("data-missing-plates")).toBe("0");
  });
});
