/**
 * AF-MERGE-ORDER rehearsal self-check (t1184u).
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
  it("pinned tips #12–#21 present; #21 protected; artwork after product fold", async () => {
    // Dynamic import of ESM script exports
    const mod = await import(scriptPath);
    expect(mod.DRAFT_TIPS).toHaveLength(10);
    expect(mod.DRAFT_TIPS.map((t: { pr: number }) => t.pr)).toEqual([
      12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);
    const pr21 = mod.DRAFT_TIPS.find((t: { pr: number }) => t.pr === 21);
    expect(pr21.tip).toBe("67358475dfdd9c23307f5a9d8a8b669138ca076e");
    expect(pr21.role).toMatch(/UNTOUCHED/i);

    const art = mod.MERGE_SEQUENCE.find((s: { step: number }) => s.step === 7);
    const fold = mod.MERGE_SEQUENCE.find((s: { step: number }) => s.step === 6);
    expect(art.step).toBeGreaterThan(fold.step);
    expect(mod.ROLLBACK.length).toBeGreaterThanOrEqual(4);
    expect(mod.REGRESSION_SUITES.some((s: string) => s.includes("AF-XINT"))).toBe(
      true,
    );
  });

  it("script exits 0 in dry rehearsal mode", () => {
    const { execFileSync } = require("node:child_process");
    const out = execFileSync(process.execPath, [scriptPath], {
      encoding: "utf8",
      cwd: join(__dirname, "../.."),
    });
    expect(out).toContain("REHEARSAL RESULT: PASS");
    expect(out).toContain("NO MERGES");
  });

  it("twin MERGE-ORDER-REHEARSAL.md exists with dependency graph", () => {
    const twin = join(
      __dirname,
      "../../docs/release-security-t1184u/MERGE-ORDER-REHEARSAL.md",
    );
    const body = readFileSync(twin, "utf8");
    expect(body).toContain("t1184u");
    expect(body).toContain("#21");
    expect(body).toMatch(/rollback/i);
    expect(body).toContain("AF-XINT");
  });
});
