# Ski School · Big Air — concept brief (mocks only)

**Status:** Ted rejected Race Day (too girl-themed / “trying too hard”; face carving without gates doesn’t work).  
**New direction:** Slopestyle **jump competition** — BIG AIR, LONG JUMP, SLOPESTYLE.  
**This PR:** brief + canvas mock + screenshots only. Tip `arcade/ski-school/index.html` stays as-is until Ted says rewrite.  
**Do not touch:** `arcade/release/`, `/arcade/play/`, QR, Boulder Dodge, Terrain Park, Halfpipe.

Working title: **Ski School · Big Air**

---

## Locked loop

```
MENU  →  JUMP (attempt)  →  LEADERBOARD
  ↑______________ best of 3 ______________|
```

| Screen | Job |
|--------|-----|
| **MENU** | PLAY-first. Pick event: **BIG AIR** / **LONG JUMP** / **SLOPESTYLE**. Soft Alps, neutral mixed cast chips. No lesson ladder. |
| **JUMP** | Hero side-view **kicker** fills the phone. Visible flight arc, height + distance readouts, landing grade. |
| **LEADERBOARD** | Standings vs 3–4 AI riders after each attempt. Best of 3. Rematch / next event CTA. |

Audience: general STOMP tip players (mixed cast — **no gendered theming**, no pastel “girl grom” styling).

---

## Events

| Event | Shape | Score |
|-------|-------|-------|
| **BIG AIR** | One huge kicker | Pop timing + spin/grab hold + stomp → judged points + landing grade |
| **LONG JUMP** | Same kicker, distance focus | Measured meters; landing-zone sweet spot bonus |
| **SLOPESTYLE** | 3 jumps in a run | Sum of jump scores across the line |

Mock default shot = **BIG AIR** mid-flight (hero beat).

---

## Controls (jump is the verb)

| Input | When | Action |
|-------|------|--------|
| **TAP** (or POP) | Approach / lip | Timing for pop — early / perfect / late |
| **HOLD** | In air | Spin / grab charge |
| **RELEASE** | Pre-landing | Set rotation for stomp |
| *(optional)* lean L/R in air | In air | Grab variant / board tweak — mock shows hold meter only |

No rails. No dodge. No face S-carve race.

---

## Scoring & grades

**Landing grade (always shown):** `PERFECT` · `GOOD` · `SKETCHY` · `BAIL`

| Grade | Feel |
|-------|------|
| PERFECT | Stomp in sweet spot, rotation clean |
| GOOD | Solid, small scrub |
| SKETCHY | Hand drag / over-rotate |
| BAIL | Butt / face plant — low or zero for that attempt |

**BIG AIR points** ≈ pop window × air tricks × landing multiplier.  
**LONG JUMP** ≈ distance (m) + zone bonus − bail.  
**SLOPESTYLE** ≈ sum of 3 jump scores.  
**Session:** best of **3 attempts** vs AI field on a shared leaderboard.

---

## Differentiator vs TP / BD / old Race Day

| | Terrain Park | Boulder Dodge | Race Day (rejected) | **Big Air** |
|--|--------------|---------------|---------------------|-------------|
| Space | Endless scroll park | Corridor dodge | Open face carve race | **Side-view kicker** hero shot |
| Features | Rails / boxes / mixed | Rocks / trees | Gate flags + S-trails | **One (or 3) jump(s)** |
| Win | Feature stars / survive | Distance / lives | Place + carve stars | **Judged air / distance** vs AI |
| Cast | Solo | Solo | Girl-grom themed | **Neutral mixed cast** |
| Camera | Top-down-ish scroll | Down-pipe | Top-down face | **Side profile arc** |

**MUST NOT** feel like TP (rails, endless park scroll) or BD (dodging).  
**MUST NOT** lean on gendered pastel theming or left↔right face carving as the core verb.

---

## Jump hero beat (mock fidelity)

1. Soft Alps sky + peaks behind a **big side-view kicker** (approach → lip → table/void → landing).  
2. Rider on a **visible parabolic arc** with dashed ghost path.  
3. HUD: **HEIGHT** (m) · **DIST** (m) · hold/spin meter · attempt `2/3`.  
4. Landing zone marks (sweet spot tint).  
5. Grade chip pops on touchdown → leaderboard.

---

## Cast (neutral — fictional, no IP)

| Chip | Look (mock) | Role |
|------|-------------|------|
| **YOU** | Blue jacket · charcoal board | Player |
| **Kai** | Orange jacket · slate board | AI |
| **Sam** | Forest jacket · cream board | AI |
| **Rio** | Ink jacket · gold board | AI |
| **Ash** *(optional 5th)* | Steel jacket · mint board | AI |

Silhouettes: jacketed bodies, helmets/goggles, boards — readable, not stick figures. **No brand logos.** Soft Alps palette without pink-forward “girl” chrome.

---

## Art bar

Match STOMP Soft Alps canvas-fidelity (vector on `<canvas>`):

- Sky `#5b8fb5 → #b7cfe0`, snow `#e8f0f6`, ink `#15202b`, accent gold `#ffd56a`, mint `#5ec4a0`, coral `#e87a5d` (sparingly for grade/CTA — not cast theming)
- Peaks + edge trees as atmosphere only  
- Readable mobile UI (~390×844 portrait)  
- **Not** painted AI art; **not** Race Day pastel-pink cast UI

---

## Size / tech notes (for later tip rewrite)

| Item | Note |
|------|------|
| Mock file | `arcade/ski-school/big-air-mock.html` — single-file canvas (**19328 raw / 6261 gzip-9**) |
| Tip budget | Soft STOMP embed ~**70KB raw**; keep **gzip ≪ 70KB** — target tip rewrite **≤ ~55KB raw / ≪ 70KB gzip** |
| State machine | `MENU → JUMP → LEADERBOARD` (event sub-mode on MENU) |
| Physics | Side-view ballistic arc + lip pop window + landing grade; AI = scored ghosts / canned attempts |
| Persistence | Best attempt per event; field standings for session |
| Out of scope until approve | Tip `index.html`, SW cache bump, play hub, release freezes |

Screenshot hooks: `?shot=menu|jump|leaderboard`.

---

## Done criteria (this PR)

- [x] `BIG-AIR-BRIEF.md` — loop, controls, scoring, TP/BD contrast, size plan  
- [x] `big-air-mock.html` — MENU / JUMP / LEADERBOARD  
- [x] Artifacts: `big-air-menu.png`, `big-air-jump.png`, `big-air-leaderboard.png` (~390×844)  
- [x] Race Day mock/brief/screens retired from PR  
- [x] Tip playable untouched; no release / hub / BD / TP / Halfpipe edits  
- [x] PR #55 updated (unmerged) for Ted review  
