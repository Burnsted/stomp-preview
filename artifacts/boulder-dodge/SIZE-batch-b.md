# Boulder Dodge Batch B — size audit

Soft budget ~70KB gzip. Tip only (`arcade/boulder-dodge/`).

| File | Before raw | Before gzip-9 | After raw | After gzip-9 | Δ raw | Δ gzip |
|------|------------|---------------|-----------|--------------|-------|--------|
| index.html | 69937 | 23516 | 82631 | 27664 | +12694 | +4148 |
| sw.js | 1168 | 580 | 1170 | 579 | +2 | -1 |
| **TOTAL tip** | 71105 | 24096 | 83801 | 28243 | +12696 | +4147 |

Version: **v0.8.0-batch-b**

Tradeoffs: stayed well under 70KB gzip (~27.7KB). Added conditions/events/chapters/challenges/near-miss/achievements/wipe UI in the single tip HTML; no large assets.
