# RELEASE-BLOCKERS matrix — t1184u / t1187u / t1193u honesty

**Prioritized single matrix** for release readiness while artwork continues on #20/#21/#23 and Campfire shell on #24.  
**DRAFT ONLY / DO NOT MERGE.** No Pages publish. No live auth activation. No merge Go language.

Legend: **DONE** = completed/tested fictionally · **ART** = missing artwork/plates · **AND** = Android acceptance · **AUTHZ** = real server authz · **GATE** = F1–F5 / product · **G4L** = G4 legal erasure · **Y/P** = youth/payments · **MERGE** = merge/deploy approvals · **HYG** = hygiene/headers · **UI** = client shell

---

## Current stack heads (honest pin — #12–#24)

| PR | Tip (short) | Lane | Notes |
|---:|---|---|---|
| #12 | `78dc9f9` | product | Avatar/Alpine/Bag |
| #13 | `1e40eab` | product | Trip / Day Sesh |
| #14 | `ec870fe` | product | Campfire CF-2 |
| #15 | `16b6121` | product | A1–A6 rehearsal |
| #16 | `e737b38` | product | SV-0 **CLOSED** |
| #17 | `5dc2c8e` | product | G1–G4 + fictionalAuthz |
| #18 | `69d3daf` | product | Avatar identity looks |
| #19 | `9c6cc96` | product | RC fictional tip |
| #20 | `1975363` | artwork | Roster — **PROTECT** |
| #21 | `8b4b799` | artwork | Character production — **PROTECT** (advanced since Phase 2 docs) |
| #22 | `7917aa6` | authz | Release-security Phase 1+2 — base for t1193u |
| #23 | `455faed` | side-lane | Franz Look 2 — **NOT in authz chain** |
| #24 | `cc1f153` | side-lane | Campfire CF-3 shell — **parallel agent · NOT in authz chain** |

t1193u stacks a **new** DRAFT after #22. Tips of #12–#24 are **not** content-rewritten by this lane.

---

## Prioritized matrix

| Pri | Blocker | Category | State | Notes |
|---:|---|---|---|---|
| 1 | Server authz SoT (Pass/Viewer/Squad/Campfire/share/Day Sesh/MediaRef) | AUTHZ | **BLOCKED** | Fictional + Phase 2 audit/session/rate + t1193u matrix expansions; prod **NOT activated** |
| 2 | Real STOMPER ↔ account identity provider | AUTHZ | **BLOCKED** | Design only |
| 3 | Confirmed delete → logical revoke + **live** session/token kill | AUTHZ / G4L | **BLOCKED** | Fictional sessionKill **DONE** (AF-P2); Better Auth **not** wired |
| 4 | Media clocks refuse client extension (G1 45d + Trip Drop) | AUTHZ | **BLOCKED** | Fictional PASS; prod clocks required |
| 5 | Quick Share CAS + 20s TTL + abuse limits (prod edge) | AUTHZ | **BLOCKED** | Fictional rate-limit stubs DONE; prod WAF missing |
| 6 | Lawful physical erasure / CDN / backup wipe | G4L | **BLOCKED** | Docs only · counsel · `physicalWipeGuaranteed=false` |
| 7 | Legal-hold / live moderation | G4L | **BLOCKED** | Do not activate |
| 8 | Merge-order Go #12→…→#19→**#22**→(t1193u) | MERGE | **BLOCKED** | Rehearsal updated; **zero merges · no Go claimed** |
| 9 | Pages / production deploy + CSP/headers apply | MERGE / HYG | **BLOCKED** | Headers checklist READY; **not published** |
| 10 | Dependency bumps (`zod`/`seroval`/`better-auth` audit) | HYG | **OPEN** | Documented in SECRETS-DEPENDENCY-HYGIENE; no force upgrades |
| 11 | Youth Campfire | Y/P | **HELD** | Flag false |
| 12 | Payments | Y/P | **HELD** | |
| 13 | F1–F5 | GATE | **HELD** | |
| 14 | Android device security smoke | AND | **OPEN** | Checklist published; **do not claim PASS** |
| 15 | Character/plate artwork (#20/#21) | ART | **IN PROGRESS** | #21 tip advanced to `8b4b799` — still **PROTECT** |
| 16 | #23 Franz Look 2 scaffold | ART | **SIDE-LANE** | Based on main — **NOT in authz merge chain** |
| 17 | #24 Campfire CF-3 client shell | UI | **SIDE-LANE** | Parallel agent on #17 — **NOT owned by t1193u** |
| 18 | Home / five-tab / Crew Invite freeze | GATE | **DONE** | Preserved (t1193u untouched) |
| 19 | G1–G4 + SV-0 locks | GATE | **DONE** | Do not reopen |
| 20 | Phase 1 fictional authz + export + merge rehearsal | DONE | **DONE** | |
| 21 | Phase 2 audit · session kill · rate stubs · headers/hygiene/Android docs | DONE | **DONE** | #22 tip |
| 22 | t1193u AF-RC/JOURNEY/deny expansions + export rehearsal fixtures | DONE | **DONE** | Fictional only · this DRAFT |

---

## Owner approvals still required (Ted)

1. Merge-order Go (#12–#19 + selective #22 / later t1193u) — **not claimed here**  
2. Production authz / identity / live session revoke  
3. Counsel G4 physical erasure  
4. Dependency bump Go (audit findings)  
5. CSP/headers hosting Go + Pages (if ever)  
6. Youth / payments  
7. Device smoke scheduling  
8. Artwork lane timing (#20/#21; #23 stays side-lane)  
9. Campfire shell (#24) fold timing — separate from authz lane  
