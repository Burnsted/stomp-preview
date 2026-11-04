# t1205u — Functional A/B/C + regression summary

**Status:** `REGISTERED_VISUAL_PROTOTYPE_ONLY`  
**Android:** NOT RUN  
**acceptanceEligible:** false (all modular prototypes)

## Automated tests

| Suite | Result |
|---|---|
| `multi-rider-t1205u.test.tsx` | PASS |
| Look2 finishing / plates / registration | PASS (Woman 2 preserved) |
| plate-ingest / plate-assembly / roster-v24 | PASS (updated for prototype-ingest-ready) |
| Full `npm run test:woz` | **973 passed / 31 files** |

### CI pin (tip `5701a1809997820386200e09bfb63d26f1e81928`)

| Job | Result |
|---|---|
| `batch1 typecheck + test` | **SUCCESS** |
| `gb-phone typecheck + woz tests + build` | **SUCCESS** |
| Run | [41874457949](https://github.com/Burnsted/stomp-preview/actions/runs/41874457949) — conclusion **success** |

CI green ≠ owner visual PASS ≠ Android PASS. **NO MERGE.**

## A/B/C AvatarRenderer (plates mode)

| Rider | A | B | C | Notes |
|---|---|---|---|---|
| Man 1 | PASS | PASS (tan/black) | PASS (orange/charcoal TEST) | Unique body-look1-male; locked head |
| Woman 2 | PASS | PASS (mint) | PASS (ink) | Look2 corrections preserved |
| Woman 3 | PASS | PASS (purple) | PASS (fuchsia/charcoal TEST) | Unique body-look3-solid |
| Man 2 | PASS framework | PASS (orange/charcoal) | PASS (white TEST) | **NOT owner-visually-reviewed** |

All: backpack OFF, board OFF, `data-acceptance-eligible=false`, `data-prototype-only=true`.

## Multi-rider Locker isolation

PASS — `stomp-avatar-locker-rider:{starterId}` + in-memory `riderConfigs`. Switching Man 1 ↔ Woman 3 does not overwrite the other rider’s jacket/pants/displayName.

## Fail-closed

- Missing required prototype URL → matrix status `missing-plates`
- Separated hair/helmet/goggles/board/backpack → ABSENT (not invented)
- Look2 mint Android gate → still fail-closed for prototype outfit

## Screenshots

12 phone-viewport (~390×844) shots in `screenshots/` + `manifest.json`.  
**Browser CSS viewport ≠ Android PASS.**

## Regression

Woman 2 / Look2 suite remains green. No Pages/deploy/auth/payments/youth changes.
