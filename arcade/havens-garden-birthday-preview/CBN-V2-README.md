# Haven’s Garden — color-by-number v2

Ted-requested replacement for the rejected repeated v1 ladder. **Only this color-by-number replacement was created.** Characters, props, bugs, hive assets, plates, existing proofs, and old color-by-number pages remain unchanged.

## Twelve genuinely different subjects

Each has `page-NN-subject-easy.webp` and `page-NN-subject-hard.webp` (585×1266, lossless WebP):

1. `bee-close` — easy **52** / hard **103** numbered paint targets.
2. `bees-and-flowers` — easy **38** / hard **76** numbered paint targets.
3. `ladybug-daisy` — easy **37** / hard **81** numbered paint targets.
4. `butterfly-sunflower` — easy **32** / hard **64** numbered paint targets.
5. `grasshopper-grass` — easy **62** / hard **124** numbered paint targets.
6. `hive-close` — easy **60** / hard **120** numbered paint targets.
7. `honey-jars` — easy **73** / hard **146** numbered paint targets.
8. `flower-basket` — easy **148** / hard **295** numbered paint targets.
9. `watering-can-tulips` — easy **49** / hard **98** numbered paint targets.
10. `greenhouse-rows` — easy **60** / hard **120** numbered paint targets.
11. `meadow-path` — easy **100** / hard **199** numbered paint targets.
12. `bug-net-flowers` — easy **75** / hard **152** numbered paint targets.

## Easy versus hard

Each easy page is a simplified edit of its own hard illustration, not a different scene or a recolor. Compositions, poses, main objects and silhouettes remain recognizable as the same picture. Easy art removes inner details (wing cells, pollen cells, wicker weave, lid patterns, leaf veins, path stones and other small partitions). The largest easy fills are numbered; tiny remaining unnumbered decorative spaces stay white. This combines actual drawing simplification with fewer active paint targets: **about half as many numbered targets** per pair. It is not a claim that every single black outline was merged away.

Hard pages retain illustrated detail for longer sessions. There is no timed-completion promise; the densest pages benefit from zoom. All art is original generated garden illustration, not copied game assets. No phone chrome, watercolor, or repeated geometric scene template.

## Proofs

- `contact-12-subjects.jpg`: the twelve different HARD compositions, labeled 01–12.
- `pairs-easy-hard.jpg`: three full-size EASY | HARD pairs (bee, hive, net).
- `source/all-easy-review.jpg`: all twelve easy pages for additional comparison.
- `region-counts.json` and `QA.json`: actual target counts and key/mask validation.

## Color accuracy and game integration

Numbers and printed keys were added programmatically, not entrusted to the image generator. Every printed target number exists in that page’s key, from the same JSON palette. Colors use consistent IDs across the set; a page prints only the colors it actually uses. White (9) is an intentional fill choice, not a missing color.

`source/` contains, for every page:
- `-drawing.png`: clean drawing before printed numbers/key;
- `-regions.png`: **16-bit grayscale** target-ID mask, 0 = non-target. Preserve 16-bit values when loading. Do not treat as old v1 RGB masks;
- `.json`: target ID, color number, exact hex, seed location and palette;
- `-ink.png`: page RGBA overlay; place above a white background and target fills;
- `-answer.webp`: colored target preview (decorative unnumbered details remain white).

Masks are already at page coordinates. Sample target ID, fill that ID using JSON hex, composite the matching ink overlay. All 24 seeds were checked against their own target masks; all keys were checked against all target colors. This is a new independent folder; the old v1 sources were not modified.

## Honest remaining nits

- Simplification is not pixel-identical tracing: small contour and spacing changes remain, but no easy page changes to a new subject or scene.
- Easy mode leaves some tiny decorative details unnumbered/white rather than merging every last line. Some easy pages (especially the flower basket) still have plenty of outlines even with half the active paint targets.
- Some hard labels are small; use pinch-zoom in the game. Dense ornamental flower centers are not all separate targets.
- Easy flower-basket handle is inked black rather than a paintable wicker fill. Easy net loses fine mesh detail deliberately.
- Some larger residual areas can also remain unnumbered (for example the right leaf on easy 03), not only micro-details. These stay white in the supplied masks.
- Some flowers and leaves have stylized rather than strictly natural color choices. No known key-number mismatch remains.
