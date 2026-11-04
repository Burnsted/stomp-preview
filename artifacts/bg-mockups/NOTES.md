# Background mockups — BD + TP (samples only)

**Scope:** `artifacts/bg-mockups/` only. Tip games, `/arcade/release/`, and `/arcade/play/` were **not** changed.

## Current tip (control)

Both games use the same structure today:

- 2 jagged “square-wave” ridge fills (no snow caps)
- One uniform triangle tree every ~90–100px (same size, no snow)

That’s why the run reads flat/monotonous.

| Control PNG | Path |
|-------------|------|
| BD now | `artifacts/bg-mockups/bd-now.png` |
| TP now | `artifacts/bg-mockups/tp-now.png` |

## Options (frozen in-run frames, 1280×720)

Shared vector idea (all options): `mtRidge()` mountain polyline + soft snow-cap wedges · `pine()` 3-tier canopy + white tip wedges · far/mid/near scales.

### Boulder Dodge (polar day palette)

| ID | Name | What it does | PNG |
|----|------|--------------|-----|
| **A** | **Ridge + snow caps** | 2 mountain layers w/ snow caps; far tiny pines + mid mix + 3 near tall; snow tips on most trees | `bd-opt-a.png` |
| B | Soft Alps | Softer / fuller mid tree band; lighter far ridge; denser short trees | `bd-opt-b.png` |
| C | Sparse alpine | Stronger mountain silhouette; few statement tall trees; roomier sky | `bd-opt-c.png` |

### Terrain Park (purple dusk `#2a1458` family)

| ID | Name | What it does | PNG |
|----|------|--------------|-----|
| **A** | **Ridge + snow caps** | Same structure as BD-A, purple mountain/tree fills + lavender snow tips | `tp-opt-a.png` |
| B | Soft Alps dusk | Denser mid band in purple; softer far ridge | `tp-opt-b.png` |
| C | Sparse alpine dusk | Big mountain read; sparse tall trees | `tp-opt-c.png` |

Interactive compare page: `artifacts/bg-mockups/index.html` (also has labeled cards for all 8 frames).

## Size if wired into a tip game

Estimate replacing current `ridge()` + uniform `tri`/`pine` loop with shared helpers + Option A draw list:

| | Raw | gzip-9 |
|--|----:|-------:|
| Helpers (`mtRidge` + `pine`) | ~1140 B | ~525 B |
| Option A draw calls | ~530 B | ~350 B |
| Removed old ridge+trees | ~−430 B | ~−307 B |
| **Net delta (per game)** | **~+1.2 KB** | **~+0.5 KB** |

Options B/C reuse the same helpers — code size is essentially the same; B draws a few more mid trees (CPU, not bytes). Parallax can reuse existing `S.dist * par` offsets on the mountain point lists / tree x positions with almost no extra bytes.

**Budget note:** BD tip is already near the soft ~70KB STOMP embed ceiling (~77 B headroom after v0.7.10). Integrating A needs a small cleanup pass or accepting slight overage. TP has more room.

## Recommendation

| Game | Pick | Why |
|------|------|-----|
| **Boulder Dodge** | **A · Ridge + snow caps** | Clearest fix for Ted’s three complaints (mountains, size variety, snow on trees) without Soft Alps denseness that can muddy hazard read on a bright day sky. |
| **Terrain Park** | **A · Ridge + snow caps** | Same language as BD so both feel “upgraded together”; purple dusk still reads; denser Soft Alps (B) competes with park feature silhouettes. |

C is a good alternate if Ted wants more sky / less forest after seeing A in-game.

## Promote later (when Ted picks)

Port only the chosen option’s helpers into tip `draw()` — do **not** copy this mockup page into tip. Keep release freezes unchanged until a deliberate promote.
