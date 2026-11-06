# Haven’s Garden — production art v1

Production v1 built against the locked wider concepts (01b–06b and 07–13), not another concept round and not a game rebuild. Original character/environment art follows the approved bright coloring-book garden direction. Concept and birthday-art folders were not edited. GameBoi can begin from the concept comps and swap these assets in independently.

## Drop-in mapping
- `character/`: six isolated RGBA key-pose sprites: run, jump, pick, chase, skip, plant. These are individual key poses, **not frame-by-frame animation cycles**.
- `props/`, `bugs/`, `hive/`: transparent individual world objects; net and baskets are separate attachments. Bees can be tracked independently of flowers; hive plus full/empty jars support honey stocking. A pour animation is not included.
- `plates/`: four empty 585×1266 portrait environment plates, WebP quality 80. No Haven or status UI baked in. The hive yard includes scenic bees, a hive and stocked shelf as requested; for fully dynamic honey stocking, cover/replace scenic jars or use separate object sprites. Shop card prices are intentionally baked: bigger greenhouse 50, large shovel 10, special multi-pick basket 15, daisy point icons. No counters.
- `color-by-number/`: all 15 final 585×1266 pages, lossless WebP to preserve outlines/numerals, plus contact sheet from the final pages. This is a cross-scene mode: meadow, flower rows, greenhouse, hive, bees, butterflies. No apple-tree/fence pages.
- `source/cbn/`: editable SVG for every page, exact key/region JSON, lossless RGB region-id mask, colored answer preview, and transparent `-ink.png` overlay. These make the coloring mode implementable rather than merely a picture of a coloring page. Read a mask pixel as `R*65536+G*256+B`; 0 is outside; use nearest-neighbor sampling, not interpolated mask colors. Fill all pixels of a selected id with its JSON color; composite the matching `-ink.png` above the fills on a white base. The ink overlay retains the printed key and prefilled progress colors. Region shapes are drawn in order and can overlap. Small decorative ink lines are not separate paint targets.
- `source/rebuild-cbn.py`: standalone deterministic page generator (Python + Pillow, NumPy, SciPy, CairoSVG). Run from any working directory; finds the production root relative to its own file.
- `proofs/`: labeled 16:9 character proof, object proof, contrasting-background alpha proof, wider-scale compositing proof, automated/visual QA record. Proofs intentionally include Haven; gameplay plates do not.

## Sizes / integration
All character files are 1024×1024 RGBA with a common baseline/anchor `(512,976)`. Moving upright poses have 768px visible height; bent pick is 650px and kneeling plant 640px so they do not grow larger just because they crouch. Use a common scale around **0.412** on a 585×1266 plate: moving Haven is ~316px high (25% of scene height). Alpha bounds and approximate attachment anchors are in `source/asset-layout.json`. Apply world positioning, left/right mirroring, and jump elevation in engine. Do not normalize each crouched pose independently to 768px.

Props are sized at this same 768px standing-character reference: net 450px high, flower basket 230px, can 260px, large shovel 620px, special basket 280px including sparkles. Bugs are deliberately small: ladybug 44px visible height (well below shoe size), grasshopper 112px (below calf length), bee 72px, butterfly 96px. Hive is 480px; jars 125px. Each has a clear transparent margin. Empty-jar glass has partial transparency.

## Character / camera lock
Two real short blonde side ponytails, one visibly on each side, each with pink ribbon; tails end above shoulders. Sleeveless pink daisy dress, white Peter Pan collar, white socks, red Mary Janes. Friendly five-year-old proportions, beige skin and rosy cheeks. Face stays visible. Near-front three-quarter motion was favored over side profile so no pose loses a tail. All plates leave space for the small composited child and world remains visible. No green pinecone/artichoke blobs or phone chrome.

## Color-by-number accuracy / ladder
Key 1–5: yellow, light blue, green, pink, red. Mid adds 6 brown and 7 orange. Hard adds 8 purple, 9 dark green, 10 honey gold. Numbers are generated from the same data as printed keys and interactive region maps, not invented by the image renderer. Every label seed was checked against its own visible mask region. Page 01 path is numbered yellow (1), and ladybug head is fixed black, not yellow. Page 06 sun is yellow (1), green garden is (3), watering can is orange (7); **14 paint targets**. Easy pages have 7–9 targets; mid 13–19; hard 118 / 126 / 129 / 133 / 137. The first five are deliberately quick, not timed to guarantee 30 seconds. Green backgrounds are prefilled progress on most pages. Page 06's greenhouse roof is one paint target despite its structural beam.

