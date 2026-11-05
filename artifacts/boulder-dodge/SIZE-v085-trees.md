# Boulder Dodge v0.8.5-trees size

| asset | raw | gzip-9 |
|-------|-----|--------|
| index.html | 102239 | 32976 |
| soft budget | — | ~70KB gzip |

Fix: trees were planted with `gY(screenX)` (player-frame terrain), so the line rode the rider conveyor. Now world-fixed `terr(worldX)` + horizontal parallax only.

PR #50 tip only — do not merge.
