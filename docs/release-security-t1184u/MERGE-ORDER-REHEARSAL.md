# MERGE-ORDER-REHEARSAL — t1184u / t1187u

**STATUS:** Docs + validation script only. **NO actual merges. NO protected-branch rebases that merge. NO deploy.**

Script: `batch1/scripts/merge-order-rehearsal-t1184u.mjs`  
Test: `batch1/tests/af-merge-order-rehearsal-t1184u.test.ts`

Protect draft tips **#12–#22** from content rewrites on character/artwork lanes.  
**#23** is a **side-lane** artwork scaffold — **NOT in product merge chain**.

---

## 1. Pinned heads (t1187u Phase 2)

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
| #22 | *(advances on this readiness tip)* | #19 | **Release-security readiness** (additive after #19) |

### Side-lane (NOT in product merge chain)

| PR | Tip SHA | Base | Role |
|---|---|---|---|
| #23 | `455faed3c088a840ef5cca9ed58bfe11fd1adf95` | `main` | Franz Look 2 artwork scaffold (docs-only) — **do not fold into authz merge order** |

Dependency sketch:

```
main
 ├─ #12 Avatar/Alpine/Bag
 │    └─ #13 Trip/DaySesh
 │         ├─ #15 A1–A6 rehearsal
 │         └─ #17 G1–G4 + authz → #18 → #19 RC → #22 release-security
 │                                          └─ (#20 → #21 artwork lane)
 ├─ #14 Campfire CF-2 → #16 SV-0 (CLOSED)
 └─ #23 Franz Look 2 scaffold  ← SIDE-LANE / based on main / NOT in authz chain
```

---

## 2. Dependency-aware sequence (rehearsal only)

1. Merge **#12** → `main`  
2. Retarget/rebase **#13** onto updated `main`  
3. Rebase **#14** onto `main`  
4. Rebase **#16** onto rebased #14 — **SV-0 stays closed**  
5. Land A1–A6 from #15 / #17 lineage  
6. Selective fold #17→#19  
6.5. Fold **#22** release-security readiness (Phase 1+2 fictional) after #19  
7. Artwork **#20 then #21** after product/authz stack stable — **never rewrite from #22**  
8. Production server authz — **separate Ted Go**

**#23:** keep isolated; optional later artwork fold **outside** authz sequence.

---

## 3. Conflict hotspots

Unchanged from Phase 1, plus: do not let #23 Franz scaffold collide with #20/#21 plate paths or #22 authz docs.

---

## 4. Regression requirements

- batch1: AF-XINT · AF-AUTH · AF-G14 · AF-RC · AF-JOURNEY · AF-AUTH-t1184u · AF-EXPORT · **AF-P2-t1187u** · AF-MERGE-ORDER  
- gb-phone: typecheck · test:woz · npm test · build  
- Locks: `SHARE_MS === 20000` · youth HELD · no deletion jobs  

---

## 5. Rollback

1. `git revert` merge commit(s); restore tip SHAs from §1  
2. Never force-push #12–#22 product/readiness tips  
3. Do not fold #23 into authz order  
4. SV-0 document-only; leave fictionalAuthz (no Better Auth flip)  
5. Pages/deploy hard ban  

**Result:** rehearsal **PASS** with **zero merges executed**.
