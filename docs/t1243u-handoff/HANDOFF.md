# t1243u HANDOFF — Spot/Stash refine/verify on draft PR #90

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO production sharing · NO live deletion**

**Issue (authoritative):** [#87](https://github.com/Burnsted/stomp-preview/issues/87) — read in full; #88 superseded (no rolling GPS / >7d retention).

## Branch / tip

| Field | Value |
| --- | --- |
| **Branch** | `cursor/t1238u-spot-stash-b983` |
| **Draft PR** | [#90](https://github.com/Burnsted/stomp-preview/pull/90) |
| **Green commit SHA (pre-t1243u tip)** | `d6b64990dcbb6d51e973e9696dc8ac52baf9183b` — [CI 42306128366](https://github.com/Burnsted/stomp-preview/actions/runs/42306128366) |
| **t1243u tip (live green)** | `31aba7bc55857986ccda7095d24dc5f8d2d858a6` — [CI 42323686088](https://github.com/Burnsted/stomp-preview/actions/runs/42323686088) |
| **Starting lineage** | `fdb7c04` (#82 tip) → t1238u Spot/Stash → this refine |

## Preview location

**Local / CI only.** No Pages, no production `burnsted.github.io/stomp-preview`, no family playtest (#56). Dev: `gb-phone` Vite on `127.0.0.1:8080` in agent VM.

## What t1243u changed (refine only — no Home/Form#7/STOMPER/Sesh rebuild)

| Change | Why |
| --- | --- |
| Sample expiry disclaimer + “own deadline” labels on clips | Req #5: sample behavior, not live deletion |
| Export button **disabled** when expired | Non-exportable in prototype |
| Archive pin requires **Keep / Yes, archive** confirm | Req #6 |
| `data-mobile-safe` on Spots panel + width tests 360/390/430 | Req #7 |
| New tests `spot-stash-t1243u.test.tsx` + GPS `watchPosition` assert | Reqs #1–#7 |

Preserved: social-first Home, Form #7 S menu, STOMPER customization, single Hey Sesh FAB, `greet.tsx` / CrewLink.

## Components / routes added or modified

### Added (t1238u; still current)
- `batch1/src/spot-stash/*` — types, permissions, store, gps, voice, keeper, retention
- `gb-phone/src/lib/stomp/spot-stash/client-store.ts`
- `gb-phone/src/components/stomp/spot-stash/spots-panel.tsx`
- Embedded in **Trails** (`screen === "map"`) via `TrailMapScreen` — no new route file

### Modified (t1243u)
- `gb-phone/src/components/stomp/spot-stash/spots-panel.tsx` — sample labels, disabled export, archive confirm, mobile-safe attr
- `batch1/tests/spot-stash-t1238u.test.ts` — browser adapter never calls `watchPosition`
- `gb-phone/tests/woz/spot-stash-t1243u.test.tsx` — new verification suite
- `gb-phone/scripts/t1243u-screenshots.mjs`

### Also wired (unchanged this pass)
- `session-voice.ts` / `session-mic.tsx` — Spot voice intents via existing FAB
- `app.tsx` — `__stompSpotStash` screenshot hook

## Data structures + mock records

```ts
SpotPin {
  visibility: "public_spot" | "private_stash"
  nickname, description, founderId/Name, keeperId/Name
  pin: GeoFix { lat, lng, accuracyMeters, capturedAt, source }
  crewAcl: [{ crewId, crewName, permission: "viewer"|"contributor" }]  // stash only
  clips: SpotClip[]  // expiresAt = receivedAt + 7d independently
  saveState: draft_local | saved_local | queued_offline | shared
  keeperTransfer, status, archived, …
}
```

**Demo seed (`seedDemo`):**
- Public Spot `demo-spot-launcher` “Little Launcher” + day-1 clip (trip id attribution only)
- Private Stash `demo-stash-pillow` “Secret Pillow” shared with Powder Crew

Fiction crews: Powder Crew, North Trees, Park Squad.

## Voice-command handling

Via **existing** Hey Sesh snowboarder FAB (`holdListen`) + Trails “Sesh voice demo” panel.

| Utterance | Intent |
| --- | --- |
| `Sesh, stash this spot.` | private stash draft + oneshot GPS |
| `Sesh, spot this.` | public spot draft + oneshot GPS |
| `Name it Little Launcher.` | rename |
| `Share it with Powder Crew.` | **confirm_share** (not shared until yes) |
| `Show our Stashes.` | list private |
| `Add this clip.` | attach local 7d clip |
| `Make that spot private.` | confirm make_private |
| `stash this` | ambiguous → clarify |
| Speech off | **typed_fallback** |

## Known limitations / blockers

1. No real backend, auth, storage/CDN, push, or purge worker  
2. GPS/speech are guarded mocks / hold-to-talk stubs — not measured on physical devices  
3. Battery/data **not measured**  
4. Sample expiry = product-logic revoke only; **no live deletion**  
5. Owner approval still required before merge/deploy/live GPS/mic/purge  

## Integration instructions (for next agent)

1. Stay on `cursor/t1238u-spot-stash-b983` / draft #90 — do **not** open a parallel PR unless Ted asks  
2. Import domain via `@woz/spot-stash/*`; UI state via `useSpotStash`  
3. Keep Spots under Trails; never leak stash coords on public profiles (`publicProfileSpotSummary`)  
4. Do not touch `greet.tsx` / CrewLink Invite export  
5. Retention design: `docs/t1238u-spot-stash/RETENTION-DESIGN.md`

## Tests actually run

### Local (t1243u pass)
| Suite | Result |
| --- | --- |
| `batch1` `spot-stash-t1238u.test.ts` | **17 passed** |
| `gb-phone` `spot-stash-t1238u` + `t1243u` | **26 passed** (16+10) |
| `gb-phone` `typecheck:woz` | clean |

### Full CI (to be filled after push)
| Check | Expected |
| --- | --- |
| `batch1 typecheck + test` | ≥625 passed (incl. new GPS assert) |
| `gb-phone typecheck + woz tests + build` | ≥1155 woz (prior 1145 + 10 t1243u) |

**Prior green on branch tip `d6b6499`:** [run 42306128366](https://github.com/Burnsted/stomp-preview/actions/runs/42306128366)  
**t1243u CI run id (tip `31aba7b`):** [42323686088](https://github.com/Burnsted/stomp-preview/actions/runs/42323686088) — batch1 **625** passed / 8 skipped; gb-phone woz **1155** passed + build

## Screenshots (completed screens)

Under `docs/t1243u-handoff/screenshots/` (+ `gb-phone/screenshots/t1243u/`):

| File | Screen |
| --- | --- |
| `01-trails-spots-stashes-list-390.png` | Trails Spots + Stashes lists |
| `02-spot-detail-clips-sample-disclaimer-390.png` | Detail + sample TTL disclaimer |
| `03-archive-confirm-390.png` | Archive explicit confirm |
| `04-expired-clip-sample-nonexport-390.png` | Expired non-play/export sample |
| `05-create-spot-oneshot-gps-390.png` | Create Spot oneshot GPS |
| `06-gps-denied-manual-390.png` | GPS denied → manual |
| `07-stash-create-crew-private-390.png` | Stash create + crew |
| `08-stash-detail-crew-acl-390.png` | Stash detail ACL |
| `09-sesh-voice-confirm-share-390.png` | Voice confirm share |
| `10-sesh-voice-typed-fallback-390.png` | Typed fallback |
| `11-keeper-transfer-pending-390.png` | Keeper transfer pending |
| `12-home-single-sesh-fab-390.png` | Home single FAB |
| `13-trails-single-sesh-fab-390.png` | Trails single FAB |
| `14-trails-spots-width-360.png` | Width 360 |
| `14-trails-spots-width-430.png` | Width 430 |
