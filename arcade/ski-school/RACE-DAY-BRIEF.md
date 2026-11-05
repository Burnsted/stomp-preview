# Ski School · Race Day — concept brief (mocks only)

**Status:** Ted rejected tip Ski School solo lessons (“gotta be some sort of a race or competition”).  
**This PR:** brief + canvas mock + screenshots only. Tip `arcade/ski-school/index.html` stays as-is until Ted says rewrite.  
**Do not touch:** `arcade/release/`, `/arcade/play/`, QR, Boulder Dodge, Terrain Park, Halfpipe.

Working title: **Ski School · Race Day**

---

## Locked loop

```
MENU  →  RACE  →  PODIUM
  ↑_________________|
         rematch
```

| Screen | Job |
|--------|-----|
| **MENU** | PLAY-first. Soft Alps face. Girl-grom cast chips. One primary **RACE** CTA. No lesson ladder, no skill unlock grid. |
| **RACE** | Full-phone open snow face. Carve LEFT ↔ RIGHT in S-curves through soft **GATE flags**. Race 2–3 AI girl-groms. Place badge (P1/P2/P3) + speed feel. |
| **PODIUM** | Finish order 1–2–3 + clean-carve bonus stars. Rematch CTA. Optional “again with same cast.” |

Win condition = **finish order** (1st / 2nd / 3rd) **+** clean-carve bonus stars (S-path width / gate cleanliness — not pure speed).

Audience: **girl groms → teens**.

---

## Controls (carry from tip feel)

| Input | Action |
|-------|--------|
| **◀ TOE** (left hold / left half-tap) | Lean toe-side → carve left across face |
| **HEEL ▶** (right hold / right half-tap) | Lean heel-side → carve right across face |
| **SKID** (optional, center hold) | Scrub speed / spray; used to set up gates, not a corridor dodge |

No jump button in Race Day v0 mock. No rail grind. No boulder dodge.

---

## Differentiator vs BD / TP / old tip

| | Boulder Dodge | Terrain Park | Tip Ski School (solo) | **Race Day** |
|--|---------------|--------------|------------------------|--------------|
| Space | Straight **corridor** dodge | Rails / kickers / park line | Open face, **solo drills** | Open face **race** |
| Obstacles | Rocks / trees in pipe | Grind features | Cones / stop zone | Soft **GATE flags** (slalom-ish, not corridor walls) |
| Win | Survive / distance | Stars on features | Lesson clear + form stars | **Place + carve stars** |
| Cast | Solo rider focus | Solo | Solo coach path | **Player + 2–3 AI girl-groms** |
| Feel | Panic dodge | Trick timing | Practice ladder | Competition carve |

**MUST NOT** feel like BD (straight corridor dodge) or TP (rails/park).  
**MUST NOT** be pure solo skill drills / lesson ladder.

Differentiation kept from tip: **FULL-PHONE open snow FACE** (top→bottom Soft Alps pastel) — player carves **LEFT ↔ RIGHT** in S-curves. Competition adds the fun Ted asked for.

---

## Race beat (mock fidelity)

1. Drop onto open face under Soft Alps sky / peaks.  
2. Gate pairs (pink / mint soft flags on poles) alternate L/R down the face — rider threads the open middle, not a walled pipe.  
3. AI groms carve their own S-trails (slightly different phase / speed).  
4. HUD: place badge **P1/P2/P3**, soft speed ticks, carve-star meter.  
5. Finish banner → podium with place + ★★★ carve bonus.

---

## Cast (girl groms — fictional, no IP)

| Chip | Look (mock) | Role |
|------|-------------|------|
| **YOU** | Sky jacket + pink board | Player |
| **Mira** | Coral jacket + mint board | AI rival |
| **Jules** | Lilac jacket + gold board | AI rival |
| **Ren** (optional 3rd) | Mint jacket + coral board | AI rival |

Silhouettes: jacketed bodies, hair/helmet shapes, boards — **beyond stick figures**. No brand logos.

---

## Art bar

Match prior Soft Alps canvas-fidelity arcade mocks:

- Vector draw on `<canvas>` (not painted AI art)
- Soft Alps palette: sky `#6a9cc4→#c8dcec`, snow `#eef5fb`, pink `#ff8fbf`, mint `#6ee7b7`, gold `#ffd56a`, ink `#15202b`
- Edge trees only — **open middle face**
- Readable mobile UI (~390×844 portrait)

---

## Size / tech notes (for later tip rewrite)

| Item | Note |
|------|------|
| Mock file | `arcade/ski-school/race-day-mock.html` — single-file, canvas + tiny CSS (**~19.0KB raw / ~6.6KB gzip-9**) |
| Tip budget | Soft STOMP embed ~**70KB raw** (tip v0.1 used ~28.7KB / ~41%) |
| Race Day rewrite estimate | Mock is ~27% of tip budget; playable rewrite likely **35–55KB raw** if AI rivals + gates + podium stay canvas-vector (no bitmaps) |
| State machine | Replace `MENU → LESSON → SKILLS → CLEARED` with `MENU → RACE → PODIUM` |
| Physics reuse | Keep TOE/HEEL lean + SKID; add race scroll / gate scoring / rival AI |
| Persistence | Best place + best carve stars per session; no lesson unlock ladder |
| Out of scope until approve | Tip `index.html`, SW cache bump, play hub, release freezes |

Screenshot hooks on mock: `?shot=menu|race|podium` (or on-canvas screen chips).

---

## Done criteria (this PR)

- [x] `RACE-DAY-BRIEF.md` locked loop + controls + BD/TP contrast + size notes  
- [x] `race-day-mock.html` MENU / RACE / PODIUM  
- [x] Artifacts: `race-day-menu.png`, `race-day-race.png`, `race-day-podium.png` (~390×844)  
- [x] Tip playable untouched; no release / hub / BD / TP / Halfpipe edits  
- [x] PR open (unmerged) for Ted review  
