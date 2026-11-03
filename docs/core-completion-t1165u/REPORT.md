# REPORT — STOMP Master HQ core completion (t1165u + t1166u G1–G4)

**Status:** DRAFT / DO NOT MERGE · throwaway #17 only  
**PR:** https://github.com/Burnsted/stomp-preview/pull/17  
**Branch:** `cursor/release-blocker-closure-t1159u`  
**HEAD:**   
**No merge · no Pages · no payments · no youth · no live auth · no storage deletion jobs · SV-0 closed.**

**Authority (t1166u):** Ted owner-approved G1–G4 LOCKED Nov 2, 2026 — fictional-data + docs + tests only.

---

## 1. Work actually completed

### Workstream A — integration glue (bounded) · t1165u

- Preserved STOMPER-first onboarding (`store` default/`rehydrate` → `greet`; greet.tsx untouched).
- Rider Hub remains additive (`hub` screen); Avatar Foundation / greet not overwritten.
- Trip Drop ↔ Day Sesh kept separate (`daySeshAsTrip` still absent).
- Squad/Campfire: 1 Campfire/Squad; Day Sesh close → `campfireEffects: []`.
- SV-0 single-Squad share: `SHARE_MS`/`SESH_PENDING_TTL_MS` = 20_000; explicit confirm + recheck.
- Pass / Viewer / expiry via AF-AUTH + AF-JOURNEY (no core rewrite).
- `riderHubBridge.ts` + additive `woz-bridge/cf2-share.ts`.

### Workstream B — server authz readiness · t1165u

- `fictionalAuthz.ts` deny-by-default + AF-AUTH-01..12.
- `SERVER-AUTHZ-PACKET.md` — prepared, **NOT activated**.

### Workstream C — merge/RC docs · t1165u

- `MERGE-PLAN.md`, `RELEASE-BLOCKERS.md`, `TEST-MATRIX.md`.

### Workstream D — testing · t1165u

- AF-JOURNEY + full batch1 / gb-phone / social / AF-RC / AF-XINT green.

### Workstream A–D (t1166u) — G1–G4 policy lock

| Letter | Deliverable |
|---|---|
| **A** | Canonical contract map — `G1-G4-POLICY-LOCK.md` vs Trip Drop / Day Sesh / Campfire / Squad / account lifecycle + #12–#16 |
| **B** | Fictional policy behavior — `lifecycle-g1g4.ts` + world/retention/erasure/share/policy wiring |
| **C** | AF-G14-01..14 covering Ted's 14 cases; prior DEADLINE_UNSPECIFIED tests updated to G1 |
| **D** | `GB-G1-G4-CONTRACT.md` UI contract; `ERASURE-LIFECYCLE.md`; SERVER-AUTHZ-PACKET not executed |

---

## 2. Verified PR heads and CI

| PR | Tip SHA | CI |
|---|---|---|
| #12 | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | BOTH SUCCESS |
| #13 | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | BOTH SUCCESS |
| #14 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | BOTH SUCCESS |
| #15 | `16b61211f4caecc28ced981952a7171fc9659454` | BOTH SUCCESS |
| #16 | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | BOTH SUCCESS |
| #17 | _(this tip)_ | Await BOTH SUCCESS after push |

Protected #12–#16 **not edited**.

---

## 3. Integrated functionality vs fictional-only functionality

| Capability | Label |
|---|---|
| trips / daysesh / campfireCf2 / shared A1–A6 + SV-0 | **IMPLEMENTED (fictional)** |
| AF-RC / AF-XINT / AF-SV / AF-AUTH / AF-JOURNEY / **AF-G14** | **IMPLEMENTED (fictional)** |
| G1–G4 lifecycle (`lifecycle-g1g4.ts`) | **IMPLEMENTED (fictional)** — product locked; no prod jobs |
| Rider Hub social.* + rider-hub UI | **PREVIEW DEMO ONLY** |
| Production server authz / live accounts / storage wipe | **NOT IMPLEMENTED / NOT ACTIVATED** |
| Youth / payments / Pages | **HELD / FORBIDDEN** |

---

## 4. Tests and failures

| Suite | Result |
|---|---|
| batch1 vitest | See tip push (target: all green; AF-G14 14/14) |
| AF-G14-01..14 | **14/14 PASS** (new) |
| AF-AUTH / AF-JOURNEY / AF-RC / AF-XINT / AF-SV | PASS — SV-0 not reopened |
| Prior DEADLINE_UNSPECIFIED cases | Updated → `day_sesh_45d_max` (AF-CF-61/75, AF-XINT-08, AF-RC-09) |
| gb-phone tsc + typecheck:woz / vitest woz / social | Run on tip |

---

## 5. G1–G4 contract mapping

See `G1-G4-POLICY-LOCK.md` for verbatim decisions + tip/#12–#16 map.

