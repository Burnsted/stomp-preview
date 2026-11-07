# Halfpipe Jam — size audit (Batch C)

**Choice:** isolated optional module under `arcade/halfpipe-jam/` (not folded into TP tip).

## Before → after

| | Raw | gzip-9 |
|--|----:|-------:|
| index **v0.2.0** (pre–Batch C) | 38,146 | 13,272 |
| index **v0.3.0-batchC** | 41,637 | 14,429 |
| sw.js v0.3.0 | 1,164 | ~575 |
| **Halfpipe combined after** | **42,801** | **14,886** |
| Soft budget | — | ~70,000 |
| TP tip combined (compare) | 75,025 | 24,724 |

**Verdict:** ~15 KB gzip — still well under ~70 KB soft budget after momentum/weather/challenge polish.

Freeze paths untouched: `arcade/release/`, `arcade/play/`, BD tip, TP tip.
