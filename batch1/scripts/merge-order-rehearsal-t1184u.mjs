#!/usr/bin/env node
/**
 * MERGE-ORDER REHEARSAL (t1184u + t1187u + t1193u honesty pass) — validation ONLY.
 * Does NOT merge, rebase, or deploy.
 *
 * Verifies recorded tip SHAs for draft PRs #12–#22 (+ side-lanes #23/#24)
 * against expected dependency graph. Safe to run offline when SHAs are pinned.
 *
 * Usage:
 *   node batch1/scripts/merge-order-rehearsal-t1184u.mjs
 *   node batch1/scripts/merge-order-rehearsal-t1184u.mjs --check-git
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "../..");

/** Pinned heads (do not rewrite protected tips). #22 = release-security Phase1+2 tip. */
export const DRAFT_TIPS = [
  {
    pr: 12,
    branch: "cursor/alpine-redesign-hq-7022",
    tip: "78dc9f9174acfbc16bf096e6c3673960a8e5da77",
    base: "main",
    role: "Avatar/Alpine/Bag foundation",
  },
  {
    pr: 13,
    branch: "cursor/trip-state-fictional-t1138u-5ae0",
    tip: "1e40eab2aec8c6980919d3f86448f4336ee4126e",
    base: "cursor/alpine-redesign-hq-7022",
    role: "Trip / Day Sesh fictional",
  },
  {
    pr: 14,
    branch: "cursor/campfire-cf2-fictional-t1147u",
    tip: "ec870fe5b4ab025b3dadcfc10e78bcf517aa8736",
    base: "main",
    role: "Campfire CF-2 foundation",
  },
  {
    pr: 15,
    branch: "cursor/integration-rehearsal-t1152u",
    tip: "16b61211f4caecc28ced981952a7171fc9659454",
    base: "cursor/trip-state-fictional-t1138u-5ae0",
    role: "A1–A6 integration rehearsal",
  },
  {
    pr: 16,
    branch: "cursor/sesh-sv0-sharing-contract-t1155u",
    tip: "e737b380af51b527d91a4e0a2a8e3da084d60fc9",
    base: "cursor/campfire-cf2-fictional-t1147u",
    role: "SV-0 sharing (CLOSED — do not reopen)",
  },
  {
    pr: 17,
    branch: "cursor/release-blocker-closure-t1159u",
    tip: "5dc2c8e8bd198b4f244226b3ff18ad1dd21ba7fb",
    base: "cursor/trip-state-fictional-t1138u-5ae0",
    role: "G1–G4 + fictionalAuthz + Rider selective",
  },
  {
    pr: 18,
    branch: "cursor/avatar-identity-looks-t1169u",
    tip: "69d3dafcfbefffeb01b3f80c0e693d8b95c7d309",
    base: "cursor/release-blocker-closure-t1159u",
    role: "Avatar identity looks fix",
  },
  {
    pr: 19,
    branch: "cursor/release-candidate-t1170u-8e36",
    tip: "9c6cc96eae05c438e2a5c479e0e477034c60fdab",
    base: "cursor/avatar-identity-looks-t1169u",
    role: "RC fictional tip (authz AF-AUTH-13..15)",
  },
  {
    pr: 20,
    branch: "cursor/character-roster-v24-t1171u-27f2",
    tip: "1975363404feaf8b9f434ff0384f64794d9fad10",
    base: "cursor/release-candidate-t1170u-8e36",
    role: "Artwork roster — PROTECT (do not content-rewrite)",
  },
  {
    pr: 21,
    branch: "cursor/character-production-t1173u-e14a",
    tip: "8b4b79986637ea69330698d8363726feaa8f477f",
    base: "cursor/character-roster-v24-t1171u-27f2",
    role: "Character production — PROTECT / do not content-rewrite from authz lane",
  },
  {
    pr: 22,
    branch: "cursor/release-security-readiness-t1184u-ef28",
    tip: "7917aa69f6249b18945c0f1123a58f11bc6be56a",
    base: "cursor/release-candidate-t1170u-8e36",
    role: "Release-security readiness additive after #19 (Phase 1+2 fictional)",
  },
];

/**
 * Side-lane tips — NOT in product/authz merge chain.
 * #23 Franz artwork scaffold (main). #24 Campfire CF-3 client shell (base #17) —
 * separate agent; do not fold into authz order from this lane.
 */
