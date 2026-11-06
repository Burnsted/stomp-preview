# t1236u OWNER REPORT — Social-first Home correction

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO Pages · NO live playtest**

**Branch:** `cursor/t1236u-social-home-5816`  
**Starting ref (PR #77 tip):** `de3c681ab3d96f5b9d0db84626a6b57f219afc0a`  
**Isolated:** cut from that tip; did **not** merge/rebase onto t1228u `1e5703f` — FAB clearance re-implemented on this branch.

## Tip / PR

- **Tip SHA:** `6d57b5624e1a2f833441ebb9aede780a3704b568` (feature) · branch head `c3aacf0`
- **Draft PR:** [#82](https://github.com/Burnsted/stomp-preview/pull/82) — *DRAFT t1236u — Social-first Home correction (NO MERGE)*

## Before → After (Home)

| | Before (tip de3c681 / Greet look-board) | After (SocialHome t1236u) |
| --- | --- | --- |
| Focus | Mountain hero + lineups + feature rows + map/playlist chrome | STOMPER + display name + Squad + Invite/Start Sesh + Upload Past Sesh |
| Background | Single `PHOTOS.hero` (black/navy veil) | Rotating library of **10** generic SVG environments |
| Primary CTAs | Trip Drop next, lineups, feature rows | Invite Friends / Start a Sesh · Upload a Past Sesh |
| First-time | Welcome + Create via dock | Same — Create via `AvatarHomeDock`; S inactive |
| Tagline | None invented | **No** “Your mountain. Your STOMP.” |

`greet.tsx` / CrewLink **byte-untouched**. App mounts `SocialHome` for `screen === "greet"`.

## Menu changes (Form #7 S)

First two actions:

1. **Invite Friends / Start a Sesh** → preview sheet → Crew invite (`crew` / CrewLink) or Start Sesh (fiction `startDay` + `session`)
2. **Upload a Past Sesh** → preview sheet → local `addClip` + `stageShare` — **no** network upload / SMS / email / file-picker send

Then existing honest destinations (t1230u mappings kept): Profile, Squad, Trip Drops, Locker, Boards→Hub Profile, Bag, Settings→Locker, Help→Feedback.

## Social-action flow wiring

| Action | Reused flow | Honest label |
| --- | --- | --- |
| Invite Friends | `setScreen("crew")` → existing CrewLink invite / QR / share sheet | Preview — nothing sent until friend types/scans |
| Start a Sesh | `useSocial.startDay` + `setScreen("session")` | Fictional Day Sesh + Today Session |
| Upload Past Sesh | `addClip` + `stageShare(..., "video")` | Preview only — stays on phone |

## Hey Sesh FAB (t1228u clearance on this branch)

- Single bottom-right snowboarder FAB; caption **HEY SESH**
- Clearance `pb-[max(12.75rem,...)]` + Trails `pb-[13.5rem]` + map card height drop (same spirit as 1e5703f / 2e83fc5 — reimplemented, not rebased)
- Draggable within bounds when needed
- Primary tappable Sesh control = FAB only; surfaces may still prompt “say Hey Sesh / Yo Sesh”

## Back navigation

- In-memory `screenHistory` + `goBack` on `useStomp` (not persisted)
- Text **‹ Back** under `AlpineTopBar` / `ScreenBackLink` when history exists
- **Hidden** on root Home (`greet`) / welcome

## Backgrounds

See `BACKGROUND-SOURCES.md` — all ten original SVGs; no authorized resort photos; free-license extras documented but not in rotate set.

## Protected / intact

- `greet.tsx` / CrewLink Invite SHA
- Form #7 artwork (white on dark / black on light)
- Five tabs
- Create-cleared = 0; Woman 2 / Man 1 OPEN omitted; ten SOURCE MISSING omitted
- No live youth, payments, prod auth, paid APIs
- Weather FICTION·SAMPLE on Trails/Map only
- Public names Stomper Woman/Man/Grom N
- No merge / no Pages deploy / family playtest stays on #56

## Screenshots (390×844)

Under `docs/t1236u-social-home/screenshots/` and `gb-phone/screenshots/t1236u/`:

| File | Proof |
| --- | --- |
| `BEFORE-home-tip-de3c681-390.png` | Prior Home look from tip lineage (t1230u home shot) |
| `AFTER-home-returning-social-390.png` | Returning rider — STOMPER + name + social actions + bg |
| `s-menu-social-first-390.png` | S menu — social items first, then destinations |
| `invite-start-sesh-sheet-390.png` | Invite / Start a Sesh preview sheet |
| `upload-past-sesh-sheet-390.png` | Upload Past Sesh preview sheet |
| `first-time-home-create-reachable-390.png` | No STOMPER — Create reachable; S inactive |
| `trails-back-and-hey-sesh-fab-390.png` | ‹ Back under header + FAB |
| `home-hey-sesh-fab-390.png` / `locker-hey-sesh-fab-390.png` | Single FAB surfaces |
| `home-reduced-motion-390.png` | Reduced-motion readable Home |
| `home-bg-variation-{0,4,8}-390.png` | Sample bg frames (all 10 sources documented) |

## Tests

- `npm run test:woz` — **1129 passed** (includes `social-home-t1236u`, `hey-session-fab-t1228u`)
- `npm test` (batch1) — **66 passed**
- `npm run typecheck` + `typecheck:woz` — clean
- `npm run build` — clean

## Blockers (honest)

1. **No authorized selected-resort photos** — rotate library is original generic SVG; resorts stay text-fallback branding.
2. **No real upload / send pipeline** — Upload Past Sesh is preview-only local stage (documented in UI).
3. **Settings / Help / Boards** — still closest-real mappings (Locker / Feedback / Hub Profile).
4. Draft only — **no merge, no Pages deploy, no production / live family playtest**.
