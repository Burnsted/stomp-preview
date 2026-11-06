# Haven’s Garden — v2 extra-easy PLUS

Eight NEW preschool coloring-book pages, added on top of approved v2. The approved 12 easy/hard pairs (24 pages) are UNCHANGED: all 151 existing v2 files were SHA-256 compared against a pre-build baseline and match exactly. No other production art or existing ZIP was edited.

## Contents and counts

- `page-13-one-daisy.webp` — **10** paint targets.
- `page-14-one-honey-jar.webp` — **6** paint targets.
- `page-15-simple-bee.webp` — **7** paint targets.
- `page-16-simple-butterfly.webp` — **9** paint targets.
- `page-17-simple-ladybug.webp` — **8** paint targets.
- `page-18-watering-can.webp` — **7** paint targets.
- `page-19-small-hive.webp` — **8** paint targets.
- `page-20-one-tulip.webp` — **7** paint targets.

62 paint targets total; every page is within the required 6–15 range. Each page uses only 4–5 colors from the shared palette. White / 9 is an intentional paint choice on bee and ladybug.

## Art and difficulty

Original hand-authored vector illustration, rasterized to clean coloring-book art, then numbered and keyed programmatically. These are eight independent single-object compositions, not edits or copies of approved scenes, not a repeated landscape template, and not game-IP reproductions. Large closed shapes, approximately 7 px dark outlines, white paper, minimal inner detail, and bottom color keys. Subject labels appear ONLY on the contact sheet, never on playable pages. No phone chrome, titles, watermarks, or character assets.

The 30-second preschool completion target assumes tap-to-fill game play. It has not been timed with children. Stems, the can handle/lip, and the hive base are intentionally narrower than the main shapes; their labels remain 30 px or larger. Main-region numbers are generally 40–44 px. Background paper is not a paint target. Colors are playful/stylized; the bee intentionally has one white and one blue wing.

## Exact exports and integration

Every playable page is **585 × 1266 lossless WebP**. `source/` provides per page:
- `-drawing.png`: clean unnumbered, unkeyed white drawing.
- `-drawing.svg`: editable original vector bonus source.
- `-regions.png`: **16-bit grayscale PNG**, value = target_id, 0 = non-target. Preserve 16-bit values; do NOT convert to old v1 RGB masks.
- `.json`: v2-compatible page, subject, difficulty (`extra-easy`), dimensions, target_count, used palette only, and regions with id, x/y seed, r, area, cx/cy, color_number, color_hex, target_id.
- `-ink.png`: RGBA outlines + programmatically stamped numbers + complete bottom key chrome. Composite above target fills on white paper.
- `-answer.webp`: matching colored composite preview, retaining numbers and key.

For tap-to-fill: sample the page-coordinate mask, look up that target_id in JSON, fill its mask with color_hex, and composite the matching RGBA ink above. Numbers printed in regions are stable PALETTE IDs, not target IDs; repeated color numbers are expected. Only colors actually used appear in each bottom key. `r` is interior clearance at the seed; `area` is target pixel count; cx/cy is the actual mask centroid. Each target is one connected region.

Shared palette: 1 Sunshine #FFD63C; 2 Sky blue #96D9F5; 3 Leaf green #83C363; 4 Petal pink #F69CBD; 5 Poppy red #EF6060; 6 Clay / gold #D49A5C; 7 Lavender #B59BDF; 8 Deep brown #795542; 9 White #FFFFFF.

## Proof and QA

`contact-8-extra-easy.jpg`: **1920 × 1440 landscape**, 4 columns × 2 rows, labels 13–20, un-stretched portrait thumbnails.
`region-counts.json`: target counts. `QA.json`: per-page PASS for keys/seeds, 16-bit mask headers and roundtrip, count budgets, connected targets, independent exported-file validation, and visual review. Every JSON seed was sampled against its own target_id. Every region color exists in the exact page key, with the same hex. All eight full-size numbered pages and contact sheet were visually opened and checked.

## Checksums and archive

`SHA256SUMS.txt` covers immutable exported assets and QA; README is deliberately excluded because the folder copy receives the ZIP checksum after packaging. The ZIP contains this README before that checksum receipt is appended (a ZIP cannot contain its own cryptographic hash). The folder README and sibling `.zip.sha256` are the authoritative archive receipt.

Archive: `/workspace/for-ted/HAVENS-GARDEN-CBN-V2-EASY-PLUS.zip`