## Honest v1 nits / scope
- The generated art retains modest cel-style highlights/shading and a little grain in scene plates; it is not entirely flat vector ink. Faces and head angles have small pose-to-pose variations. The two tails and bare shoulders were visually checked after retries.
- Several moving poses face nearer the viewer than a strict three-quarter-right turn; this is intentional to keep both ponytails visible. They are mirrorable but not a clean side-view walk cycle.
- Flood-keyed raster sprites are defringed and have true alpha, but tiny edge roughness can show above intended gameplay scale. Net mesh is semitransparent gray/white rather than perfect vector mesh. Inspect alpha proof; no white rectangular backgrounds remain.
- CBN pages are clean, more geometric vector reinterpretations of the approved subjects, **not exact tracings** of the painterly concept linework. Hard flower pages emphasize many petal regions; their tiny numbers are best used with zoom. Mid density varies by scene rather than increasing every single page. Adult appeal has not been user-tested.
- Outdoor plates extend the sky to fit the requested tall ratio; greenhouse was resized vertically to 585×1266, slightly elongating structure. Greenhouse has repeated pink/red beds but each bed stays one type/color. Plants/watering can in plates are scenic and baked, not separate layers.
- No idle, pour/harvest animation, rig, hitboxes, or extra animation frames beyond the six requested key-pose sprites. No required named deliverable is missing.

## Integrity
`MANIFEST.txt` lists relative path, byte length and SHA-256 for every payload file (excluding itself to avoid a self-referential hash). The ZIP contains this folder, including the manifest. ZIP hash is reported separately to the parent.

