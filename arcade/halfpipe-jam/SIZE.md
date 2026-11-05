# Halfpipe Jam — size audit (Batch A + Ted feedback)

**Choice:** isolated optional module under `arcade/halfpipe-jam/` (not folded into TP tip).

## Before → after (this revision)

| | Raw | gzip-9 |
|--|----:|-------:|
| index.html **before** (v0.1.0) | 31,175 | 11,066 |
| index.html **after** (v0.2.0) | 38146 | 13272 |
| sw.js after | 1164 | 575 |
| **Halfpipe combined after** | **39310** | **13733** |
| TP tip combined (compare) | 75,025 | 24724 |
| Soft budget | — | ~70,000 |

**Verdict:** Still well under ~70 KB gzip. Progression/weather/board locker added without approaching budget.

Freeze paths untouched: `arcade/release/`, `arcade/play/`, BD tip, TP tip.
