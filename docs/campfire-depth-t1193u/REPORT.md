# Campfire depth — t1193u

**Owner:** Ted Burns · **Auth:** t1193u  
**Status:** DRAFT ONLY — do not merge · no Pages/deploy · no payments · no youth enable · no live authz · no storage deletion jobs · no character plates / Look2 ink / Franz artwork

## Verdict

Maximize Campfire client depth on top of CF-3 shell (`cc1f153` / PR #24) — soft-cap invite, SV-0 TTL, G2 cutoff UX, G3 nominate/accept polish, G4 erasure tombstones, Day Sesh media clock via adapter — without DESIGN/artwork and without reopening product rules.

| | |
|---|---|
| Branch | `cursor/campfire-depth-t1193u-738a` |
| Base tip | `cc1f153fd1dff312da4ded7d54329399534be980` (CF-3 / PR #24) |
| HEAD | _(filled after commit)_ |
| Draft PR | _(filled after open)_ · **not merged** |
| CI | _(filled after green)_ |

## Landed

| # | Item | Notes |
|---|---|---|
| 1 | Soft-cap invite flow UI | `inviteMember` + invite sheet; invite at ≥20 still **pending** + soft notice (not hard deny); silent deny for blocked remains separate |
| 2 | Quick Share / SV-0 polish | PendingStore TTL countdown in share sheet; cancel / background discard; multi-Squad deny copy; expire → nothing posts |
| 3 | G2 leave/rejoin + historyCutoff | `historyCutoffAt` preferred in `messageVisibleToMembership`; cutoff chip in thread; prospective-only messaging |
| 4 | G3 nominate/accept polish | Nominee picker; banner names nominee; accept only as nominee viewer |
| 5 | G4 Former STOMPER edges | Seed erased tombstone; erase-viewer demo; erased body copy; no block/delete on former |
| 6 | Day Sesh media share clock | Adapter seed `day_sesh` + confirm asserts clock identity; shell “Share Day Sesh media” path |
| 7 | AF expansion | AF-CF3-14..19 + AF-CF3-P04; AF-G14 / AF-SV untouched & green |
| 8 | Docs honesty | This REPORT + RELEASE-BLOCKERS Campfire client status note — **no merge Go** |

## Deferred / out

- Live authz / production deletion jobs / payments / Pages deploy / merge
- Youth enable
- Physical storage wipe (G4 docs-only)
- Character roster / modular plates / Look2 ink / Franz Drive art
- Home / five-tab / Crew Invite redesign (untouched; CrewLink hash stable)
- Rider Hub full social redesign
- Sesh animation state machine (AF-CF-51 still GB-held)
- Android Batch E fake-PASS
- Merge-plan Go / tip moves on #12–#23 / artwork branches

## Tests (local)

| Suite | Result |
|---|---|
| batch1 `npm test` | **593 passed / 8 skipped** (AF-CF3-01..19 + AF-G14-01..14 + AF-SV suites) |
| batch1 typecheck | pass |
| gb-phone `test:woz` | **885 passed** (AF-CF3-P01..P04) |
| gb-phone typecheck + typecheck:woz + build + `npm test` | pass |
| Home / five-tab / greet / Crew Invite | **untouched** (CrewLink sha256 `7795349de918…fcbe`) |

## Contract honesty

| Flag | Value |
|---|---|
| `GROK_BUILD_CAMPFIRE_BRIDGE_STATUS` | **HELD** (live paste) |
| `CF3_CLIENT_SHELL_STATUS` / `CF3_CLIENT_STATUS` | **PREVIEW_WIRED** (fictional shell + depth) |
| Soft-cap | Notice, not deny |
| SV-0 product rules | Not reopened |
| Merge / Pages / youth / payments / live authz / deletion jobs | **Not activated** |

## Hard bans held

No merge · no Pages/deploy · no payments · no youth enable · no live server authz · no deletion sweepers · no Home/five-tab/Crew Invite edits · no plate/stomper artwork/character roster · no Franz artwork · no Look2 ink invention · tips of #12–#23 / artwork branches not moved.