## File inventory
- `bugs/bee.png`
- `bugs/butterfly.png`
- `bugs/grasshopper.png`
- `bugs/ladybug.png`
- `character/haven-chase.png`
- `character/haven-jump.png`
- `character/haven-pick.png`
- `character/haven-plant.png`
- `character/haven-run.png`
- `character/haven-skip.png`
- `color-by-number/ladder-contact.jpg`
- `color-by-number/page-01-easy-meadow.webp`
- `color-by-number/page-02-easy-meadow-path.webp`
- `color-by-number/page-03-easy-flower-bug.webp`
- `color-by-number/page-04-easy-hill-flower.webp`
- `color-by-number/page-05-easy-bees-flowers.webp`
- `color-by-number/page-06-mid-greenhouse.webp`
- `color-by-number/page-07-mid-flower-rows.webp`
- `color-by-number/page-08-mid-hive.webp`
- `color-by-number/page-09-mid-greenhouse-water.webp`
- `color-by-number/page-10-mid-color-rows.webp`
- `color-by-number/page-11-hard-hive-hex.webp`
- `color-by-number/page-12-hard-flower-rows.webp`
- `color-by-number/page-13-hard-greenhouse.webp`
- `color-by-number/page-14-hard-garden-beds.webp`
- `color-by-number/page-15-hard-butterfly-field.webp`
- `hive/hive.png`
- `hive/jar-empty.png`
- `hive/jar-full.png`
- `plates/greenhouse-color-rows.webp`
- `plates/hive-yard.webp`
- `plates/meadow-day.webp`
- `plates/shop-stand.webp`
- `proofs/QA.json`
- `proofs/alpha-check.jpg`
- `proofs/character-sheet.jpg`
- `proofs/object-sheet.jpg`
- `proofs/wider-scale-preview.jpg`
- `props/basket.png`
- `props/bug-net.png`
- `props/multi-pick-basket.png`
- `props/shovel-big.png`
- `props/watering-can.png`
- `source/asset-layout.json`
- `source/cbn/page-01-easy-meadow-answer.webp`
- `source/cbn/page-01-easy-meadow-ink.png`
- `source/cbn/page-01-easy-meadow-regions.png`
- `source/cbn/page-01-easy-meadow.json`
- `source/cbn/page-01-easy-meadow.svg`
- `source/cbn/page-02-easy-meadow-path-answer.webp`
- `source/cbn/page-02-easy-meadow-path-ink.png`
- `source/cbn/page-02-easy-meadow-path-regions.png`
- `source/cbn/page-02-easy-meadow-path.json`
- `source/cbn/page-02-easy-meadow-path.svg`
- `source/cbn/page-03-easy-flower-bug-answer.webp`
- `source/cbn/page-03-easy-flower-bug-ink.png`
- `source/cbn/page-03-easy-flower-bug-regions.png`
- `source/cbn/page-03-easy-flower-bug.json`
- `source/cbn/page-03-easy-flower-bug.svg`
- `source/cbn/page-04-easy-hill-flower-answer.webp`
- `source/cbn/page-04-easy-hill-flower-ink.png`
- `source/cbn/page-04-easy-hill-flower-regions.png`
- `source/cbn/page-04-easy-hill-flower.json`
- `source/cbn/page-04-easy-hill-flower.svg`
- `source/cbn/page-05-easy-bees-flowers-answer.webp`
- `source/cbn/page-05-easy-bees-flowers-ink.png`
- `source/cbn/page-05-easy-bees-flowers-regions.png`
- `source/cbn/page-05-easy-bees-flowers.json`
- `source/cbn/page-05-easy-bees-flowers.svg`
- `source/cbn/page-06-mid-greenhouse-answer.webp`
- `source/cbn/page-06-mid-greenhouse-ink.png`
- `source/cbn/page-06-mid-greenhouse-regions.png`
- `source/cbn/page-06-mid-greenhouse.json`
- `source/cbn/page-06-mid-greenhouse.svg`
- `source/cbn/page-07-mid-flower-rows-answer.webp`
- `source/cbn/page-07-mid-flower-rows-ink.png`
- `source/cbn/page-07-mid-flower-rows-regions.png`
- `source/cbn/page-07-mid-flower-rows.json`
- `source/cbn/page-07-mid-flower-rows.svg`
- `source/cbn/page-08-mid-hive-answer.webp`
- `source/cbn/page-08-mid-hive-ink.png`
- `source/cbn/page-08-mid-hive-regions.png`
- `source/cbn/page-08-mid-hive.json`
- `source/cbn/page-08-mid-hive.svg`
- `source/cbn/page-09-mid-greenhouse-water-answer.webp`
- `source/cbn/page-09-mid-greenhouse-water-ink.png`
- `source/cbn/page-09-mid-greenhouse-water-regions.png`
- `source/cbn/page-09-mid-greenhouse-water.json`
- `source/cbn/page-09-mid-greenhouse-water.svg`
- `source/cbn/page-10-mid-color-rows-answer.webp`
- `source/cbn/page-10-mid-color-rows-ink.png`
- `source/cbn/page-10-mid-color-rows-regions.png`
- `source/cbn/page-10-mid-color-rows.json`
- `source/cbn/page-10-mid-color-rows.svg`
- `source/cbn/page-11-hard-hive-hex-answer.webp`
- `source/cbn/page-11-hard-hive-hex-ink.png`
- `source/cbn/page-11-hard-hive-hex-regions.png`
- `source/cbn/page-11-hard-hive-hex.json`
- `source/cbn/page-11-hard-hive-hex.svg`
- `source/cbn/page-12-hard-flower-rows-answer.webp`
- `source/cbn/page-12-hard-flower-rows-ink.png`
- `source/cbn/page-12-hard-flower-rows-regions.png`
- `source/cbn/page-12-hard-flower-rows.json`
- `source/cbn/page-12-hard-flower-rows.svg`
- `source/cbn/page-13-hard-greenhouse-answer.webp`
- `source/cbn/page-13-hard-greenhouse-ink.png`
- `source/cbn/page-13-hard-greenhouse-regions.png`
- `source/cbn/page-13-hard-greenhouse.json`
- `source/cbn/page-13-hard-greenhouse.svg`
- `source/cbn/page-14-hard-garden-beds-answer.webp`
- `source/cbn/page-14-hard-garden-beds-ink.png`
- `source/cbn/page-14-hard-garden-beds-regions.png`
- `source/cbn/page-14-hard-garden-beds.json`
- `source/cbn/page-14-hard-garden-beds.svg`
- `source/cbn/page-15-hard-butterfly-field-answer.webp`
- `source/cbn/page-15-hard-butterfly-field-ink.png`
- `source/cbn/page-15-hard-butterfly-field-regions.png`
- `source/cbn/page-15-hard-butterfly-field.json`
- `source/cbn/page-15-hard-butterfly-field.svg`
- `source/rebuild-cbn.py`
- `README.md`
- `MANIFEST.txt`