| Policy | Fictional surface | Preserved / delta |
|---|---|---|
| **G1** Day Sesh media ≤45d after official end; Campfire share never extends clock | `daySeshMediaDeadline` / `computeMediaExpiry` / `assertShareDoesNotExtendMediaClock` / close freeze | **Delta:** replaced `DEADLINE_UNSPECIFIED` |
| **G1** Campfire text / standalone media / Trip Drop | Unchanged constants (12 mo / 90d / trip ≤45d) | **Preserved** |
| **G2** Leave / rejoin prospective | `leaveSquad` · `approveSquadRejoin` · `acceptInvite` append · `historyCutoffAt` · `canViewerSeeMessage` | **Locked** (was unresolved AF-CF-35) |
| **G3** Nominate+accept / unresolved-owner | `nominateSquadOwner` · `acceptSquadOwnerTransfer` · `departSquadOwner` · `canElevateToOwner` | **Locked** (was unresolved AF-CF-36/59) |
| **G4** Logical revoke; erasure docs only | `revokeAccountAccess` · `eraseStomper` · `ERASURE-LIFECYCLE.md` | Physical wipe **false**; legal confirm still unresolved |
| STOMPER-first / Home / five-tab / Sesh / SV-0 | Untouched contracts | **Preserved** |

---

## 6. AF-G14 — Ted's 14 cases (results)

| # | Case | Result |
|---|---|---|
| 01 | Day Sesh media window / flag locked | PASS |
| 02 | 45d max after official Day Sesh end | PASS |
| 03 | Campfire link/share no clock reset | PASS |
| 04 | Expired / revoked access deny on recheck | PASS |
| 05 | Leave terminates membership access | PASS |
| 06 | Rejoin requires new approved membership | PASS |
| 07 | Rejoin no history auto-expose; clocks unchanged | PASS |
| 08 | Ownership transfer only after accept | PASS |
| 09 | Unresolved owner — no auto-elevate | PASS |
| 10 | Unresolved — members + moderation intact | PASS |
| 11 | Deletion denies new auth actions (logical) | PASS |
| 12 | Other members' content not erased | PASS |
| 13 | Trip Drop + Campfire retention green | PASS |
| 14 | SV-0 / authz recheck / Squad isolation green | PASS |

---

## 7. Permission / lifecycle issues noted

1. **Client demo ≠ server authority** — Rider Hub / GB UI must not be treated as security.
2. **Unresolved-owner** retains last-known `ownerId` for audit only; `canElevateToOwner` denies auto-elevation.
3. **`acceptInvite` always appends** a membership row (G2) — callers must not assume revive-in-place.
4. **Day Sesh media before official end** may have `expiresAt: null` with flag `day_sesh_45d_max`; trip-linked bound may still apply as a tighter known bound without inventing a DS clock extension.
5. **Physical erasure / backup / third-party** schedules intentionally undocumented as executable — see §8.

---

## 8. Remaining legal / security blockers

1. Production server authz (critical) — packet ready, not activated  
2. Identity / age / guardian providers  
3. **G4 physical storage erasure schedules + legal exceptions** — tech+legal review before live  
4. Legal preservation infra (type-only; disabled)  
5. Live moderation provider (stub only)  
6. Youth Campfire / payments / Pages — HELD / FORBIDDEN  
7. Merge-order Go (#12→#13→rebase #14/#16) + selective #17 fold  
8. F1–F5 still HELD (unchanged)

---

## 9. Release integration impact

- G1–G4 land **only** on throwaway #17 tip as fictional + docs + tests.
- No protected-branch edits; no merges; no Pages/deploy.
- When selective fold is eventually authorized: prefer adapters + `lifecycle-g1g4` / retention / AF-G14; do **not** wholesale-replace #12–#16 trees.
- Production deletion jobs / live authz remain **out of band** even after merge Go.

---

## 10. Essential owner approvals (grouped)

| Group | Approvals |
|---|---|
| **Merge / lineage** | Merge-order Go · Accept selective #17 fold into release lineage |
| **Security** | Production authz Go · Identity provider Go |
| **Policy** | G1–G4 product text **LOCKED** (this tip). Live storage erasure / legal G4 activation still needs counsel Go. F1–F5 HELD. Youth · payments HELD |
| **Deploy** | Explicit Pages/prod Go (if ever) |

---

## 11. Server-authorization readiness

- Fictional envelope: **ready** (`fictionalAuthz` + AF-AUTH + G1–G4 recheck helpers).
- Production: **packet only** — `SERVER-AUTHZ-PACKET.md` + `ERASURE-LIFECYCLE.md` prepared, **not executed**.

---

## Artifacts

- `G1-G4-POLICY-LOCK.md`  
- `GB-G1-G4-CONTRACT.md`  
- `ERASURE-LIFECYCLE.md`  
- `MERGE-PLAN.md`  
- `SERVER-AUTHZ-PACKET.md`  
- `RELEASE-BLOCKERS.md`  
- `TEST-MATRIX.md`  
