# INTEGRATION-ROLLBACK — minimal safe integration + rollback (t1170u)

**DRAFT / DO NOT MERGE.** Protected tips #12–#16 must stay byte-identical until owner Go.

---

## Minimal safe integration sequence (when owner Go)

1. Merge **#12** → `main`  
2. Retarget/rebase **#13** onto updated `main`  
3. Rebase **#14** onto `main` (parallel today)  
4. Rebase **#16** onto rebased #14 — **SV-0 stays closed; do not reopen**  
5. Land **A1–A6** (+ A5 SV-0 deny map) from #15 / #17 lineage onto Trip+#14 stack  
6. **Selectively** fold #17 deltas (Rider selective + `fictionalAuthz` + cf2-share + AF-AUTH/JOURNEY/G14) — compare-don’t-rebuild  
7. Fold **#18** identity patch (looks ≠ names) + **t1170u** RC tests/docs/authz helpers  
8. Only then: production server authz wire-up (**separate** Go — see PROD-SECURITY-BLOCKERS)

Do **not** wholesale-merge #17 or this RC tip into main.

---

## Preserve on every step

- STOMPER-before-main (`greet` default)  
- Home / five tabs  
- Crew Invite  
- Branding / `og.jpg`  
- Day Sesh ≠ Campfire delete (`campfireEffects: []`)  
- `SHARE_MS` / `SESH_PENDING_TTL_MS` = 20_000  
- Client Rider = DEMO ONLY  
- Youth flags false  

---

## Hotspot mitigation

| Hotspot | Mitigation |
|---|---|
| `batch1/src/index.ts` | Prefer unified barrel (`trips`+`daysesh`+`campfireCf2`+`shared`) |
| `guardResult.ts` | Keep SV-0 deny keys |
| `cf2-index.ts` | Rebase #16 after #14 |
| Screen union `"hub"` | Cherry-pick additive only |
| `woz-bridge` | Keep legacy campfire dump; additive cf2Share |
| `greet.tsx` / `og.jpg` | **Never touch** |

---

## Rollback

| Step | Rollback | Regression |
|---|---|---|
| Any main merge | `git revert` merge commit; restore tip SHAs from HEADS-CI | batch1 vitest AF-RC / AF-XINT / AF-SV / AF-AUTH / AF-JOURNEY / AF-G14 / AF-RC-JOURNEY |
| gb-phone fold | revert file set; greet/og sha check | `npm test` + `test:woz` + social.test |
| SV-0 | do not reopen; if regression → **document only** | sesh-sv0-* + AF-RC-06 |
| Authz | leave fictional module; do not flip live auth | AF-AUTH-01..15 |
| Avatar identity | revert #18 / t1170u RC-AV only | avatar-foundation t1169u + RC-AV |
| This RC branch | delete DRAFT PR / abandon branch — no main impact | — |

Protected tip recovery: re-fetch SHAs in `HEADS-CI.md`; **refuse force-push** to #12–#16.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Merging #17 / RC wholesale into main | High | Forbidden — selective fold |
| #14 rebase conflicts with #13 trips | Medium | #15 index as merge oracle |
| Treating Rider Hub as authz | Critical | Banner + PROD-SECURITY-BLOCKERS |
| Accidental Pages deploy | Critical | Hard ban |
| Youth enable during merge | High | Leave flags false |
| Reopening SV-0 / G1–G4 without regression | High | Forbidden unless real regression found |