export const SIDE_LANE_TIPS = [
  {
    pr: 23,
    branch: "cursor/franz-look2-modular-artwork",
    tip: "455faed3c088a840ef5cca9ed58bfe11fd1adf95",
    base: "main",
    role: "Franz Look 2 artwork scaffold (docs-only) — NOT in product merge chain",
  },
  {
    pr: 24,
    branch: "cursor/campfire-cf3-client-shell-t1190u-22f0",
    tip: "cc1f153fd1dff312da4ded7d54329399534be980",
    base: "cursor/release-blocker-closure-t1159u",
    role: "Campfire CF-3 client shell (parallel agent) — NOT in authz merge chain",
  },
];

/** Dependency-aware merge sequence (docs rehearsal — NO actual merges). */
export const MERGE_SEQUENCE = [
  { step: 1, action: "Merge #12 → main", dependsOn: [], risk: "medium" },
  { step: 2, action: "Retarget/rebase #13 onto updated main", dependsOn: [12], risk: "medium" },
  {
    step: 3,
    action: "Rebase #14 onto main (parallel lineage)",
    dependsOn: [12],
    risk: "high",
    note: "Never saw #12/#13 — expect index/barrel conflicts",
  },
  {
    step: 4,
    action: "Rebase #16 onto rebased #14 (SV-0 stays CLOSED)",
    dependsOn: [14],
    risk: "medium",
  },
  {
    step: 5,
    action: "Land A1–A6 from #15/#17 lineage (compare-don't-rebuild)",
    dependsOn: [13, 14, 16],
    risk: "high",
  },
  {
    step: 6,
    action: "Selective fold #17/#18/#19 fictionalAuthz + G1–G4 + RC (NOT wholesale)",
    dependsOn: [15, 17, 18, 19],
    risk: "high",
  },
  {
    step: 6.5,
    action: "Fold #22 release-security readiness (additive fictional authz/docs after #19)",
    dependsOn: [19, 22],
    risk: "medium",
    note: "Phase 1+2 tip 7917aa6; t1193u stacks NEW draft after #22 — still no live auth",
  },
  {
    step: 6.6,
    action: "Fold t1193u non-design progress (tests/docs/fixtures) after #22 — DRAFT only",
    dependsOn: [22],
    risk: "low",
    note: "AF-RC/JOURNEY/deny expansions + honest stack pins; zero merges; #24 untouched",
  },
  {
    step: 7,
    action: "Artwork #20 then #21 AFTER product/authz stack stable (separate lane)",
    dependsOn: [19],
    risk: "medium",
    note: "Do NOT touch #20/#21 tips from authz lane; #23/#24 are NOT in this chain",
  },
  {
    step: 8,
    action: "Production server authz wire-up (SEPARATE owner Go — never this PR)",
    dependsOn: [19, 22],
    risk: "critical",
  },
];

export const CONFLICT_HOTSPOTS = [
  "batch1/src/index.ts — barrel unification",
  "batch1/src/shared/guardResult.ts — A5 + SV-0 deny map",
  "batch1/src/campfire/cf2-index.ts — #14/#16 surface",
  "gb-phone store Screen union — hub additive only",
  "woz-bridge/index.ts — cf2Share additive; keep legacy dump",
  "greet.tsx / og.jpg — FREEZE forever",
];

export const REGRESSION_SUITES = [
  "batch1 vitest: AF-XINT, AF-AUTH, AF-G14, AF-RC, AF-JOURNEY, AF-AUTH-t1184u, AF-EXPORT, AF-P2-t1187u, AF-PROGRESS-t1193u",
  "gb-phone: typecheck + test:woz + npm test + build",
  "SHARE_MS === SESH_PENDING_TTL_MS === 20000",
  "YOUTH_CAMPFIRE_ENABLED === false",
  "assertNoDeletionJob().enabled === false",
];

export const ROLLBACK = [
  "git revert merge commit(s); restore tip SHAs from DRAFT_TIPS",
  "Never force-push to #12–#24 protected product/readiness/side-lane tips",
  "Do not fold #23/#24 into authz merge order (side-lanes)",
  "SV-0 regression → document only; do not reopen policy",
  "Authz flip-back: leave fictionalAuthz; do not enable live Better Auth",
  "Pages/deploy: hard ban — no rollback needed if never published",
];

function short(sha) {
  return sha.slice(0, 7);
}

function checkGitTips() {
  const results = [];
  for (const row of DRAFT_TIPS) {
    try {
      const remote = execSync(`git rev-parse origin/${row.branch}`, {
        cwd: REPO_ROOT,
        encoding: "utf8",
      }).trim();
      const match = remote === row.tip;
      results.push({
        pr: row.pr,
        match,
        expected: short(row.tip),
        actual: short(remote),
      });
    } catch {
      results.push({
        pr: row.pr,
        match: null,
        expected: short(row.tip),
        actual: "UNFETCHED",
      });
    }
  }
  return results;
}

