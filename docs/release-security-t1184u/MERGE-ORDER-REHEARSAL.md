# MERGE-ORDER-REHEARSAL — t1184u / t1185u

**STATUS:** Docs + validation script only. **NO actual merges. NO protected-branch rebases that merge. NO deploy.**

Script: `batch1/scripts/merge-order-rehearsal-t1184u.mjs`  
Test: `batch1/tests/af-merge-order-rehearsal-t1184u.test.ts`

Protect draft tips **#12–#21** from content rewrites. t1184u stacks from **#19** tip and leaves **#21 untouched**.

---

## 1. Pinned heads (reconfirmed t1184u)

| PR | Tip SHA | Base | Role |
|---|---|---|---|
| #12 | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | `main` | Avatar/Alpine/Bag |
| #13 | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | #12 | Trip / Day Sesh |
| #14 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | `main` | Campfire CF-2 |
| #15 | `16b61211f4caecc28ced981952a7171fc9659454` | #13 | A1–A6 rehearsal |
| #16 | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | #14 | SV-0 (**CLOSED**) |
| #17 | `5dc2c8e8bd198b4f244226b3ff18ad1dd21ba7fb` | #13 | G1–G4 + fictionalAuthz |
| #18 | `69d3dafcfbefffeb01b3f80c0e693d8b95c7d309` | #17 | Avatar identity looks |
| #19 | `9c6cc96eae05c438e2a5c479e0e477034c60fdab` | #18 | RC fictional tip |
| #20 | `1975363404feaf8b9f434ff0384f64794d9fad10` | #19 | Roster artwork — **PROTECT** |
| #21 | `67358475dfdd9c23307f5a9d8a8b669138ca076e` | #20 | Character production — **UNTOUCHED** |

Dependency sketch:

```
main
 ├─ #12 Avatar/Alpine/Bag
 │    └─ #13 Trip/DaySesh
 │         ├─ #15 A1–A6 rehearsal
 │         └─ #17 G1–G4 + authz → #18 → #19 RC → (#20 → #21 artwork lane)
 └─ #14 Campfire CF-2
      └─ #16 SV-0 (CLOSED)

t1184u release-security ── branches FROM #19 tip (additive readiness; not onto #21)
```

---

## 2. Dependency-aware sequence (rehearsal only)

1. Merge **#12** → `main`  
2. Retarget/rebase **#13** onto updated `main`  
3. Rebase **#14** onto `main` (parallel today — expect barrel conflicts)  
4. Rebase **#16** onto rebased #14 — **SV-0 stays closed; do not reopen**  
5. Land A1–A6 (+ A5 SV-0 deny map) from #15 / #17 lineage — compare-don't-rebuild  
6. Selective fold #17→#19 fictionalAuthz + G1–G4 + RC + **t1184u readiness** — not wholesale tip merge  
7. Artwork **#20 then #21** only after product/authz stack stable (separate lane)  
8. Production server authz wire-up — **separate Ted Go** (never this PR)

---

## 3. Conflict hotspots

| Hotspot | Why | Mitigation |
|---|---|---|
| `batch1/src/index.ts` | #13 vs #14 vs #15 barrels | Prefer unified #15/#17 barrel |
| `guardResult.ts` | A5 + SV-0 keys | Keep SV-0 deny map |
| `cf2-index.ts` | #14/#16 | Rebase #16 after #14 |
| gb-phone Screen union | `"hub"` | Additive only |
| `woz-bridge` | cf2Share | Keep legacy dump |
| `greet.tsx` / `og.jpg` | Branding | **Never touch** |
| Character/plate artwork | #20/#21 | **Do not rewrite from readiness PRs** |

---

## 4. Regression requirements

- batch1: AF-XINT · AF-AUTH · AF-G14 · AF-RC · AF-JOURNEY · **AF-AUTH-t1184u** · **AF-EXPORT** · AF-MERGE-ORDER  
- gb-phone: typecheck · test:woz · npm test · build  
- Locks: `SHARE_MS === 20000` · `YOUTH_CAMPFIRE_ENABLED === false` · `assertNoDeletionJob().enabled === false`  
- Preserve Home / five-tab / Crew Invite / Multi-Squad STOMPER / 1 Campfire per Squad  

---

## 5. Rollback procedures

1. `git revert` merge commit(s); restore tip SHAs from §1  
2. **Never** force-push to #12–#21 protected tips  
3. SV-0 regression → document only; do not reopen policy  
4. Authz: leave `fictionalAuthz`; do not flip live Better Auth  
5. Pages/deploy: hard ban — if never published, nothing to roll back  

---

## 6. Exact merge dependencies (summary)

| Land | Requires first | Blocks |
|---|---|---|
| #13 | #12 | #15, #17 lineage |
| #16 | #14 | SV-0 consumers |
| A1–A6 fold | #13 + #14 + #16 | Selective #17–#19 |
| #20/#21 artwork | Stable #19 product tip | Character production acceptance |
| Prod authz | Owner Go after #19 fold | Live release |

**t1184u result:** rehearsal script + this doc + AF-MERGE-ORDER test = PASS with **zero merges executed**.
