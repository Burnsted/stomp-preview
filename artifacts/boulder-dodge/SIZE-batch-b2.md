# Boulder Dodge Batch B2 — size audit (Ted playtest)

Version **v0.8.1-batch-b2**. Soft budget ~70KB gzip.

| File | main tip raw/gzip | v0.8.0 raw/gzip | v0.8.1 raw/gzip | Δ gzip vs 0.8.0 |
|------|-------------------|-----------------|-----------------|-----------------|
| index.html | 69937/23516 | 82631/27664 | 87177/29002 | +1338 |
| sw.js | 1168/580 | 1170/579 | 1172/581 | +2 |

**Tip total now:** 88349 raw / **29583 gzip** (well under 70KB).

Changes vs 0.8.0: removed Rockfall falling rocks; grounded MASSIVE ROCK event; rock S/M/L/XL art+hitboxes; wildlife art pass; Wood→Mid→Silver→Gold board tiers with visual decks.

Tradeoffs: +~1.3KB gzip for art/tier UI; Rockfall code removed to reclaim some bytes.
