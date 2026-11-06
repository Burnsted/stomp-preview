# OWNER-REPORT — t1233u Riding styles + Stomper N names

**DRAFT ONLY. NO MERGE. NO DEPLOY. NO Pages. NO live family playtest. No payments / live auth / live youth / paid AI.**

## 1. Branch + tip SHA + draft PR + CI

| Field | Value |
|---|---|
| Branch | `cursor/t1233u-styles-names-387b` |
| Starting ref | `f1f05f500aa4ac985079d7c9a66548bf7fd9b724` (draft PR **#75** tip — t1232u Woman 3 Locker/Boards; green CI on `e54ed91`, then docs-pin commits to this tip) |
| Tip SHA | `76e09a351d2e03fbc7ba36050687bbbdec24a7c3` (live green CI head) |
| Feature tip | `d42e42273b72a5340ec0ce7e316227dfa5379ee1` (styles + names) |
| Isolated | **NEW** draft PR — does **not** push onto PR #75, #73, or #70. Do not merge. |
| Draft PR | https://github.com/Burnsted/stomp-preview/pull/77 — *DRAFT t1233u — Riding styles + Stomper N names (NO MERGE)* |

### SHA split (documented)

This starting_ref **does not** include **t1228u FAB clearance** (PR **#70** tip `1e5703f`). **Do not silently rebase onto #70.**

### CI (both checks)

**GREEN** on tip `76e09a351d2e03fbc7ba36050687bbbdec24a7c3` — [run 42227378440](https://github.com/Burnsted/stomp-preview/actions/runs/42227378440)

| Check | Result | Duration | Job |
|---|---|---|---|
| batch1 typecheck + test | **PASS** | 30s | [127924189792](https://github.com/Burnsted/stomp-preview/actions/runs/42227378440/job/127924189792) |
| gb-phone typecheck + woz tests + build | **PASS** | 1m27s | [127924189416](https://github.com/Burnsted/stomp-preview/actions/runs/42227378440/job/127924189416) |

Prior greens: [42227161350](https://github.com/Burnsted/stomp-preview/actions/runs/42227161350) on `289f486`; [42226840710](https://github.com/Burnsted/stomp-preview/actions/runs/42226840710) on feature tip `d42e422`.

## 2. Riding styles after change

Locker / Create vibe chips (order preserved):

1. **Park & Street** (existing — covers park/terrain; no separate Terrain chip)
2. **Mountain & Freeride** (existing)
3. **Backcountry** (new)
4. **Groomers** (new)
5. **Beginner** (new)

Copy preserved: **“Mixing equipment across styles is allowed.”**  
Style remains preference/filter/label — does **not** hide Woman 3 jacket/pants plates or invent Franz artwork.

## 3. Naming before → after

| Before (leaked / short) | After (public) |
|---|---|
| PriyaDemo | **Stomper Woman Three** |
| Nova / Woman 1 | **Stomper Woman One** |
| Hana / Woman 2 | **Stomper Woman Two** |
| Samir / Man 1 | **Stomper Man One** |
| Devon / Man 2 | **Stomper Man Two** |
| Leo / Man 3 | **Stomper Man Three** |
| Milo / Grom 1 | **Stomper Grom One** |
| Aria / Grom 2 | **Stomper Grom Two** |

Central map: `gb-phone/src/lib/stomp/avatar/identity.ts` (`STARTER_PUBLIC_LABELS` + `resolvePublicDisplayName`).  
Internal ids (`f-priya`, `m-samir`, …) unchanged. Create still omits OPEN Woman Two / Man One and ten SOURCE MISSING.

## 4. Screenshots (390×844)

Under `docs/t1233u-styles-names/screenshots/`, `gb-phone/screenshots/t1233u/`, `/opt/cursor/artifacts/t1233u/`:

| File | Proof |
|---|---|
| `01-home-stomper-woman-three-not-priyademo-390x844.png` | Home welcome = Stomper Woman Three (seeded PriyaDemo) |
| `02-locker-five-styles-and-stomper-woman-three-390x844.png` | Locker name + five style chips + mix copy |
| `03-locker-beginner-style-selected-390x844.png` | Beginner selectable |
| `04-stomper-id-stomper-woman-three-390x844.png` | STOMPER ID name |
| `05-create-tiles-stomper-labels-no-given-names-390x844.png` | Create tiles Stomper N only |
| `06-create-vibe-five-style-chips-390x844.png` | Create vibe five styles |

**REAL-DEVICE = NONE.**

## 5. Preserve checks

| Check | Result |
|---|---|
| Form #7 logo | preserved |
| S menu + five-tab nav + Sesh | preserved |
| greet.tsx / CrewLink | **UNTOUCHED** |
| Woman 3 Locker customization (t1232u) | preserved |
| Hey Session = bottom-right FAB only | preserved |
| Create-cleared = 0; Woman 2 / Man 1 omitted | preserved |
| No payments / live auth / live youth / paid AI | preserved |

## 6. Automated tests

| Suite | Result |
|---|---|
| `gb-phone` `npm run typecheck` | PASS |
| `gb-phone` `npm run typecheck:woz` | PASS |
| `gb-phone` `npm run test:woz` | **1117 passed** |
| `batch1` `npm test` | **608 passed** (8 skipped) |
