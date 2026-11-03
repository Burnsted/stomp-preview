# AGENT REPORT — t1184u / t1185u RELEASE-SECURITY-READINESS

**Owner:** Ted · **Batch:** STOMP MASTER HQ parallel release-readiness  
**DRAFT PR:** (filled after open) · **Do not merge · do not deploy · do not touch #21**

---

## Work implemented

1. **Server authz readiness (fictional)** — Extended `fictionalAuthz` with MediaRef, Trip Drop, Day Sesh 45d, Campfire history (G2), owner elevation (G3), personal export; erased actors denied on prepare-share; `PROD-AUTHZ-REQUIREMENTS.md` contract (not activated).  
2. **Merge-order rehearsal** — Pinned #12–#21 tips, dependency sequence, conflicts, regression, rollback in docs + `merge-order-rehearsal-t1184u.mjs` + AF-MERGE-ORDER tests. **Zero merges executed.**  
3. **Release-blocker matrix** — Single prioritized matrix in `RELEASE-BLOCKERS.md`.  
4. **Rider export + access-denial** — `riderPersonalExport.ts` + AF-EXPORT / AF-DENY allow+deny coverage (expired pass, leave, rejoin cutoff, revoke, 20s TTL).  
5. **Threat-model** — `THREAT-MODEL.md` covering authz isolation, 45d clock, Campfire repost, accept-only ownership, 20s confirm, deletion→logical revoke.

Twin docs: `docs/release-security-t1184u/`.

---

## Exact branch + commit

| Field | Value |
|---|---|
| Branch | `cursor/release-security-readiness-t1184u-ef28` |
| Base | #19 `cursor/release-candidate-t1170u-8e36` @ `9c6cc96eae05c438e2a5c479e0e477034c60fdab` |
| Tip commit | `c6e4d8c9846f299da9a276cbdd691935eb02e8b7` (feature `7252d5f`) |
| #21 tip (untouched) | `67358475dfdd9c23307f5a9d8a8b669138ca076e` |

---

## Tests passed / failed

| Suite | Result |
|---|---|
| batch1 typecheck | PASS |
| batch1 vitest | **605 passed / 8 skipped** (includes +18 new t1184u tests) |
| AF-AUTH-t1184u | 7/7 PASS |
| AF-EXPORT / AF-DENY | 8/8 PASS |
| AF-MERGE-ORDER | 3/3 PASS |
| gb-phone typecheck + typecheck:woz | PASS |
| gb-phone test:woz | **891 passed** |
| gb-phone npm test | **66 passed** |
| gb-phone build | PASS |
| Failed | **none** (local) |

CI: wait for both `pr-verify` jobs SUCCESS on new draft PR tip.

---

## Blockers ranked

1. Production server authz + identity (**Critical** — BLOCKED)  
2. G4 physical erasure / counsel (**Critical** — BLOCKED)  
3. Merge-order Go #12–#19 (**High** — rehearsed only)  
4. Android device acceptance (**High** — OPEN)  
5. Artwork #20/#21 (**Medium** — parallel; protected)  
6. Youth / payments / F1–F5 (**HELD**)  
7. Deploy / Pages (**Forbidden**)

---

## Merge-order / rollback results

- Rehearsal script: **PASS (no merges executed)**  
- Artwork lane ordered after product/authz fold  
- #21 tip SHA verified unchanged  
- Rollback: revert merges + restore pinned tip SHAs; never force-push #12–#21; SV-0 document-only; leave fictionalAuthz  

---

## Production security requirements

See `PROD-AUTHZ-REQUIREMENTS.md` + `THREAT-MODEL.md`. Headline: server SoT for Pass/Viewer/Squad/Campfire/MediaRef/share/Day Sesh/export; refuse client clocks; 20s CAS; G4 logical revoke immediate; physical wipe separate counsel track. **Nothing activated in this PR.**

---

## Decisions needing Ted approval

1. Merge-order Go for product stack #12–#19  
2. Production authz / identity Go  
3. Counsel Go for G4 physical erasure (if ever)  
4. Youth / payments (HELD)  
5. Pages / prod deploy (if ever)  
6. When to land artwork #20/#21 after product tip stable  

---

## Hard boundaries confirmed

- No merge / deploy / Pages / live auth / payments / youth / deletion jobs / physical erasure / legal-hold / live moderation  
- #21 character branch untouched  
- G1–G4 LOCKED; SV-0 closed  
- Client demo ≠ production authorization  
