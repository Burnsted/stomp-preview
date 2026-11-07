# Device / browser test — t1210u

## Honest device inventory

| Class | Result |
|---|---|
| Physical Android phone | **NOT RUN** — none attached to this cloud VM |
| Physical iPhone | **NOT RUN** — none attached |
| Phone viewport ≠ device PASS | Affirmed — do **not** treat rows below as Android/iOS PASS |

## What was run

| Check | Environment | Result |
|---|---|---|
| Desktop browser viewport (~1280) | Cloud VM `browser-smoke.mjs` | **PASS** — content, no page/console errors |
| Narrow phone viewport (390×844) | Cloud VM Chromium headless | **PASS** — `scripts/playtest-smoke-t1210u.mjs` **22/22** |
| Five-tab nav smoke | Same Playwright script | **PASS** — Home/Map/Music/Stats/Crew each non-blank |
| Explore Demo + Trip Drop | Same | **PASS** |
| Create STOMPER opens onboard | Same | **PASS** |
| Feedback liked + save | Same | **PASS** |
| Reset Demo confirm UI | Same | **PASS** (cancel path) |
| Bag of Tricks via Explore | Same | **PASS** |
| Vitest `test:woz` | Local | **PASS** — 1000/1000 |
| `npm test` (node) | Local | **PASS** — 66/66 |
| `npm run typecheck` + `typecheck:woz` | Local | **PASS** |
| `npm run build` | Local | **PASS** |
| Manual computer-use browse | Chrome DevTools phone emulation | Explore/Feedback/nav content OK; agent missed Reset Demo via find-in-page but Playwright confirms present |

## Artifacts

- `gb-phone/screenshots/t1210u/smoke-*.png`
- `gb-phone/scripts/playtest-smoke-t1210u.mjs`

## Guidance for Cameron / Justin (real phones)

See [CAMERON-JUSTIN-INSTRUCTIONS.md](./CAMERON-JUSTIN-INSTRUCTIONS.md). Report crashes via Feedback → Crashed.
