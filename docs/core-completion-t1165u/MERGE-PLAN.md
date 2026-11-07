# MERGE-PLAN — t1165u (docs only — NO merges executed)

**DRAFT / DO NOT MERGE.** Protected tips #12–#16 must stay byte-identical until owner Go.  
This document is an executable plan only.

---

## 1. Verified heads + CI (live reconfirm)

| PR | Tip SHA | Base | CI (both jobs) |
|---|---|---|---|
| #12 | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | `main` | SUCCESS |
| #13 | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | #12 alpine | SUCCESS |
| #14 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | `main` | SUCCESS |
| #15 | `16b61211f4caecc28ced981952a7171fc9659454` | #13 | SUCCESS |
| #16 | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | #14 | SUCCESS |
| #17 | *(advances on throwaway)* | #13 | SUCCESS on prior tip; re-check after each push |

Dependency sketch:

```
main
 ├─ #12 Avatar/Alpine/Bag
 │    └─ #13 Trip/DaySesh
 │         ├─ #15 rehearsal (A1–A6 + cherry #14)
 │         └─ #17 throwaway (closure + Rider + t1165u glue)  ← DO NOT MERGE yet
 └─ #14 Campfire CF-2
      └─ #16 SV-0
```

---

## 2. Required rebases (when owner Go)

1. Merge **#12** → `main`  
2. Retarget/rebase **#13** onto updated `main` (was based on #12)  
3. Rebase **#14** onto `main` (parallel today — never saw #12/#13)  
4. Rebase **#16** onto rebased #14 (SV-0 stays closed; do not reopen)  
5. Land A1–A6 (+ A5 SV-0 deny map) from #15 / #17 lineage onto the Trip+#14 stack  
6. Selectively fold #17 throwaway deltas (Rider selective + fictionalAuthz + cf2-share + AF-AUTH/JOURNEY) via **compare-don’t-rebuild** — not wholesale tip merge  
7. Only then: server authz production wire-up (separate Go)

---

## 3. Overlapping changes / hotspots

| Hotspot | Why | Mitigation |
|---|---|---|
| `batch1/src/index.ts` | #13 vs #14 vs #15 namespace exports | Prefer #15/#17 already-unified barrel (`trips`+`daysesh`+`campfireCf2`+`shared`) |
| `batch1/src/shared/guardResult.ts` | A5 + SV-0 deny entries | Keep #17 mapping; do not drop SV-0 keys |
| `batch1/src/campfire/cf2-index.ts` | #14/#16 surface | Rebase #16 after #14; SV-0 closed |
| `gb-phone/.../store.ts` Screen union | `"hub"` additive | Cherry-pick hub only; keep alpine screens |
| `session-voice` / `session-mic` | Rider social intents | Surgical hunks only |
| `woz-bridge/index.ts` | `cf2Share` additive | Keep legacy `campfire` dump; do not replace |
| `greet.tsx` / `og.jpg` | Freeze | **Never touch** |

Avoid cherry-picking duplicated policy code — call adapters (A1–A6, fictionalAuthz).

---

## 4. Preserve on every step

- STOMPER-before-main (`greet` default)  
- Home / five tabs `HOME|MAP|MUSIC|STATS|CREW`  
- Crew Invite (`greet.tsx`)  
- Branding / `og.jpg` (branding lane)  
- Day Sesh ≠ Campfire delete (`campfireEffects: []`)  
- SHARE_MS / SESH_PENDING_TTL_MS = 20_000  
- Client Rider = DEMO ONLY  

---

## 5. Smallest safe integration sequence

1. #12 → main  
2. #13 retarget  
3. #14 rebase → #16 rebase  
4. A1–A6 (+ A5 SV-0)  
5. Rider selective + fictionalAuthz/cf2-share from #17 (adapters only)  
6. Server authz production (packet B)  
7. Integration acceptance beyond fictional  

---

## 6. Rollback + regression

| Step | Rollback | Regression suite |
|---|---|---|
| Any merge | `git revert` merge commit; restore tip SHAs | `batch1` vitest (AF-RC, AF-XINT, AF-SV, AF-AUTH, AF-JOURNEY) |
| gb-phone fold | revert file set; greet/og sha check | `npm test` + `test:woz` + social.test |
| SV-0 | do not reopen; if regression, **document only** | sesh-sv0-* + AF-RC-06 |
| Authz | leave fictional module; do not flip live auth | AF-AUTH-01..12 |

Protected tip recovery: re-fetch owner-recorded SHAs in §1; refuse force-push to #12–#16.

---

## 7. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Merging #17 wholesale into main | High | Forbidden — selective fold only |
| #14 rebase conflicts with #13 trips | Medium | Use #15 index as merge oracle |
| Treating Rider Hub as authz | Critical | Banner + SERVER-AUTHZ-PACKET |
| Accidental Pages deploy | Critical | Hard ban |
| Youth/A7 enable during merge | High | HELD; leave flag false |
