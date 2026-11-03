# RELEASE-BLOCKERS matrix — t1184u / t1187u Phase 2

**Prioritized single matrix** for release readiness while artwork continues on #20/#21/#23.  
**DRAFT PR #22 / DO NOT MERGE.** No Pages publish. No live auth activation.

Legend: **DONE** = completed/tested fictionally · **ART** = missing artwork/plates · **AND** = Android acceptance · **AUTHZ** = real server authz · **GATE** = F1–F5 / product · **G4L** = G4 legal erasure · **Y/P** = youth/payments · **MERGE** = merge/deploy approvals · **HYG** = hygiene/headers

---

## Prioritized matrix

| Pri | Blocker | Category | State | Notes |
|---:|---|---|---|---|
| 1 | Server authz SoT (Pass/Viewer/Squad/Campfire/share/Day Sesh/MediaRef) | AUTHZ | **BLOCKED** | Fictional + Phase 2 audit/session/rate stubs; prod **NOT activated** |
| 2 | Real STOMPER ↔ account identity provider | AUTHZ | **BLOCKED** | Design only |
| 3 | Confirmed delete → logical revoke + **live** session/token kill | AUTHZ / G4L | **BLOCKED** | Fictional sessionKill **DONE** (AF-P2); Better Auth **not** wired |
| 4 | Media clocks refuse client extension (G1 45d + Trip Drop) | AUTHZ | **BLOCKED** | Fictional PASS; prod clocks required |
| 5 | Quick Share CAS + 20s TTL + abuse limits (prod edge) | AUTHZ | **BLOCKED** | Fictional rate-limit stubs DONE; prod WAF missing |
| 6 | Lawful physical erasure / CDN / backup wipe | G4L | **BLOCKED** | Docs only · counsel · `physicalWipeGuaranteed=false` |
| 7 | Legal-hold / live moderation | G4L | **BLOCKED** | Do not activate |
| 8 | Merge-order Go #12→…→#19→**#22** | MERGE | **BLOCKED** | Rehearsal updated; **zero merges** |
| 9 | Pages / production deploy + CSP/headers apply | MERGE / HYG | **BLOCKED** | Headers checklist READY; **not published** |
| 10 | Dependency bumps (`zod`/`seroval`/`better-auth` audit) | HYG | **OPEN** | Documented in SECRETS-DEPENDENCY-HYGIENE; no force upgrades |
| 11 | Youth Campfire | Y/P | **HELD** | Flag false |
| 12 | Payments | Y/P | **HELD** | |
| 13 | F1–F5 | GATE | **HELD** | |
| 14 | Android device security smoke | AND | **OPEN** | Checklist published; **do not claim PASS** |
| 15 | Character/plate artwork (#20/#21) | ART | **IN PROGRESS** | **#21 untouched** |
| 16 | #23 Franz Look 2 scaffold | ART | **SIDE-LANE** | Based on main — **NOT in authz merge chain** |
| 17 | Home / five-tab / Crew Invite freeze | GATE | **DONE** | Preserved |
| 18 | G1–G4 + SV-0 locks | GATE | **DONE** | Do not reopen |
| 19 | Phase 1 fictional authz + export + merge rehearsal | DONE | **DONE** | |
| 20 | Phase 2 audit · session kill · rate stubs · headers/hygiene/Android docs | DONE | **DONE** | This tip |

---

## Owner approvals still required (Ted)

1. Merge-order Go (#12–#19 + selective #22)  
2. Production authz / identity / live session revoke  
3. Counsel G4 physical erasure  
4. Dependency bump Go (audit findings)  
5. CSP/headers hosting Go + Pages (if ever)  
6. Youth / payments  
7. Device smoke scheduling  
8. Artwork lane timing (#20/#21; #23 stays side-lane until owner says otherwise)  
