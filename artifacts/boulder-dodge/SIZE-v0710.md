# Boulder Dodge size audit — v0.7.10 cleanup

Soft STOMP embed budget: **~70KB** raw (index.html + sw.js).

## Before cleanup (v0.7.9)

| File | Raw | gzip -9 |
|------|----:|--------:|
| index.html | 69931 | 23943 |
| sw.js | 1114 | 544 |
| **total** | **71045** | **24487** |

Over budget by **1045** bytes.

## After cleanup + board locker panel (v0.7.10)

| File | Raw | gzip -9 |
|------|----:|--------:|
| index.html | 68807 | 23049 |
| sw.js | 1116 | 546 |
| **total** | **69923** | **23595** |

Delta vs before: **-1122** raw / **-892** gzip.
Headroom under 70KB: **77** bytes.
Flag: NEAR budget (<0.5KB headroom).

## What was removed
- Dead run-log state: `blog`, `log`, `wlog`, `warnLog`, `arrGapMin`, `lastTail`, `minGapT` + all push sites
- Unused arrival/visibility telemetry (`visT`/`arrT` gap bookkeeping)
- Verbose art/comment chatter; slimmed legend copy

## What stayed
Board SPD ladder, tabletops/kickers, hold-flip, double-tap, near-miss/combo, difficulty, home legend icons, GD-style mild level curve, polar/animals, scrape, mute, gameplay.

## Terrain Park (board locker v0.3.6)
| File | Raw | gzip -9 |
|------|----:|--------:|
| index.html | 72656 | 23621 |
| sw.js | 1091 | 529 |
| **total** | **73747** | **24150** |

TP board ladder: Grom Deck → Box Cruiser (2 lines) → Rail Steel (4) → Kicker Pop (7) → Pro Park (10). Mild LV curve; boards are the speed goal.
