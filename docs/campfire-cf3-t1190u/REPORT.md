# Campfire CF-3 Client Shell — t1190u

**Owner:** Ted Burns · **Auth:** t1190u  
**Status:** DRAFT ONLY — do not merge · no Pages/deploy · no payments · no youth enable · no live authz · no storage deletion jobs

## Verdict

Wire CF-2 / SV-0 / G1–G4 fictional contracts into a **gb-phone Squad Campfire client shell** so Ted can exercise list → thread → compose → tombstones → block reveal → Quick Share → leave/rejoin → unresolved-owner in preview.

| | |
|---|---|
| Branch | `cursor/campfire-cf3-client-shell-t1190u-22f0` |
| Base tip | `5dc2c8e8bd198b4f244226b3ff18ad1dd21ba7fb` (#17 release-blocker tip) |
| HEAD | `4c68007e81e21b55ea4b51e09ac86c40760da528` |
| Draft PR | https://github.com/Burnsted/stomp-preview/pull/24 · **not merged** |
| CI | [pr-verify 41738914418](https://github.com/Burnsted/stomp-preview/actions/runs/41738914418) — **both jobs success** |

## Client surface

### Adapter — `batch1/src/campfire/client-adapter.ts`

`CampfireClient` implements the GB contract methods against in-memory `CampfireWorld`:

| Method | Behavior |
|---|---|
| `listMyCampfires` | One Campfire per active Squad; soft-cap notice at 20; ownershipState |
| `readCampfire` | Thread rows with render + tombstoneKind; **G2 historyCutoff filter** |
| `postMessage` / `deleteOwnMessage` | Member/author gates; author delete → tombstone |
| `renderForViewer` / `revealCollapsed` | Blocker-only collapse + explicit reveal |
| `block` / `unblock` | Person-level; no notify to blocked |
| `prepareShare` / `confirmShare` / `cancelShare` / `discardShare` | One Squad + explicit confirm; multi deny; background discard |
| `leaveSquad` / `approveRejoin` | G2 — access ends; new membership + prospective history |
| `nominateOwner` / `acceptOwnerTransfer` / `departOwnerUnresolved` | G3 — nominate+accept only; unresolved banner |
| `closeDaySesh` | G1 — `campfireEffects: []` |
| Youth | `YOUTH_CAMPFIRE_ENABLED=false` — empty list / deny |

`GROK_BUILD_CAMPFIRE_BRIDGE_STATUS` stays **HELD** (live paste).  
`CF3_CLIENT_SHELL_STATUS` / `CF3_CLIENT_STATUS` = **PREVIEW_WIRED**.

### Phone shell

| File | Role |
|---|---|
| `gb-phone/src/lib/stomp/woz-bridge/cf3-client.ts` | Bridge re-exports |
| `gb-phone/src/lib/stomp/cf3-store.ts` | Zustand preview store (not persisted) |
| `gb-phone/src/components/stomp/campfire-shell.tsx` | List / thread / share sheet UI |
| `gb-phone/src/components/stomp/woz-lab.tsx` | Mounts CF-3 shell **above** legacy crew-dump Campfire panel (batch8 regressions kept) |

Entry: Crew Tools → Campfire tab. Viewer switch (Ava/Ben/Cal/Dee/Gia) for fictional roles.

## Items 1–10

| # | Item | Landed? |
|---|---|---|
| 1 | Campfire list + soft cap notice | **Yes** |
| 2 | Thread / tombstones / Former STOMPER | **Yes** |
| 3 | Compose + author-delete | **Yes** |
| 4 | Block collapse + reveal | **Yes** |
| 5 | Quick Share confirm sheet + SV-0 TTL constant | **Yes** (wires existing prepare/confirm/cancel/discard; UI shows 20s TTL) |
| 6 | Leave / rejoin G2 | **Yes** |
| 7 | Owner unresolved G3 banner + nominate/accept | **Yes** |
| 8 | Day Sesh close → `campfireEffects:[]` | **Yes** (button + adapter) |
| 9 | Youth DISABLED negative path | **Yes** |
| 10 | AF-CF3-* + AF-G14 green | **Yes** |

### Deferred / not in this draft

- Live authz / production deletion jobs / payments / Pages deploy / merge
- Youth enable
- Physical storage wipe (G4 docs-only)
- Sesh animation state machine (AF-CF-51 still GB-held)
- Replacing Rider Hub social notes with CF-3 (Rider Hub untouched; CF-3 lives in Woz Campfire tab)
- Soft-cap invite flow UI beyond notice flag

## Tests (local)

| Suite | Result |
|---|---|
| batch1 `npm test` | **587 passed / 8 skipped** (incl. AF-CF3-01..13 + AF-G14-01..14) |
| batch1 typecheck | pass |
| gb-phone `test:woz` | **884 passed** (incl. AF-CF3-P01..P03) |
| gb-phone typecheck + build | pass |
| Home / five-tab / greet / Crew Invite | **untouched** |

## Hard bans held

No merge · no Pages/deploy · no payments · no youth enable · no live server authz · no deletion sweepers · no Home/five-tab/Crew Invite edits · no plate/stomper artwork/character roster changes · SV-0 product rules not reopened.
