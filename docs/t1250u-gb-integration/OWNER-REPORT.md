# t1250u OWNER REPORT — GB Spot/Stash handoff integration

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO Pages · NO production GPS · NO live media deletion**

**Issue:** [#87](https://github.com/Burnsted/stomp-preview/issues/87) (authoritative)

**Branch:** `cursor/t1250u-gb-spot-stash-0f74`  
**Base:** `40bf081` (draft PR #90 tip)  
**Isolated:** new draft PR — does not push to #90 / #82

## Integration verdict

GB’s `TrailSpots` / simplified HomeMapCard / ClipMap mounts were **inspected and largely dropped as UI replacements** so newer Map, Home, STOMPER, Sesh, and t1246u/t1249u Spot UI stay intact. The Map-tab Spot entry is preserved via existing `SpotsPanel` (`data-trail-spots="map-tab-entry"`). Hardening added: repository crew ACL on direct query, signed-URL-style media access, confirm-required share at the API boundary, and written deletion architecture.

Full keep/drop table: [`INTEGRATION.md`](./INTEGRATION.md).

## Functional vs simulated

| Area | Status |
| --- | --- |
| Public Spots / private Stashes / Keeper / crew select / one-shot pin / 7d TTL / confirm-share / export-before-expiry | **Functional** (fictional in-memory preview) |
| Repository refusal for non-crew + media URL resolver | **Functional** prototype |
| Purge worker / CDN invalidation / backup eraser | **Design only** — see [`DELETION-ARCHITECTURE.md`](./DELETION-ARCHITECTURE.md) |
| Live GPS upload, always-on mic, network share, physical delete | **OFF / simulated** |

## Tests

| Suite | Result |
| --- | --- |
| `batch1` `spot-stash-t1250u` (+ prior t1238u) | pass |
| `gb-phone` `spot-stash-t1250u` (+ t1238u/t1243u/t1246u/t1249u) | pass |
| Playwright 360/390/430 + a11y smoke | see `screenshots/` + `a11y-smoke.json` |

## Screenshots

Under `docs/t1250u-gb-integration/screenshots/` (also `gb-phone/screenshots/t1250u/`):

- `01-trails-spots-list-390.png`
- `02-spot-detail-390.png`
- `03-stash-create-crew-390.png`
- `04-stash-detail-390.png`
- `05-sesh-confirm-share-390.png`
- `06-home-single-sesh-fab-390.png`
- `07-trails-spots-width-{360,390,430}.png`
- `08-spot-detail-a11y-{360,390,430}.png`
- `a11y-smoke.json`

GB reference frames (not product UI): `gb-reference/1-public-spot.png` … `7-sesh.png`.

## Protected / unchanged

- `greet.tsx` / CrewLink Invite
- Form #7 S menu, five-tab nav, social-first Home, STOMPER customization
- Single bottom-right Hey Sesh FAB
- Trip Drops attribution-only on clips

## Remaining backend requirements

Real auth + crew membership, production signed URLs, purge worker + CDN invalidation + backup rotation, expiry notifications, hardware GPS/speech measurement.

## Risks / blockers

- No real backend/storage/CDN
- Device GPS/mic permissions not measured on hardware
- Licensed rider hero photos still pending (prior slots)
- Owner approval required before merge/deploy/live GPS/live mic/live purge

## Owner approval required before

Merge · Pages · family playtest · live GPS · live mic · any physical deletion job
