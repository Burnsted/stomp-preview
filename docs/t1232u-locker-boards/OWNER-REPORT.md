# OWNER-REPORT — t1232u Locker/Boards customization

**DRAFT ONLY. NO MERGE. NO DEPLOY. NO Pages. NO live family playtest. No payments / live auth / live youth / paid AI.**

## 1. Branch + tip SHA + draft PR + CI

| Field | Value |
|---|---|
| Branch | `cursor/t1232u-locker-boards-customization-2547` |
| Starting ref | `2d831cefc12ba0a1dead1fed189c669bd75ee6cf` (draft PR **#73** tip — Form #7 S menu + resort text branding; CI green run `42220897290`) |
| Tip SHA | *(pinned after push — see commit / PR head)* |
| Isolated | **NEW** draft PR — does **not** push onto PR #73 or PR #70. Do not merge. |
| Draft PR title | DRAFT t1232u — Locker/Boards customization (NO MERGE) |

### SHA split (documented)

This starting_ref **does not** include **t1228u FAB clearance** that landed on PR **#70** tip `1e5703f1e51230ba4192b2078aafc1c0b9513d27`.  
**Do not silently rebase onto #70** — that would drop the S-menu / resort-branding work from #73.  
Preserve S menu + resort-name switching as they exist on this tip. FAB clearance remains a later reconcile item.

### CI

Both checks must go green on the tip after push (batch1 + gb-phone). Fill live run URLs when Actions complete.

## 2. S menu verification (Batch 1)

Verified on this tip (existing `s-menu-resort-branding-t1230u` + t1232u Escape coverage):

| Check | Result |
|---|---|
| S on Welcome / Create / Vibe / ID / Home / Trails | PASS (visible) |
| Inactive until STOMPER saved (`onboardComplete` + config) | PASS |
| Returning rider with completed STOMPER → immediate menu | PASS |
| Dismiss: Back, outside tap, Escape, destination | PASS |
| Destinations reuse existing screens (Profile, Locker, Boards→Profile, Bag, Trip, Squad, Settings→Locker closest, Help→Feedback closest) | PASS |
| Five tabs + Sesh intact; no hamburger; Form #7 preserved | PASS |
| Resort names + official map links (link-only) + Trails FICTION·SAMPLE | PASS |
| Hey Session primary = bottom-right snowboarder FAB only (not mid-page pill / header chip) | PASS |

## 3. Character modular-asset matrix (Batch 2)

See [`MODULAR-ASSET-MATRIX.md`](./MODULAR-ASSET-MATRIX.md).  
Summary: 4 modular 8-of-11 prototypes (Woman 2/3, Man 1/2); 4 appearance-preview flats; 10 SOURCE MISSING omitted. Board/bindings ABSENT on all eight Franz packs; only generic `board-basic@512.webp` scaffold exists. Man 1 gloves v2 quarantined. Woman 2/3 + Man 2 v2 fills present as previously ingested.

## 4. Working STOMPER demonstration (Batch 3)

**Character: Woman 3 / `f-priya`.**

Why: Create-visible PARTIAL modular adult with genuine jacket+pants v2 fills and full 8-plate set; not OPEN (unlike Woman 2 / Man 1); not demoted to NOT_OWNER_REVIEWED (unlike Man 2). Hypothesis confirmed after disk audit.

End-to-end path (existing AvatarRenderer + Locker — not rebuilt):

1. Select Woman 3 → open Locker (character-scoped options only)
2. Change jacket: purple ↔ fuchsia TEST (and Jacket Off A-state) — **visible plate change**
3. Change pants: purple ↔ charcoal — **visible plate change**
4. Snowboard: character board ABSENT; generic `board-basic` scaffold **visually equips**; other catalog boards disabled for visual with exact missing paths
5. Save → Home / Profile / STOMPER ID show same customization; per-rider localStorage persists

## 5. Jacket / board before-and-after 390×844 screenshots

Under `docs/t1232u-locker-boards/screenshots/`, `gb-phone/screenshots/t1232u/`, and `/opt/cursor/artifacts/t1232u/`:

| File | Proof |
|---|---|
| `02-locker-woman3-jacket-purple-before-390x844.png` | Purple shell selected |
| `03-locker-woman3-jacket-fuchsia-after-390x844.png` | Fuchsia + charcoal after jacket set |
| `13-locker-avatar-jacket-purple-390x844.png` | Avatar-focused purple |
| `14-locker-avatar-jacket-fuchsia-390x844.png` | Avatar-focused fuchsia |
| `11-locker-avatar-board-none-before-390x844.png` | No board |
| `12-locker-avatar-board-basic-after-390x844.png` | Generic scaffold board under feet |
| `05-home-woman3-after-locker-persist-390x844.png` | Home matches Locker |
| `06-stomper-id-woman3-same-customization-390x844.png` | ID card matches |
| `07-profile-boards-woman3-390x844.png` / `08-…-collection-only…` | Boards collection vs visual |
| `09-home-s-menu-open-390x844.png` | S menu preserved |
| `10-locker-woman3-fuchsia-light-390x844.png` | Light theme |

## 6. Locker and Boards persistence (Batch 4)

| Behavior | Result |
|---|---|
| Jacket/pants equip updates `AvatarRenderer` immediately | PASS |
| Per-rider key `stomp-avatar-locker-rider:f-priya` holds jacket after swap | PASS |
| `board-basic` visual equip + boards collection `activeBoardId` / `visuallyEquippedItemId` | PASS |
| Collection-only board (e.g. `board-family-deck`) stays owned; avatar falls back to `board-none`; missing path reported | PASS |
| Home / Profile / ID share same layer ids | PASS |
| Multiple boards remain in collection | PASS |

## 7. Automated test results (Batch 5)

| Suite | Result |
|---|---|
| `gb-phone` `npm run typecheck` | **PASS** |
| `gb-phone` `npm run typecheck:woz` | **PASS** |
| `gb-phone` `npm run test:woz` | **1110 passed / 43 files** |
| New: `tests/woz/locker-boards-customization-t1232u.test.tsx` | **15 passed** |

**REAL-DEVICE = NONE.** Browser 390×844 Playwright only. Do not claim Android/iPhone physical PASS.

## 8. Missing Franz artwork list

- All eight packs: separated hair / helmet / goggles; **character snowboard + bindings**; independent backpack
- Woman 1 / Man 3 / Grom 1 / Grom 2: full modular plate sets (currently flats)
- Man 1: gloves v2 fill (quarantined)
- Ten SOURCE MISSING slots: entire packages
- Catalog boards beyond `board-basic`: `board-park-graphic`, `board-powder`, `board-stomp-graphic`, family demo decks — **no visual plates**

Exact missing paths surfaced in UI when disabled, e.g. `/stomper/adult/board/board-park-graphic@512.webp`.

## 9. Remaining blockers

- Character board+bindings still ABSENT — visual board is generic scaffold only (honest)
- Locked heads — no separate hair/helmet/goggles swaps
- Woman 2 / Man 1 remain OPEN · omitted from Create
- Man 2 NOT owner visual PASS
- Create-cleared = 0; Create 67% scale not implemented
- SHA split vs PR #70 FAB clearance — reconcile later without dropping S menu
- Settings / Help / Boards still closest-only destinations (documented since t1230u)
- No authorized resort logos (text fallback)

## 10. Recommendation for next batch

1. Reconcile **t1228u FAB clearance** from PR #70 onto an S-menu-preserving stack (cherry-pick / careful merge — do not drop #73).
2. If Ted clears Woman 3 visually, promote Create-cleared path for Woman 3 only.
3. Franz deliverable priority for next Locker expansion: **Woman 3 character board+bindings**, then Man 2 owner visual PASS, then Woman 1 modular unpack.
4. Keep OPEN prototypes (Woman 2 / Man 1) QA-only until Create clearance.

## Protected surfaces (untouched)

- `greet.tsx` / CrewLink
- Form #7 monochrome artwork
- Existing S menu + five-tab nav + Sesh
- Approved character artwork (no redesign)
- Create 67% scale **not** implemented
- Woman 2 / Man 1 omitted from Create; ten SOURCE MISSING omitted
