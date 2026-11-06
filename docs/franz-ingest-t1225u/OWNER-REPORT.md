# OWNER-REPORT — t1225u STOMPER ingest + onboard + #57–#60 reconcile

**DRAFT ONLY. NO MERGE. NO DEPLOY. NO Pages.**

## 1. Branch and SHA

| Field | Value |
|---|---|
| Branch | `cursor/stomper-ingest-t1225u-bfa0` |
| Base / starting_ref | `9339cc6b30df13beb445c90682d17536d8471db0` (draft PR #60 tip) |
| Tip SHA | *(pin after t1228u push)* |
| Stack | New isolated draft PR #70 from #60 tip — **does not push onto #60** |
| Draft PR | https://github.com/Burnsted/stomp-preview/pull/70 |
| Follow-up | **t1228u** Hey Session FAB Trails clearance (same draft PR) |

## 2. Franz asset package / checksums used

Canonical Drive folder: https://drive.google.com/drive/folders/1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH  
Delivery: **PARTIAL** — 0 finished / 8 partial / 10 missing approved artwork (Franz’s own report).

| Slot | Drive id | sha256 |
|---|---|---|
| Woman 1 | `104LZSYNxBxL5xio1t1IPy6ByNrTX_jmT` | `8c24cafa76b5491f648d4d423ad5df9837c1d61a95642e6580c2332f80a78b52` |
| Woman 2 | `1KDNdQPCtGoM21YKH8kOETZig9k-jB35e` | `c006bcc25b8370defab935a8702b10b5579991d1ba99c1bbf8d509dd6081d5dd` |
| Woman 3 | `1ZJ7D-Hr4Bz2w7l0FDUBcQZCfsrR8Qd_F` | `b8d9fee95a9d12234bf178d43914cb86fcf6ef9716b51f4c21caf118d8330a6d` |
| Man 1 / Rider 1 | `1VJDNXJUm9E9vxysVjWKweC77pyq4gLiF` | `5105bcea04ab2b27eb0708e3aaa207b5d17ba1b8c72e1300416db654b93d534e` |
| Man 2 / Look 4 | `10eeLVvxYQDleh3ffAMKbkF3vopn1LkzM` | `7f11f205db0b673f5918fbae7cd7d8161471d19b75b10fa74c0269dc7f6aaf04` |
| Man 3 | `1AKwkWLoVrcovi0xkiH1q0qmeuRmKv_fW` | `2ba7e982c9fad9dd6926cf57ce34b5d6206fb65dec1278bbe58f66ec7ae576c3` |
| Grom 1 | `1Mr84yrqSSAOjg9AznKTxembXRJ3mxrGK` | `563d711bb648e703c40591545a743e9ab53464502889ef58ca42942ec1ea1e5a` |
| Grom 2 | `1BsDJlrAB-MjaQf2T603opdcM1sHxmW0s` | `f65affe08999558ed07e885df860a8a52d081e1927cb9be0f4dc4f734161943a` |
| Audit proofs | `14pnmhq17Hx22VYcTPRlMgsaKUJOEdgGH` | `c9d12f2814738cf107367d899c3ce9a7881ea02b5124f2b7a20ad664f5b0104e` |

Matrix / report ids: `STOMP_ROSTER-MATRIX_2026-11-05_v2`, `STOMP_DELIVERY-REPORT_2026-11-05_v1`, `STOMP_KNOWN-DEFECTS_2026-11-05_v1`, `STOMP_FINAL-UPLOAD-VERIFICATION_2026-11-05_v1`.

### Franz QA t228u v2 alpha fills (promoted on top of 2026-11-05 repairs)

| Layer | Runtime path | Notes |
|---|---|---|
| Woman-2 pants_mint | `pants-look2-mint@512.webp` | ALPHA-FILL-v2 |
| Woman-3 jacket_purple | `jacket-look3-purple@512.webp` | ALPHA-FILL-v2 |
| Woman-3 pants_purple | `pants-look3-purple@512.webp` | ALPHA-FILL-v2 |
| Man-2 jacket_orange | `jacket-look4-orange@512.webp` | ALPHA-FILL-v2 · **NOT owner visual PASS** |
| Man-1 gloves | — | **QUARANTINED** (hole touches two opaque glove islands) — **not ingested** |

Provenance: `docs/franz-ingest-t1225u/alpha-fill-v2/`, `alpha-fill-v2-receipt.json`, `WOZ-RENDER-NOTES.md`, `REPAIRS.json`.

## 3. Completed roster matrix (18 slots)

| Audit id | Slot | starterId | Ingest | Artwork | Create ship |
|---|---|---|---|---|---|
| adult-f-01 | Woman 1 | `f-nova` | YES | SOURCE_APPEARANCE_PREVIEW_ONLY | **PARTIAL · not Create-cleared** (on Create) |
| adult-f-02 | Woman 2 | `f-hana` | YES | REGISTERED_VISUAL_PROTOTYPE_ONLY (+ v2 pants fill) | **OPEN prototype · QA only · omitted from Create** |
| adult-f-03 | Woman 3 | `f-priya` | YES | REGISTERED_VISUAL_PROTOTYPE_ONLY (+ v2 jacket/pants fills) | **PARTIAL · not Create-cleared** (on Create) |
| adult-m-01 | Man 1 / Rider 1 | `m-samir` | YES | REGISTERED_VISUAL_PROTOTYPE_ONLY (restored Rider 1) | **OPEN prototype · QA only · omitted from Create** |
| adult-m-02 | Man 2 / Look 4 | `m-devon` | YES | REGISTERED_VISUAL_PROTOTYPE_ONLY · **NOT owner visual PASS** · white = **FIT TEST ≠ Man 3** | **PARTIAL · not Create-cleared** (on Create) |
| adult-m-03 | Man 3 | `m-leo` | YES | SOURCE_APPEARANCE_PREVIEW_ONLY | **PARTIAL · not Create-cleared** (on Create) |
| grom-m-01 | Grom 1 | `g-milo` | YES | SOURCE_APPEARANCE_PREVIEW_ONLY · fictional | **PARTIAL · not Create-cleared** (on Create) |
| grom-f-01 | Grom 2 | `g-aria` | YES | SOURCE_APPEARANCE_PREVIEW_ONLY · fictional | **PARTIAL · not Create-cleared** (on Create) |
| adult-f-04..06 | — | `f-mira` `f-jade` `f-elena` | NO | **SOURCE MISSING** | **Omitted from Create** |
| adult-m-04..06 | — | `m-kai` `m-owen` `m-jonas` | NO | **SOURCE MISSING** | **Omitted from Create** |
| grom-f-02..03 | — | `g-zoe` `g-nina` | NO | **SOURCE MISSING** | **Omitted from Create** |
| grom-m-02..03 | — | `g-reed` `g-theo` | NO | **SOURCE MISSING** | **Omitted from Create** |

**Counts remain 0 visually complete / 8 partial / 10 SOURCE MISSING.** **Create-cleared = 0.** No invented art. No Woz character. Form #7 untouched.

### Create first-ship lock (DESIGN TEAM)

See `CREATE-FIRST-SHIP.md`. No isolated-cutout repair file present — do not invent one. Create omits the ten SOURCE MISSING slots and OPEN prototypes (Woman 2 / Man 1). PARTIAL six appear with honest labels only.

### SCALE-SPEC (document only — not shipped Create composition)

Franz study target **67% drawn height** (~**565 px** on 390×844; range 65–70% = 548–591 px), uniform scale on registered 1024 composite, stand-line ~25–35% from bottom. **Wait for Ted Create-eligible clearance** before implementing Create display scale (`CREATE_DISPLAY_SCALE_TARGET.status = DOCUMENTED_WAIT_TED_CREATE_ELIGIBLE`). Alpine Summit (`env-alpine-summit-390x844`) Ted-review only — do not invent other environments. Face/hair research only — no photo processing.

## 4. Before/after character screenshots

Fresh post-ingest 390×844 A/B/C (browser viewport ≠ Android PASS):

- Modular: `docs/franz-ingest-t1225u/screenshots/Man1_{A,B,C}@390x844.png`, `Woman2_*`, `Woman3_*`, `Man2_*`
- Appearance previews (white/black/magenta/mountain): `Woman1_appearance-*`, `Man3_appearance-*`, `Grom1_appearance-*`, `Grom2_appearance-*`
- Heroes also under `/opt/cursor/artifacts/t1225u-stomper-ingest/heroes/`

**Jacket-off (A):** omits jacket plate; flat dark torso = provisional underbody ART + dark-UI washout — **not** a jacket file-load failure (`WOZ-RENDER-NOTES.md`).  
**Man 2 C white:** labeled **FIT TEST** — must not map to Man 3.

## 5. Full onboarding screenshots

`onboard-01-welcome` → `02-starter-roster` (Create first-ship: PARTIAL only; OPEN + missing omitted) → `03-look-woman3` → `04-vibe` → `05-personalize` → `06-id-reveal` → `07-stomper-id` → `08-meet-sesh` → `09-trip-choice` → `10-home-with-stomper` → `11-home-fab` → `12-trails-fab-clear`.

Flow: Form #7 welcome → STOMPER selection/customization → personalize → STOMPER ID → Meet Sesh → Trip Drop / Explore Solo → Home with selected STOMPER. Partial drafts resume; completed profiles skip welcome; Reset Demo → welcome. **STOMPER-first** (never Home/greet as first-visit default). `greet.tsx` / CrewLink preserved.

### t1228u — Hey Session FAB clearance (Ted Continue)

**Primary control gate:** Hey Session / Yo Session primary = **only** the little snowboarder FAB bottom-right — never a mid-page pill / header chip. Key surfaces keep voice prompt + Type instead.

| Proof (390×844) | Path |
|---|---|
| Trails **BEFORE** (overlap) | `docs/franz-ingest-t1225u/screenshots/t1228u/t1228u-trails-fab-BEFORE.png` |
| Trails **AFTER** (clear) | `docs/franz-ingest-t1225u/screenshots/t1228u/t1228u-trails-fab-clear.png` |
| Home FAB clear | `…/t1228u-home-fab-clear.png` |
| Music FAB clear | `…/t1228u-other-fab-clear.png` |

**Fix:** raise FAB bottom offset to `12.75rem` (caption above mark); Trails `pb-[13.5rem]` + drop tall map-card min-height; playlist FAB raised left of snowboarder; Trails voice prompt restores Type instead. HOME MOUNTAIN / FICTION·SAMPLE / Create roster locks unchanged.

## 6. Automated test results (local)

| Suite | Result |
|---|---|
| `gb-phone` `npm run typecheck` | **PASS** |
| `gb-phone` `npm run test:woz` | **1082 passed / 42 files** |
| `batch1` `npm test` | **608 passed / 8 skipped / 37 files** |

CI both jobs: *(pin run URL after t1228u push green)*.

## 7. Real-device test status

**REAL-DEVICE = NONE / NOT A PHYSICAL PASS.**  
Browser CSS viewport simulation (390×844 Playwright) only. Do not claim Android/iOS physical acceptance.

## 8. Remaining defects

From Franz `KNOWN-DEFECTS.md` (still apply) + this ingest:

- Locked-head composites: no independent hair/helmet/goggles/board/bindings/backpack — **ABSENT**, not invented.
- Jacket-off underbodies remain provisional constructed apparel — not approved anatomy.
- Man 1: locked-head tan chin/collar sliver; hard sleeve crop; residual gray; **glove v2 fill quarantined**.
- Woman 2 / Woman 3 / Man 2: residual head/edge artifacts; Man 2 **NOT owner visual PASS**.
- Woman 1 / Man 3 / Grom 1 / Grom 2: appearance-preview only — no modular swaps.
- Ten SOURCE MISSING slots — **omitted from Create** (no broken tiles).
- Woman 2 / Man 1 OPEN prototypes — QA art only; **not Create-screen characters**.
- Create scale 67% — documented; **not** shipped pending Ted Create-eligible clearance.
- No isolated-cutout repair file — none invented.
- A-state flat torsos: ART + dark-UI (Franz QA) — keep jacket-off = omit jacket plate.
- Possible Man 1 pants fringe/halo on dark chrome — recheck on magenta after owner review (`WOZ-RENDER-NOTES.md`).

## 9. Proposed isolated Family Preview update (DO NOT DEPLOY)

| Item | Plan |
|---|---|
| Live Family Playtest today | https://burnsted.github.io/stomp-family-playtest/ pinned to draft PR #56 tip `460a3427337c30d9b1dd6e3fc916606fdfbc1065` (host-meta `4a4c48d`) |
| Production preview | https://burnsted.github.io/stomp-preview/ — **do not touch** |
| Proposed next Family Preview | Isolated Pages target from **this draft tip only** (after both CI green + Ted visual OK), e.g. `stomp-family-playtest-t1225u` or temporary PR-pages — **not** overwrite live family pin |
| Contents if approved later | STOMPER ingest + onboard + #57–#60 reconcile (Trails fiction conditions, Home stomper poses, Hey Session FAB lift, HOME MOUNTAIN) |
| Explicit non-actions | NO merge · NO deploy this turn · NO live auth/payments/youth · `LIVE_CONDITIONS_ENABLED` stays off |

## Workstream notes

- **A:** Rider 1 restored from Man 1 package; eight packages + four v2 fills ingested into `gb-phone/public/stomper/`; ten slots unavailable.
- **B:** STOMPER-first onboard + Create first-ship lock (omit OPEN + SOURCE MISSING; PARTIAL labeled not Create-cleared); appearance-preview looks skip fake clothing controls.
- **C:** #57–#60 decisions retained; **t1228u** Hey Session FAB clearance vs Trails official-map CTA + player chrome + tabs (`12.75rem` bottom offset).
- **D:** Fresh / partial / reset / missing-art paths exercised in automated + browser screenshots.
- **t1228u remaining:** Playlist layers FAB still shares the corner — kept left of snowboarder; further playlist cluster polish out of scope. Create 67% scale still wait-Ted.

## Integrity

- No payments, live auth, live youth/social, paid APIs, scrape, or LIVE conditions.
- Grom 1/2 fictional appearance previews only; `gromFlowEnabled` remains false.
- Form #7 B&W / CrewLink / greet.tsx unchanged.
