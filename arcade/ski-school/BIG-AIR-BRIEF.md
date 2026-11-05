# Slopestyle / Big Air — concept brief (mocks only)

**Status**
- Ted rejected Race Day (girl-themed; face carve without gates).
- Ted **likes** Big Air competition (judged BIG AIR / LONG JUMP / SLOPESTYLE + AI leaderboard).
- Ted **rejects** static side-view kicker graphics.
- **NEW FEEL:** **Alto’s Adventure–style** physics terrain (inspiration only — **no copied art/IP, no llamas**). Hill Climb rhythm as secondary feel reference only.

**This PR:** Ted said **GO** — tip `arcade/ski-school/index.html` is now the playable Big Air swoop (replaces solo-lesson tip on this branch only). Mocks kept for history.  
**Do not touch:** `arcade/release/`, `/arcade/play/`, QR, Boulder Dodge, Terrain Park, Halfpipe.

Product name: **Slopestyle / Big Air** (path still `arcade/ski-school/` for preview URL stability)

---

## Locked competition wrapper

```
EVENT SELECT  →  RUN (best of 3)  →  LEADERBOARD
       ↑_________ rematch / next attempt _________|
```

Session: **best of 3 attempts** vs 3–4 AI riders.  
Cast: **neutral mixed** Soft Alps riders — no gendered pastel theming.

---

## Course layout (Alto-style swoop)

**Core shape:** one **very large sweeping downhill swoop** that builds speed.  
The **BIG AIR** jump sits at the **BOTTOM of that swoop** as the finale — not a mid-hill pop off a random crest.

```
  START ~~~~ long descending swoop (dips / rollers) ~~~~ FINALE JUMP → land
```

Inspiration only: Alto’s long glide + hangtime cadence. **Do not** copy Alto art, characters, UI, or llamas.

---

## Events & jump size tiers

| Event | Course | Jump tier(s) |
|-------|--------|----------------|
| **BIG AIR** | Full swoop → **one XL finale** at the bottom | **XL** |
| **LONG JUMP** | Swoop into a **single long table** | **L table** (long deck, distance score) |
| **SLOPESTYLE** | Swoop with **multiple jumps along the run** | **S + M + L** (points sum); optional **XL** finale |

### Size tier vocabulary (show on event select / course preview)

| Tier | Role | Feel |
|------|------|------|
| **S** | Small pop | Warm-up / combo seed |
| **M** | Medium kicker | Solid air, 1 flip window |
| **L** | Large kicker / short table | Big hangtime |
| **XL** | Finale monster (bottom of swoop) | Hero air — Big Air event |
| **TABLE** | Long flat deck (Long Jump) | Distance meter + stomp |

Mock must show these tiers on **event-select / course preview** (screenshot).

---

## Feel / physics loop

1. **DESCENT** — ride the long swoop; gravity + rollers build speed; snow spray; motion trail  
2. **LAUNCH** — leave the feature (S/M/L/XL or table lip) into air  
3. **AIR** — hold to **spin/flip**; release to set board angle; camera **zooms out** on big air  
4. **LANDING** — board must **match the slope**; grade pop: `PERFECT` / `GOOD` / `SKETCHY` / `BAIL`  
5. **LEADERBOARD** — standings vs AI; attempt counter  

For **SLOPESTYLE**, steps 2–4 repeat on each sized jump; scores **add up**.

---

## Controls

| Input | Ground | Air |
|-------|--------|-----|
| **HOLD** | Tuck / commit (mock may auto-accel on swoop) | **Spin / flip** |
| **RELEASE** | — | Stop rotation; set board for stomp |
| **TAP** (optional) | Small pop assist near lip | Grab flash |

No rails. No dodge corridors. No left↔right face-carve race.

---

## Scoring & grades

**Landing grade:** board-vs-slope angle error + vertical speed on touchdown.

