# RELEASE-BLOCKERS matrix — t1184u / t1185u

**Prioritized single matrix** for release readiness while artwork continues on #20/#21.  
**DRAFT / DO NOT MERGE.** No Pages publish. No live auth activation.

Legend: **DONE** = completed/tested fictionally · **ART** = missing artwork/plates · **AND** = Android acceptance · **AUTHZ** = real server authz · **GATE** = F1–F5 / product · **G4L** = G4 legal erasure · **Y/P** = youth/payments · **MERGE** = merge/deploy approvals

---

## Prioritized matrix

| Pri | Blocker | Category | State | Notes |
|---:|---|---|---|---|
| 1 | Server authz SoT (Pass/Viewer/Squad/Campfire/share/Day Sesh/MediaRef) | AUTHZ | **BLOCKED** | Fictional AF-AUTH + t1184u strengthened; prod **NOT activated** — Ted Go |
| 2 | Real STOMPER ↔ account identity provider | AUTHZ | **BLOCKED** | Design only |
| 3 | Confirmed delete → immediate logical revoke + session kill (prod) | AUTHZ / G4L | **BLOCKED** | Fictional G4 PASS; live sessions **not** wired |
| 4 | Media clocks refuse client extension (G1 45d + Trip Drop) | AUTHZ | **BLOCKED** | Fictional PASS; prod clocks required |
| 5 | Quick Share CAS + 20s TTL server-side | AUTHZ | **BLOCKED** | SV-0 fictional CLOSED; prod CAS missing |
| 6 | Lawful physical erasure / CDN / backup wipe schedules | G4L | **BLOCKED** | Docs only · counsel required · `physicalWipeGuaranteed=false` |
| 7 | Legal-hold / live moderation infra | G4L | **BLOCKED** | Stub only — **do not activate** this batch |
| 8 | Merge-order Go #12→#13→#14/#16→fold #17–#19 | MERGE | **BLOCKED** | Rehearsal documented; **no merges** |
| 9 | Pages / production deploy approval | MERGE | **BLOCKED** | Hard ban this batch |
| 10 | Youth Campfire enrollment | Y/P | **HELD** | `YOUTH_CAMPFIRE_ENABLED=false` |
| 11 | Payments | Y/P | **HELD** | Do not enable |
| 12 | F1–F5 product gates | GATE | **HELD** | Unchanged |
| 13 | Android device acceptance (phones / a11y) | AND | **OPEN** | Not covered by fictional unit tests |
| 14 | Character / plate artwork masters (#20/#21) | ART | **IN PROGRESS elsewhere** | **#21 untouched** by t1184u |
| 15 | Home / five-tab / Crew Invite freeze regressions | GATE | **DONE** (preserve) | Not rewritten this PR |
| 16 | G1–G4 LOCKED fictional policy + AF-G14 | GATE | **DONE** | Do not reopen SV-0 / G1–G4 |
| 17 | Fictional authz AF-AUTH-01..15 + t1184u MediaRef/TripDrop/G2–G4 | DONE | **DONE** | Tests on this tip |
| 18 | Fictional Rider personal JSON export + denial matrix | DONE | **DONE** | AF-EXPORT / AF-DENY |
| 19 | Merge-order rehearsal script + docs | DONE | **DONE** | No merges executed |
| 20 | Threat-model + prod authz requirements docs | DONE | **DONE** | This packet |

---

## Completed / tested (fictional)

- AF-AUTH-01..15 + **AF-AUTH-t1184u** (MediaRef, Trip Drop, Day Sesh 45d, G2 history, G3 accept-only, G4 revoke, Pass/Viewer/share)  
- **AF-EXPORT-01..03** + **AF-DENY-01..05** (export allow/deny, leave, rejoin cutoff, revoke, 20s TTL)  
- AF-G14 (14/14 policy lock) — inherited from #17  
- AF-XINT / AF-RC / AF-JOURNEY — inherited; do not regress  
- Merge-order rehearsal self-check  

## Missing artwork / plates

- Roster v2.4 + character production continue on **#20 / #21** only  
- Readiness PR must not rewrite character/plate paths  

## Android acceptance

- Unit/fictional suites ≠ device acceptance  
- Still required before release: physical Android smoke, a11y, offline  

## Real auth / server authz

- Packet ready (`PROD-AUTHZ-REQUIREMENTS.md`) — **activation BLOCKED pending Ted**  

## F1–F5 + product gates

- **HELD** — not opened by t1184u  

## G4 legal erasure

- Logical revoke **DONE** fictionally  
- Physical erasure / legal hold **BLOCKED** (counsel + owner)  

## Youth / payments

- **HELD**  

## Merge / deploy approvals

- Merge-order rehearsal ready; **execution BLOCKED**  
- Deploy / Pages **FORBIDDEN**  

---

## Owner approvals required (Ted)

1. Merge-order Go for #12–#19 product stack  
2. Production authz / identity Go  
3. Counsel Go for G4 physical erasure (if ever)  
4. Youth / payments (separate; currently HELD)  
5. Pages / prod deploy (if ever)  
6. Artwork merge lane (#20/#21) after product tip stable  