function main() {
  const checkGit = process.argv.includes("--check-git");
  console.log("=== MERGE-ORDER REHEARSAL t1184u/t1187u/t1193u (NO MERGES) ===\n");
  console.log("Pinned draft tips #12–#22 (product/readiness):");
  for (const row of DRAFT_TIPS) {
    console.log(
      `  #${row.pr} ${short(row.tip)}  base=${row.base}  — ${row.role}`,
    );
  }
  console.log("\nSide-lane (NOT in product merge chain):");
  for (const row of SIDE_LANE_TIPS) {
    console.log(
      `  #${row.pr} ${short(row.tip)}  base=${row.base}  — ${row.role}`,
    );
  }
  console.log("\nDependency-aware sequence:");
  for (const s of MERGE_SEQUENCE) {
    console.log(
      `  ${s.step}. [${s.risk}] ${s.action}` +
        (s.dependsOn.length ? ` (after #${s.dependsOn.join(",#")})` : "") +
        (s.note ? `\n       note: ${s.note}` : ""),
    );
  }
  console.log("\nConflict hotspots:");
  for (const h of CONFLICT_HOTSPOTS) console.log(`  - ${h}`);
  console.log("\nRegression requirements:");
  for (const r of REGRESSION_SUITES) console.log(`  - ${r}`);
  console.log("\nRollback procedures:");
  for (const r of ROLLBACK) console.log(`  - ${r}`);

  let exit = 0;
  if (checkGit) {
    console.log("\nLive tip compare (--check-git):");
    const results = checkGitTips();
    for (const r of results) {
      const status =
        r.match === true ? "OK" : r.match === false ? "DRIFT" : "SKIP";
      if (r.match === false) exit = 1;
      console.log(
        `  #${r.pr} ${status} expected=${r.expected} actual=${r.actual}`,
      );
    }
  } else {
    console.log(
      "\n(Tip compare skipped — pass --check-git after fetching origin branches)",
    );
  }

  // Structural self-check: #22 fold before artwork; #23/#24 not merge deps
  const readiness = MERGE_SEQUENCE.find((s) => s.step === 6.5);
  const progress = MERGE_SEQUENCE.find((s) => s.step === 6.6);
  const art = MERGE_SEQUENCE.find((s) => s.step === 7);
  if (!readiness || !art || art.step <= readiness.step) {
    console.error("FAIL: artwork step must follow #22 readiness fold");
    exit = 1;
  } else {
    console.log("\nSelf-check: artwork lane ordered after #22 readiness fold — OK");
  }
  if (!progress || progress.step <= readiness.step || art.step <= progress.step) {
    console.error("FAIL: t1193u progress step must sit between #22 fold and artwork");
    exit = 1;
  } else {
    console.log("Self-check: t1193u progress ordered after #22 / before artwork — OK");
  }
  const seqMentionsSide = MERGE_SEQUENCE.some(
    (s) =>
      (s.dependsOn || []).includes(23) ||
      (s.dependsOn || []).includes(24) ||
      String(s.action).includes("#23") ||
      String(s.action).includes("#24"),
  );
  if (seqMentionsSide) {
    console.error("FAIL: #23/#24 must not appear as merge dependencies in product sequence");
    exit = 1;
  } else {
    console.log("Self-check: #23/#24 excluded from product merge dependencies — OK");
  }
  if (!SIDE_LANE_TIPS.some((t) => t.pr === 23) || !SIDE_LANE_TIPS.some((t) => t.pr === 24)) {
    console.error("FAIL: SIDE_LANE_TIPS must pin #23 and #24");
    exit = 1;
  }

  // Docs twin path presence (when run from a tip that includes t1184u docs)
  const twin = join(REPO_ROOT, "docs/release-security-t1184u/MERGE-ORDER-REHEARSAL.md");
  if (existsSync(twin)) {
    const body = readFileSync(twin, "utf8");
    if (
      !body.includes("t1184u") ||
      !body.includes("#22") ||
      !body.includes("#23") ||
      !body.includes("#24")
    ) {
      console.error("FAIL: twin MERGE-ORDER-REHEARSAL.md missing t1184u/#22/#23/#24 markers");
      exit = 1;
    } else {
      console.log("Twin docs path present — OK");
    }
  }

  console.log(exit === 0 ? "\nREHEARSAL RESULT: PASS (no merges executed)" : "\nREHEARSAL RESULT: FAIL");
  process.exit(exit);
}

const invokedDirectly =
  process.argv[1] != null &&
  (resolve(process.argv[1]) === __filename ||
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url);

if (invokedDirectly) {
  main();
}
