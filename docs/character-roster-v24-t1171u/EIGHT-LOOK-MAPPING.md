# EIGHT-LOOK-MAPPING — Roster v2.4 (t1171u)

**OWNER LOCK.** Character-design phase CLOSED. Remap/alias existing Avatar Foundation starter IDs only — do not invent conflicting IDs. Starter `.label` (Nova/Mira/Kai/…) remain appearance-template tags, never silent `displayName` (t1169u).

**Source of truth (code):** `gb-phone/src/lib/stomp/avatar/roster-v24.ts`  
**Visual authority:** Final Roster v2.4 composite (owner-approved). Text lock below binds IDs even if the PNG is not on disk.

## Exact mapping (Adult Look 1–6 + Grom Boy/Girl)

| Owner look | UI ordinal | Technical `starterId` | Silhouette | Presenting | Preview-only |
|---|---|---|---|---|---|
| Adult Look 1 — Athletic male, tan/black jacket, subtle smile | Look **1 of 6** | `m-samir` | `athletic` | male | no |
| Adult Look 2 — Brunette female, mint-green jacket | Look **2 of 6** | `f-hana` | `athletic` | female | no |
| Adult Look 3 — Blonde female, fuller/rounder, purple/white | Look **3 of 6** | `f-priya` | `solid` | female | no |
| Adult Look 4 — Black male, beard, orange jacket | Look **4 of 6** | `m-devon` | `lean` | male | no |
| Adult Look 5 — Filipina/Latina, pink jacket, black beanie, Meta Oakley-style glasses (no bun through beanie) | Look **5 of 6** | `f-nova` | `athletic` | female | no |
| Adult Look 6 — Young East Asian/Japanese male, all-white jacket | Look **6 of 6** | `m-leo` | `compact` | male | no |
| Grom Boy — ~10yo, blue jacket | Look **1 of 2** | `g-milo` | `compact` | male | **yes** |
| Grom Girl — ~6–9yo, yellow jacket | Look **2 of 2** | `g-aria` | `compact` | female | **yes** |

## Compatibility (do not break)

| Catalog | Count | Role |
|---|---|---|
| `ADULT_STARTERS` | **12** | Full AF catalog remains; includes 6 approved + 6 reserve |
| `GROM_STARTERS` | **6** | Full AF catalog remains; 2 approved preview + 4 reserve |
| Approved adult IDs | 6 | `m-samir`, `f-hana`, `f-priya`, `m-devon`, `f-nova`, `m-leo` |
| Approved grom IDs | 2 | `g-milo`, `g-aria` |
| Reserve adults (no v2.4 art required) | 6 | `f-mira`, `f-jade`, `f-elena`, `m-kai`, `m-owen`, `m-jonas` |

Stored `AvatarConfig.starterId` values for any of the 12+6 IDs continue to resolve via `starterById`. Artwork plates ship first for the eight approved IDs; SVG fallback covers the rest.

## UI ordinal rules

- Adult approved roster UI copy: `Look N of 6` via `lookOrdinalLabel` / `rosterLookOrdinalLabel`.
- Grom preview UI copy: `Look N of 2` (enrollment still blocked by `gromFlowEnabled=false`).
- Never show starter `.label` as the rider name.
- Full onboard grid may still list all 12 adults for AF compatibility; approved art + GB handoff target the eight mapped IDs above.

## Why these IDs (alias rationale)

Prefer existing slots whose silhouette / presenting match the owner lock so when modular plates land there is **no unexplained face/body proportion jump** relative to the starter’s silhouette scale in `AvatarRenderer`.
