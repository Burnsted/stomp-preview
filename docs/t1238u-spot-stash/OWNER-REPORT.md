# t1238u OWNER REPORT — STOMP Spot + Stash + Spot Keeper + Sesh voice

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO Pages · NO production GPS · NO live mic always-on · NO live deletion jobs**

**Issue:** [#87](https://github.com/Burnsted/stomp-preview/issues/87) (authoritative). Issue **#88 SUPERSEDED** — rolling GPS / location buffers / route capture / retrospective last-hit / retention beyond 7 days **not implemented**.

**Branch:** `cursor/t1238u-spot-stash-b983`  
**Starting ref (draft PR #82 tip):** `fdb7c04c028ffc02587f771bae125a6573892cf0`  
**Isolated:** cut from that tip; did **not** push to #82 or earlier stacked PRs.

## Tip / PR

- **Tip SHA:** `4dd9a0d823c2c3ba6d55ce4ecf5fc1cb8d6b68a0` (docs pin atop feature `6dae3165f4559903da1b748f5b51e1e989cdf3a7`)
- **Draft PR:** [#90](https://github.com/Burnsted/stomp-preview/pull/90) — *DRAFT t1238u — Spot / Stash / Keeper (NO MERGE)*

## CI (both checks required)

| Check | Local result |
| --- | --- |
| `batch1 typecheck + test` | **pass** — 624 passed / 8 skipped |
| `gb-phone typecheck + woz tests + build` | **pass** — typecheck clean; **1145** woz tests; build clean |

## What is functional (fictional preview)

| Area | Status |
| --- | --- |
| **STOMP Spot** (Trails) | Public community pin: lat/long, nickname, Founder, Keeper, resort, description, clips, reactions hooks, status, last-confirmed. Discoverable by authorized fiction riders. Official trail maps remain **link-only**. |
| **STOMP Stash** | Private by default; explicit crew ACL; never in public discovery / public profile counts or coords; revoke crew → future access denied; offline queue = local not shared. |
| **Spot Keeper** | Rename, correct pin, description, status, archive, crew permissions, Keeper transfer **pending acceptance**; Founder attribution immutable. |
| **Sesh voice** | Via **existing** snowboarder FAB + Trails demo panel. Intents: stash/spot/name/share/show stashes/add clip/make private. Ambiguity clarifies; share needs confirm; typed fallback when speech off. Honest save states (local / queued / shared). |
| **Simple GPS** | One-shot `getCurrentPosition` adapter + mock provider; denied/inaccurate → manual; watches cleared; coords stay on-device. |
| **7-day clips** | Pure TTL module + UI countdown; trip cannot extend; export before deadline; expired playback denied; Spot Replay = unexpired only. **No live delete job.** |
| **Integration** | STOMPER actor, fiction crews, Trip Drop id on clips (attribution only), STOMPED participation recorded without public stash leak. |

Preserved: Form #7 logo, universal S menu, five tabs, social-first Home, STOMPER customization, single Hey Sesh FAB, `greet.tsx` / CrewLink Invite SHA, fictional labeling.

## Permissions matrix (roles × actions)

Roles: **Founder**, **Keeper**, **crew contributor**, **crew viewer**, **public rider**, **unauthorized**.

| Action | Founder | Keeper | Crew contrib | Crew viewer | Public rider | Unauthorized |
| --- | --- | --- | --- | --- | --- | --- |
| View pin / clips | ✓ | ✓ | ✓ (ACL) | ✓ (ACL) | ✓ Spot only | ✗ |
| Add clip | ✓ | ✓ | ✓ | ✗ | ✓ Spot | ✗ |
| React | ✓ | ✓ | ✓ | ✓ | ✓ Spot | ✗ |
| Export own clip | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Create pin | ✓* | ✓ | ✗ | ✗ | ✓ Spot | ✗ |
| Rename / correct pin / edit desc | ✗† | ✓ | ✗ | ✗ | ✗ | ✗ |
| Select crew / manage permissions | ✗† | ✓ | ✗ | ✗ | ✗ | ✗ |
| Archive / remove / update status | ✗† | ✓ | ✗ | ✗ | ✗ | ✗ |
| Transfer Keeper | ✗† | ✓ | ✗ | ✗ | ✗ | ✗ |
| Accept Keeper transfer | ✗ | ✗ | ✓ if offered | ✓ if offered | ✗ | ✗ |
| Public discovery | Spot ✓ | Spot ✓ | Stash ✗ | Stash ✗ | Spot ✓ | ✗ |
| See stash on public profile | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

\*Founder who is also Keeper has Keeper powers. †Founder-only (non-Keeper) keeps credit + ride actions; management is Keeper-only. Machine-readable: `PERMISSIONS_MATRIX` in `batch1/src/spot-stash/permissions.ts`.

## Voice demo

Commands parsed: `Sesh, stash this spot.` · `Sesh, spot this.` · `Name it Little Launcher.` · `Share it with Powder Crew.` · `Show our Stashes.` · `Add this clip.` · `Make that spot private.`  
Ambiguous `stash this` asks clarifying confirm. Share/delete gated. Speech unavailable → typed fallback. No false “shared” when local/queued.

## Pin-drop demo

Capture once (mock GPS) → save → clear watches. GPS denied / inaccurate → manual lat/long. Offline Stash → `queued_offline` (not shared, not public).

## Retention tests

- Day-1 clip in 20-day trip expires day 8; day-2 expires day 9 (independent).
- Export before expiry OK; at/after deadline denied.
- Expired → delivery revoked; playback denied; Spot Replay empty.
- Documented purge SLA ≤72h physical delete target; immutable backup lag disclosed; **no** live job in preview. See `RETENTION-DESIGN.md`.

## Screenshots (390×844)

Under `docs/t1238u-spot-stash/screenshots/` and `gb-phone/screenshots/t1238u/`:

| File | Proof |
| --- | --- |
| `trails-spots-list-390.png` | Trails with Spots / Stashes lists |
| `spot-detail-founder-keeper-clips-390.png` | Founder / Keeper / status / clips TTL |
| `create-pin-flow-capture-390.png` | Create pin + one-shot capture |
| `gps-denied-manual-fallback-390.png` | GPS denied → manual place |
| `stash-create-crew-select-390.png` | Stash + crew select |
| `stash-hidden-from-public-390.png` | Stash not in public discovery |
| `keeper-transfer-pending-390.png` | Transfer pending acceptance |
| `sesh-voice-listening-390.png` | Voice listening state |
| `sesh-voice-parsed-390.png` | Parsed intent |
| `sesh-voice-confirm-share-390.png` | Confirm share (not shared yet) |
| `sesh-voice-typed-fallback-390.png` | Typed fallback |
| `clip-expiry-countdown-390.png` | Countdown + export |
| `clip-expired-playback-denied-390.png` | Expired playback denied |
| `home-single-sesh-fab-390.png` | Home · single Sesh FAB |
| `trails-single-sesh-fab-390.png` | Trails · single Sesh FAB |
| `locker-single-sesh-fab-390.png` | Locker · single Sesh FAB |

## Data / battery measurements

**Not measured** in this batch — no device battery or GPS radio telemetry collected. Do not invent numbers.

## Missing dependencies (honest blockers before any deploy)

1. Real backend + auth for Spot/Stash ACL and Keeper transfer.
2. Durable object storage / CDN + signed delivery URLs + purge worker (design only today).
3. Push / expiry notifications.
4. Real SpeechRecognition + geolocation permission UX on physical devices (preview uses guarded mock + hold-to-talk stub).
5. Owner approvals: merge policy, Pages / family-playtest deploy freeze, live GPS sharing, live mic, live deletion jobs, public sharing — **all remain OFF**.

## Owner approvals required before deployment

- Merge to `main` / any Pages publish (production or family playtest).
- Enabling live geolocation sharing off-device.
- Enabling always-available microphone (beyond rider-initiated hold).
- Enabling real media deletion / CDN purge workers.
- Any paid speech/geo service.

## Protected / intact

- `greet.tsx` CrewLink Invite export SHA unchanged.
- No touch to production https://burnsted.github.io/stomp-preview/ or family playtest (#56).
- No second Sesh avatar / giant pill / duplicate Hey Session bars.
