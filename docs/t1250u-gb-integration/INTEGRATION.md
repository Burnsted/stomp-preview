# t1250u — GB Spot/Stash handoff integration

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO production GPS · NO live media deletion**

**Issue (authoritative):** [#87](https://github.com/Burnsted/stomp-preview/issues/87)

**Starting ref:** `40bf081` (tip of draft PR [#90](https://github.com/Burnsted/stomp-preview/pull/90) — social-first Home + t1238u/t1243u/t1246u/t1249u Spot/Stash)

**Handoff package:** `uploads/STOMP-SPOT-STASH-HANDOFF.zip` → archived under `docs/t1250u-gb-integration/gb-reference/`

## Inspect summary

GB delivered a standalone `TrailSpots` component (`spots.tsx`) plus mounts in a simplified `home-map-card.tsx` and `map.tsx` (`ClipMap`). The current branch already has a fuller stack:

| Surface | Current (`40bf081`) | GB handoff |
| --- | --- | --- |
| Map tab entry | `TrailMapScreen` → `SpotsPanel` | `HomeMapCard` / `ClipMap` → `TrailSpots` |
| Domain / ACL / TTL | `batch1/src/spot-stash/*` + client store | Local React state in `spots.tsx` |
| UI generation | t1246u simplify + t1249u glitch fixes | Earlier GB demo chrome |
| Social crews | Fiction crews in client store | `useSocial` squads |

## Keep / drop decisions

| Asset / behavior | Decision | Rationale |
| --- | --- | --- |
| `spots.tsx` (`TrailSpots`) wholesale | **DROP** (do not land as UI replacement) | Would overwrite t1246u simplified Spot/clip/Sesh UI and t1249u hit-target / sheet fixes |
| `home-map-card.tsx` GB rewrite | **DROP** | Social-first Home + official-map card already locked; Map-tab Trails is the Spot entry |
| `map.tsx` / `ClipMap` TrailSpots mount | **DROP** | ClipMap is not the Map tab; Trails (`screen=map`) already mounts Spots |
| TrailSpots **entry under Map tab** | **KEEP** (semantic) | Preserved as `SpotsPanel` with `data-trail-spots="map-tab-entry"` on Trails |
| Public Spot vs private Stash lists | **KEEP** (already present) | `discoverPublicSpots` / `listVisibleStashes` + panel lists |
| One-shot pin capture | **KEEP** (already present) | `capturePinOnce` / mock GPS; no rolling buffer |
| Spot Keeper controls | **KEEP** (already present) | Rename, status, archive confirm, transfer |
| Crew selection | **KEEP** (already present) | Stash create crew select + ACL revoke |
| Sesh interactions via existing FAB | **KEEP** (already present) | Voice demo + session-mic; no second avatar |
| Explicit confirm before share | **KEEP + harden** | Voice confirm retained; repository now refuses `confirmed:false` |
| Independent 7-day clip TTL | **KEEP** (already present) | `retention.ts`; trip cannot extend |
| Expired media unreachable | **ADD** | Signed-URL-style `media-access.ts` + repository `accessMedia` |
| Crew auth in data/service layer | **ADD** | `repository.ts` `getPin` / `listStashes` refuse non-members on direct query |
| Deletion architecture (design only) | **ADD / expand** | `DELETION-ARCHITECTURE.md` (purge worker, CDN, backups) — no live job |
| GB screenshots 1–7 | **KEEP as reference** | `gb-reference/*.png` — not product UI source of truth |
| `HANDOFF.txt` | **KEEP as reference** | Archived beside screenshots |
| `greet.tsx` / CrewLink | **UNCHANGED** | Protected; not touched |
| Form #7 S menu, five-tab nav, STOMPER, single Sesh FAB, Trip Drops | **UNCHANGED** | Regression covered |

## What t1250u landed

1. `batch1/src/spot-stash/repository.ts` — API boundary; crew ACL on direct get; share requires confirm.
2. `batch1/src/spot-stash/media-access.ts` — mint/resolve signed preview URLs; expired → `expired_unreachable`.
3. Client store uses repository for confirmed share + export/media access.
4. Docs: this file, `DELETION-ARCHITECTURE.md`, `OWNER-REPORT.md`.
5. Tests: `batch1/tests/spot-stash-t1250u.test.ts`, `gb-phone/tests/woz/spot-stash-t1250u.test.tsx`.
6. Playwright shots @ 360/390/430 + a11y smoke → `docs/t1250u-gb-integration/screenshots/`.

## Functional vs simulated

| Capability | Status |
| --- | --- |
| Public / private pin lists, Keeper, crew ACL, one-shot GPS, 7d TTL, confirm-share, export-before-expiry | **Functional** in fictional preview (in-memory) |
| Signed media URL mint/resolve / repository refusal | **Functional** prototype logic (deterministic preview signatures) |
| Live GPS upload, mic always-on, CDN purge worker, backup eraser, network share | **Simulated / design only — OFF** |

## Remaining backend requirements (not in this PR)

- Real authN/authZ + crew membership service
- Object storage + CDN signed URLs with clock-skew-safe expiry
- Purge worker + CDN invalidation + backup rotation jobs (see DELETION-ARCHITECTURE)
- Push/email expiry notices
- Hardware GPS / speech permission measurement

## Owner approval required before

- Merge to `main` / Pages / family playtest deploy
- Enabling live GPS coordinate upload
- Enabling live microphone capture
- Enabling any physical media deletion / purge worker