| Grade | Feel |
|-------|------|
| **PERFECT** | Board matched to slope, soft touchdown |
| **GOOD** | Small angle scrub |
| **SKETCHY** | Hand / butt drag |
| **BAIL** | Nose dig / over-rotate |

**BIG AIR** ≈ air time × flips × height off **XL finale** × landing mult  
**LONG JUMP** ≈ horizontal distance across **table** × landing  
**SLOPESTYLE** ≈ sum of S/M/L/(XL) launch scores on one run  
Best of 3 vs AI field.

---

## Differentiator vs BD / TP

| | Boulder Dodge | Terrain Park | **Big Air (Alto swoop)** |
|--|---------------|--------------|---------------------------|
| Space | Straight corridor | Endless park scroll | **One sweeping downhill swoop** |
| Verb | Dodge rocks/trees | Grind rails / park features | **Speed on swoop → sized jumps → trick → stomp** |
| Features | Obstacles | Rails / boxes / mixed park | **S/M/L/XL kickers + long table** only |
| Camera | Down-pipe | Feature chase | **Follow + zoom-out on air** |
| Win | Survive / distance | Feature stars | **Judged air/distance vs AI** |

**MUST NOT** feel like BD (dodging) or TP (rails / park clutter).

---

## Art bar

Vector `<canvas>` only — **no external images**:

- Smooth **gradient sky**  
- **Layered parallax** mountains / depth  
- Procedural **rolling snow swoop** with visible **sized jump lips**  
- **Snow-spray** particles, **motion trails**  
- Rider silhouette with **visible board + rotation**  
- **Landing grade pop**  
- Neutral cast (blue / orange / forest / ink / steel)

---

## Mock deliverables

| File | Role |
|------|------|
| `arcade/ski-school/big-air-hill-mock.html` | **Current** feel — live demo + `?shot=descent\|air\|landing\|leaderboard\|events` |
| `arcade/ski-school/big-air-mock.html` | Prior static-kicker mock (superseded) |
| Screenshots | `hill-descent.png`, `hill-air.png`, `hill-landing.png`, `hill-leaderboard.png`, plus **tier preview** (`hill-events.png` or events frame in one of the four if combined) |

Primary shot hooks: `descent` · `air` · `landing` · `leaderboard` · **`events`** (course preview / size tiers).

---

## Size / tech notes (later tip rewrite)

| Item | Note |
|------|------|
| Hill mock | `big-air-hill-mock.html` — **29751** raw / **9827** gzip-9 |
| Tip budget | Soft STOMP ~**70KB raw**; **gzip ≪ 70KB** — target rewrite **≤ ~55KB raw** |
| Physics | Heightfield swoop; detach on sized lips; angular vel in air; slope-match landing |
| AI | Scored ghosts on same hill seed |
| Out of scope until approve | Tip `index.html`, SW, play hub, release freezes |

---

## Playable tip (v0.2)

| Item | Detail |
|------|--------|
| File | `arcade/ski-school/index.html` + `sw.js` (`slopestyle-ba-v0-2-1`) |
| Loop | MENU (PLAY first) → RUN best of 3 → LEADERBOARD |
| Select | Rider (6 neutral) + Board (tiered pop/spin/stab, pts unlock) → `localStorage` `skiSchool.ba` |
| Controls | Hold = tuck on ground / spin in air; release to set board for stomp |
| SFX | Web Audio whoosh / land grades / UI |
| Shots | `?shot=menu\|rider\|board\|descent\|air\|landing\|leaderboard` |

## Done criteria

- [x] Brief: Alto swoop, XL finale at bottom, S/M/L/XL + table tiers, BD/TP contrast  
- [x] Hill mock + events tier preview  
- [x] **Playable tip** replaces solo lessons on this branch  
- [x] Rider + board select persisted  
- [x] Size under ~70KB raw tip budget  
- [x] Release / hub / BD / TP / Halfpipe untouched  
- [x] PR #55 updated, unmerged  
