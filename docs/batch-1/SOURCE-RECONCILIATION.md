# Batch 1 — Source Reconciliation

**Agent:** Woz (Cursor cloud) · **Owner:** Ted · **Date:** 2026-10-29  
**Scope:** Isolated draft work on `Burnsted/stomp-preview` only. Not “latest Grok Build.” Not a Pages replace.

## SHA / date evidence (this tip)

| Ref | Value |
|---|---|
| Repo | `Burnsted/stomp-preview` |
| Branch baseline | `main` @ `702cf32a2a6284177bdc2697766d5a34fceca39e` |
| Commit subject | Redeploy STOMP with live Add photo / Selfie camera capture |
| AuthorDate | 2026-10-27 09:50:22 -0400 |
| Tip nature | **Static Flutter web build** (Pages artifact): `index.html`, `main.dart.js`, `assets/`, `canvaskit/` — **no** Dart/`lib/`, **no** React/`src/` |
| Live Pages (unchanged by this branch) | https://burnsted.github.io/stomp-preview/ |
| Woz draft branch | `woz/batch1-dev-2026-10-29` (isolated; draft PR only) |

Parent history preserved on `main` (not rewritten):

- `55e7183` 2026-10-27 — Trail Clip photos restored  
- `bed2363` 2026-10-27 — Demo Day Flutter web  
- `80ec2df` 2026-10-27 — Initial holding page  

## What we have on this tip (FACT)

Verified by tree inventory + string search in `main.dart.js` at `702cf32`:

- Flutter web Demo Day preview (nav Home · Maps · Park · Clips · Settings per Master HQ / README)
- Add photo / Selfie camera path (commit message + tip)
- Trail Clip / sticker-band presentation assets under `assets/`
- Local “crew” **wording only**: “Crew selfie”, “Crew playlists · coming”, “Show the crew” walkthrough copy
- Master HQ PARTIAL package preserved under `docs/master-hq/` (00–12 + brief + REQUIRED-RESPONSE)
- New Batch 1 local TypeScript package under `batch1/` (this branch only)

## What is missing (blocked on newer GB / Origin source)

| Missing | Evidence | Owner |
|---|---|---|
| Grok Build app tree (React) | Absent from tip; no `src/` | GB chat `/workspace` |
| `src/components/stomp/greet.tsx` (Crew Invite) | 404 / not in tip; mtime ~2026-10-28 20:28 UTC reported by Owner for GB tree | **GB-owned** — Woz must not invent Invite UI as GB’s |
| Flutter Dart source (`lib/`, `pubspec.yaml`) | Not in `stomp-preview`; HQ points to Origin `ted-burns/tmp-1bc65ad0541faa7b` @ `e65f394` | Origin / Ted |
| Crew Unlink in tip binary | `unlink` / `Unlink` = **0** matches in `main.dart.js` | Implemented here as **new local-only** TS |
| SESSION wake words / command registry | `Hey Session` / `Yo Session` / `STOMPERS` / `Campfire` = 0 in tip binary | Stubbed in `batch1/` |
| Live auth, cloud APIs, personal data | Out of scope; not present | — |

## Preservation rules (hard)

1. **Do not delete** tip Flutter web artifacts (`main.dart.js`, `index.html`, assets, canvaskit, icons).
2. **Do not overwrite** GitHub Pages / `main` as “latest GB.”
3. **Do not claim** this tip or draft PR is the authoritative Grok Build app.
4. **Crew Invite** remains GB-owned; this branch only stubs a pointer — never a fake Invite that pretends to be GB’s `greet.tsx`.
5. Master HQ docs under `docs/master-hq/` are PARTIAL audit copies; preserve as-is; do not invent that GB source is present.
6. No merge, no deploy, no production credentials, no Rosie features.

## Tip vs Master HQ notes (delta)

| HQ claim / note | Tip @ 702cf32 | Batch 1 action |
|---|---|---|
| Web preview = this SHA | Matches | Baseline only |
| Origin Flutter `e65f394` = feature source | Not in this repo | Blocked — need Ted drop or Origin access |
| GB Crew Invite at `greet.tsx` | Absent | Stub comment + interfaces only |
| Crew Unlink | Absent | New local `batch1` unlink flow + tests |
| STOMPERS / SESSION / Campfire | Spec NEW / mostly absent | Models + voice registry prep only |
| Tests (`flutter test` 59) | Cannot re-run (no Dart source) | Vitest on `batch1/` instead |

## Inventory of tip root (preserved)

`README.md`, `index.html`, `main.dart.js`, `flutter.js`, `flutter_bootstrap.js`, `flutter_service_worker.js`, `manifest.json`, `version.json`, `favicon.png`, `.last_build_id`, `assets/`, `canvaskit/`, `icons/` — all left in place.

## Added on draft branch (additive only)

- `docs/master-hq/*` — Master HQ PARTIAL package  
- `docs/batch-1/*` — reconciliation, handoffs, SESSION docs, templates  
- `batch1/*` — TypeScript models, Crew Unlink, SESSION registry, fixtures, tests, local preview  
- `.github/workflows/pr-verify.yml` — typecheck/test only (no secrets, no deploy)
