# MERGE-ORDER-REHEARSAL — t1184u / t1187u / t1193u honesty

**STATUS:** Docs + validation script only. **NO actual merges. NO protected-branch rebases that merge. NO deploy.**

Script: `batch1/scripts/merge-order-rehearsal-t1184u.mjs`  
Test: `batch1/tests/af-merge-order-rehearsal-t1184u.test.ts`

Protect draft tips **#12–#22** from content rewrites on character/artwork lanes.  
**#23** / **#24** are **side-lanes** — **NOT in product/authz merge chain**.

---

## 1. Pinned heads (t1193u honesty pass)

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
| #21 | `8b4b79986637ea69330698d8363726feaa8f477f` | #20 | Character production — **PROTECT** |
| #22 | `7917aa69f6249b18945c0f1123a58f11bc6be56a` | #19 | **Release-security readiness** (Phase 1+2) |

### Side-lanes (NOT in product merge chain)

| PR | Tip SHA | Base | Role |
|---|---|---|---|
| #23 | `455faed3c088a840ef5cca9ed58bfe11fd1adf95` | `main` | Franz Look 2 artwork scaffold — **do not fold into authz** |
| #24 | `cc1f153fd1dff312da4ded7d54329399534be980` | #17 | Campfire CF-3 client shell (parallel agent) — **do not fold into authz** |

### Additive after #22 (this progress lane)

| Lane | Branch pattern | Role |
|---|---|---|
| t1193u | `cursor/stomp-progress-t1193u-*` | Non-design tests/docs/fixtures stacked on #22 tip — **DRAFT only · no merge Go language** |

Dependency sketch:

```
main
 ├─ #12 Avatar/Alpine/Bag
 │    └─ #13 Trip/DaySesh
 │         ├─ #15 A1–A6 rehearsal
 │         └─ #17 G1–G4 + authz → #18 → #19 RC → #22 release-security → (t1193u DRAFT)
 │                                          └─ (#20 → #21 artwork lane)
 ├─ #14 Campfire CF-2 → #16 SV-0 (CLOSED)
 ├─ #23 Franz Look 2 scaffold  ← SIDE-LANE / based on main
 └─ #24 Campfire CF-3 shell    ← SIDE-LANE / base #17 / parallel agent
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
6.6. Fold **t1193u** non-design progress (tests/docs) after #22 — still DRAFT  
7. Artwork **#20 then #21** after product/authz stack stable — **never rewrite from authz lane**  
8. Production server authz — **separate Ted Go**

**#23 / #24:** keep isolated; optional later fold **outside** authz sequence. Campfire depth remains the #24 agent.

---

## 3. Conflict hotspots

Unchanged from Phase 1, plus: do not let #23 Franz scaffold collide with #20/#21 plate paths or #22/#t1193u authz docs; do not edit #24 Campfire shell from this lane.

---

## 4. Regression requirements

- batch1: AF-XINT · AF-AUTH · AF-G14 · AF-RC · AF-JOURNEY · AF-AUTH-t1184u · AF-EXPORT · **AF-P2-t1187u** · **AF-PROGRESS-t1193u** · AF-MERGE-ORDER  
- gb-phone: typecheck · test:woz · npm test · build  
- Locks: `SHARE_MS === 20000` · youth HELD · no deletion jobs  
- Home / five-tab / Crew Invite: **untouched**

---

## 5. Rollback

1. `git revert` merge commit(s); restore tip SHAs from §1  
2. Never force-push #12–#24 product/readiness/side-lane tips  
3. Do not fold #23/#24 into authz order  
4. SV-0 document-only; leave fictionalAuthz (no Better Auth flip)  
5. Pages/deploy hard ban  

**Result:** rehearsal **PASS** with **zero merges executed**. No merge Go claimed.
