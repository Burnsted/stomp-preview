# t1246u — Spot/Stash/Sesh simplify (Ted-approved)

Implements t1244u layouts 01/02/03 in the app on draft PR #90. **No merge · no deploy.**

## Surfaces

1. **Spot detail** — full-bleed hero slot, spot name, ONE `#feature` tag, **Add clip**. Founder / Keeper / last confirmed / expiry / Transfer Keeper live in the **info sheet** (`i`).
2. **Clip upload** — circle = record/pick → tag → **Post**.
3. **Sesh voice** — mic, one transcript line, **Confirm** (e.g. share with Powder Crew).

## Hero images

Ted wants licensed rider-on-feature photos later. Do **not** copy/hotlink.

- Slot: `gb-phone/src/components/stomp/spot-stash/spot-hero-slot.tsx`
- Manifest: `gb-phone/src/lib/stomp/spot-stash/hero-manifest.ts` (`featureType → imagePath, credit, license`)
- Placeholder copy: `photo slot — licensed rider photo pending`

## Screenshots

Under `docs/t1246u-simplify/screenshots/` (+ `gb-phone/screenshots/t1246u/`):

| File | What |
| --- | --- |
| `01-spot-detail-hero-390.png` | Spot primary surface |
| `02-spot-info-sheet-390.png` | Info sheet meta |
| `03-clip-upload-390.png` | Record / tag / Post |
| `04-sesh-confirm-share-390.png` | Mic + transcript + Confirm |
| `05-spot-detail-width-360.png` | 360 overlap |
| `05-spot-detail-width-430.png` | 430 overlap |

## Preserved

t1238u / t1243u logic + tests: Spot vs Stash, oneshot GPS, per-clip 7d TTL, confirm before share/archive, Form #7 header, single bottom-right Hey Sesh FAB.
