/**
 * AF-MERGE-ORDER rehearsal self-check (t1184u + t1187u + t1193u honesty).
 * Docs + script validation only — NEVER performs merges.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, "../scripts/merge-order-rehearsal-t1184u.mjs");

describe("AF-MERGE-ORDER-t1184u rehearsal invariants", () => {
  it("pinned tips #12–#22; #21 protected; #23/#24 side-lane; artwork after readiness", async () => {
    const mod = await import(`${scriptPath}?t=${Date.now()}`);
    expect(mod.DRAFT_TIPS.map((t: { pr: number }) => t.pr)).toEqual([
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    ]);
    const pr21 = mod.DRAFT_TIPS.find((t: { pr: number }) => t.pr === 21);
    expect(pr21.tip).toBe("8b4b79986637ea69330698d8363726feaa8f477f");
    expect(pr21.role).toMatch(/PROTECT/i);

    const pr22 = mod.DRAFT_TIPS.find((t: { pr: number }) => t.pr === 22);
    expect(pr22.branch).toBe("cursor/release-security-readiness-t1184u-ef28");
    expect(pr22.tip).toBe("7917aa69f6249b18945c0f1123a58f11bc6be56a");
    expect(pr22.base).toBe("cursor/release-candidate-t1170u-8e36");

    const side23 = mod.SIDE_LANE_TIPS.find((t: { pr: number }) => t.pr === 23);
    expect(side23.tip).toBe("455faed3c088a840ef5cca9ed58bfe11fd1adf95");
    expect(side23.role).toMatch(/NOT in product merge chain/i);

    const side24 = mod.SIDE_LANE_TIPS.find((t: { pr: number }) => t.pr === 24);
    expect(side24.tip).toBe("cc1f153fd1dff312da4ded7d54329399534be980");
    expect(side24.role).toMatch(/NOT in authz merge chain/i);

    const readiness = mod.MERGE_SEQUENCE.find((s: { step: number }) => s.step === 6.5);
    const progress = mod.MERGE_SEQUENCE.find((s: { step: number }) => s.step === 6.6);
    const art = mod.MERGE_SEQUENCE.find((s: { step: number }) => s.step === 7);
    expect(progress.step).toBeGreaterThan(readiness.step);
    expect(art.step).toBeGreaterThan(progress.step);
    expect(
      mod.MERGE_SEQUENCE.some(
        (s: { dependsOn?: number[] }) =>
          (s.dependsOn || []).includes(23) || (s.dependsOn || []).includes(24),
      ),
    ).toBe(false);
    expect(mod.ROLLBACK.length).toBeGreaterThanOrEqual(4);
    expect(mod.REGRESSION_SUITES.some((s: string) => s.includes("AF-XINT"))).toBe(
      true,
    );
    expect(
      mod.REGRESSION_SUITES.some((s: string) => s.includes("AF-PROGRESS-t1193u")),
    ).toBe(true);
  });

  it("script exits 0 in dry rehearsal mode", () => {
    const { execFileSync } = require("node:child_process");
    const out = execFileSync(process.execPath, [scriptPath], {
      encoding: "utf8",
      cwd: join(__dirname, "../.."),
    });
    expect(out).toContain("REHEARSAL RESULT: PASS");
    expect(out).toContain("NO MERGES");
    expect(out).toContain("#22");
    expect(out).toContain("#23");
    expect(out).toContain("#24");
  });

  it("twin MERGE-ORDER-REHEARSAL.md documents #22 and #23/#24 side-lanes", () => {
    const twin = join(
      __dirname,
      "../../docs/release-security-t1184u/MERGE-ORDER-REHEARSAL.md",
    );
    const body = readFileSync(twin, "utf8");
    expect(body).toContain("t1184u");
    expect(body).toContain("#21");
    expect(body).toContain("#22");
    expect(body).toContain("#23");
    expect(body).toContain("#24");
    expect(body).toMatch(/NOT in product merge chain|side-lane/i);
    expect(body).toMatch(/rollback/i);
    expect(body).toContain("AF-XINT");
  });
});
