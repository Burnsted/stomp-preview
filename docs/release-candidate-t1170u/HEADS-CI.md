# HEADS-CI — verified PR heads + CI (t1170u)

**Verified live:** 2026-11-03 · Ted Burns owner batch t1170u  
**Candidate branch:** `cursor/release-candidate-t1170u-8e36` (from #18 tip)  
**DRAFT only — do not merge to main · do not publish Pages · do not force-push protected tips.**

---

## Protected / draft tips (byte-identical — do not rewrite)

| PR | Branch | Tip SHA | Base | CI (both jobs) |
|---|---|---|---|---|
| #12 | `cursor/alpine-redesign-hq-7022` | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | `main` | **SUCCESS** |
| #13 | `cursor/trip-state-fictional-t1138u-5ae0` | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | #12 | **SUCCESS** |
| #14 | `cursor/campfire-cf2-fictional-t1147u` | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | `main` | **SUCCESS** |
| #15 | `cursor/integration-rehearsal-t1152u` | `16b61211f4caecc28ced981952a7171fc9659454` | #13 | **SUCCESS** |
| #16 | `cursor/sesh-sv0-sharing-contract-t1155u` | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | #14 | **SUCCESS** |
| #17 | `cursor/release-blocker-closure-t1159u` | `5dc2c8e8bd198b4f244226b3ff18ad1dd21ba7fb` | #13 | **SUCCESS** |
| #18 | `cursor/avatar-identity-looks-t1169u` | `69d3dafcfbefffeb01b3f80c0e693d8b95c7d309` | #17 | **SUCCESS** |

Both CI jobs = `batch1 typecheck + test` · `gb-phone typecheck + woz tests + build` (`pr-verify`).

---

## Ancestry vs MERGE-PLAN (live)

```
main
 ├─ #12 Avatar/Alpine/Bag
 │    └─ #13 Trip/DaySesh
 │         ├─ #15 rehearsal (A1–A6 + cherry #14)
 │         └─ #17 throwaway (closure + Rider + G1–G4 fictional)
 │              └─ #18 avatar identity (looks ≠ names)  ← RC base
 └─ #14 Campfire CF-2
      └─ #16 SV-0
```

| Tip | Ancestor of #18 / RC? | Notes |
|---|---|---|
| #12 / #13 / #15 / #17 | **Yes** | Linear stack into #18 |
| #14 / #16 | **No (git ancestry)** | CF-2 + SV-0 content already **selectively folded** into #15/#17 lineage (barrel `trips`+`daysesh`+`campfireCf2`+`shared`; `SESH_PENDING_TTL_MS=20000`; sesh-sv0 tests present). Parallel tips remain protected for eventual owner-Go rebase onto main. |

---

## Candidate tip

| Item | Value |
|---|---|
| Branch | `cursor/release-candidate-t1170u-8e36` |
| Parent | #18 @ `69d3daf` |
| Purpose | Isolated fictional-data RC + security/artwork/test docs — **no main merge** |
| Tip (pushed) | `36448c45280bcc719fd5bde6b1bc9aa193dd8e7a` |
| DRAFT PR | https://github.com/Burnsted/stomp-preview/pull/19 |
| CI on tip | **BOTH SUCCESS** (pr-verify) |

Protected #12–#16 tips were **not** modified.
