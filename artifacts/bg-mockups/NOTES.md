# Background mockups v2 — Soft Alps trees + new mountains

**Scope:** `artifacts/bg-mockups/` only. Tip / release / play **unchanged**.

## Ted feedback (round 1)
- **Keep** Option B trees (Soft Alps denser band, varied sizes + snow tips) for **both** BD and TP.
- Mountains felt flat/samey — need clearer ridgelines, uneven heights, snow caps on **some** peaks only.

## Round 2b — bold mountain snow (Ted: prior caps invisible)

Critical fix: previous caps were tiny/low-contrast and read as “no snow.” Caps are now **48–72px filled white/cream wedges**, drawn after all mountain layers. Option B trees unchanged.

## Round 2 — mountain variants (trees = Soft Alps B)

All new frames use the Soft Alps tree band. Mountains are 3 layers (far / mid / near foothills) with stroked ridgelines. **Snow caps are bold white/cream filled wedges** (48–72px deep) drawn *after* all mountain layers so they stay phone-readable — some peaks capped, some bare.

| ID | Name | Mountain idea | PNG |
|----|------|---------------|-----|
| **BD-B1** | Soft Alps + crenellated range | Many uneven peaks; bold snow on ~⅓ of tallest | `bd-b1.png` |
| **BD-B2** | Soft Alps + statement peaks | 2–3 dramatic tall peaks with big snow wedges; lower shoulders bare | `bd-b2.png` |
| **BD-B3** | Soft Alps + left massif | Asymmetric tall left massif + broken right ridge + selective caps | `bd-b3.png` |
| **TP-B1** | Soft Alps dusk + crenellated | Same silhouette as BD-B1, purple dusk + cream caps | `tp-b1.png` |
| **TP-B2** | Soft Alps dusk + statement peaks | Same as BD-B2, purple + cream caps | `tp-b2.png` |
| **TP-B3** | Soft Alps dusk + left massif | Same as BD-B3, purple + cream caps | `tp-b3.png` |

Prior round kept for compare: `bd-now.png`, `tp-now.png`, `bd-opt-b.png`, `tp-opt-b.png` (old flat mountains + Soft Alps trees).

Compare page: `artifacts/bg-mockups/index.html`

## Size if wired (estimate)
Same helpers as before + peak snow flags / ridgeline stroke:

| | Raw | gzip-9 |
|--|----:|-------:|
| Net vs tip ridge+uniform trees | **~+1.4–1.6 KB** | **~+0.55–0.65 KB** |

B1/B2/B3 share code — only point lists differ (negligible).

## Recommendation
| Game | Trees | Mountains |
|------|-------|-----------|
| **Boulder Dodge** | Soft Alps (B) | **B2 · statement peaks** |
| **Terrain Park** | Soft Alps dusk (B) | **B2 · statement peaks** |

**Why B2:** Strongest height variation Ted asked for (tall snow-capped statements vs bare shoulders), still quiet enough not to fight hazards/features. B1 is denser/more “busy” skyline; B3 is nice but left-heavy and may feel odd when the camera scrolls.

## Promote later
When Ted confirms: port Soft Alps trees + chosen mountain point lists into tip `draw()` only — leave release freezes until a deliberate promote.
