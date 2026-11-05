# Halfpipe Jam — size audit (Batch A)

**Choice:** ship as **isolated optional module** under `arcade/halfpipe-jam/` (not merged into Terrain Park tip). Keeps TP tip gzip unchanged and avoids silent bloat.

Measured on this branch (`gzip -9`):

| Asset | Raw bytes | gzip -9 |
|-------|----------:|--------:|
| `arcade/halfpipe-jam/index.html` | 31175 | 11066 |
| `arcade/halfpipe-jam/sw.js` | 1164 | 574 |
| **Halfpipe combined** | **32339** | **11512** |
| `arcade/terrain-park/index.html` (tip compare) | 73858 | 24265 |
| TP tip combined (index+sw) | 75025 | 24724 |
| Soft budget (per shippable game) | — | ~70000 |

**Verdict:** Halfpipe Jam Batch A sits at 11,512 bytes gzip (~11.2 KB) — well under the ~70 KB soft budget and smaller than the TP tip (24,724 bytes gzip). Safe to keep isolated; do **not** fold into TP until owner approves a tip ship.

Freeze paths untouched: `arcade/release/`, `arcade/play/`, BD tip, TP tip.
