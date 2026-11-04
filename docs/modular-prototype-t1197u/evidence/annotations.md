# t1197u visual annotations — Franz crotch clip

Status: **REGISTERED_VISUAL_PROTOTYPE_ONLY** — not Android-accepted.

## Body plate (crotch clip)
- `body-athletic@512.webp` sha256 `c69f7d872043c36432f7e0035deb2021c54514d5b781e18f23ffa04d11b0a999` (7082 bytes)
- Replaces prior art-pass body `451ae7ed…`
- Rule: truncate below pants_top+40; tuck only where pants alpha>40; crotch gap fill 0
- Paint order: pants → body → jacket

## Crotch gap — body contribution (isolated)
Method: compare composites with/without body; count gap ROI pixels that gain opacity from body only.

| Variant | body α in gap | gained opaque from body | alpha-up from body |
|---|---:|---:|---:|
| A jacket-off | 1 | 0 | 0 |
| B mint | 1 | 0 | 0 |
| C ink | 1 | 0 | 0 |

- A torso-above-waist opaque px = **7016**
- Verdict: crotch T **CLEARED**; A torso tuck **OK**
- ≤2 fringe px allowed; jacket/pants silhouette in ROI is not body bleed.

## Still OPEN (do NOT fake-PASS)
- head_locked leftovers on jacket-off: chin notch / braid wisp / chest slashes (Ted face-lock)
- body painted graphic not photo anatomy
- ink green-excess edge pass deferred
- Android device proof not run

Evidence: `*-bodyclip-*.png`, `ABC-bodyclip-side-by-side.png`, `*-bleed-heatmap.png`, `crotch-clip-metrics.json`, `proofs/franz-abc-bodyclip.png`, `proofs/zoom_crotch_*.png`
