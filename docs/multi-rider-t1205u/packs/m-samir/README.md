# STOMP Look 1 (m-samir): registered visual prototype, 2026-11-04

**Reference identity**: Adult Look 1, main male rider from approved v2.4 roster. Black hair, light facial hair, purple mirror goggles, tan/black technical shell and black snowboard pants. This prototype uses **unaltered photo pixels** from the original approved lookbook for his head, tan jacket, black pants, gloves and boots. The character is in the **same fixed three-quarter pose** in all three states.

**Three states**:
- `A_underbody@1024.png`: jacket OFF with a simple dark constructed technical underlayer. This is *not* hidden photographic anatomy.
- `B_tan_APPROVED@1024.png`: approved tan jacket + black pants (registration check).
- `C_orange_TEST@1024.png`: registered orange/charcoal recolor as a male color-family test; not a new approved default.

**Actual files**:
- `plates-1024/`: 8 separately transparent RGBA layers.
- `webp-512/`: matching independent registered WebP plates at exactly 512x512 with alpha.
- `STOMP_m-samir_registered_layers.ora`: a genuine multi-layer editable OpenRaster/Krita/GIMP master, not a flattened sheet.
- `manifest.json`: file hashes, source frame and shared affine registration transform.

**Known limitations / open gates**:
- Front and side turnarounds in the approved lookbook are separate static references; this test uses the large 3/4 hero only.
- The dark torso/arms are painted inside the silhouette, not reconstructed from unseen photo detail. A jacket-off quality pass is required.
- The asset comes from a lookbook with dark background; mask edges need detailed production cleanup before final acceptance.
- The head is **one combined locked photo layer**, so independent hair/helmet/goggles are still missing.
- Snowboard/bindings and a genuine independently swappable backpack are missing.
- Orange is a fit test only; the male four-colors remain tan/orange/white/blue camo, but white/blue camo are not generated here.
- Physical Android device and Woz AvatarRenderer/Locker acceptance have NOT been run.

**Engineering instructions**: stage on a new isolated draft branch, preserve the exact character identity and fixed registration; use a single transform for all layers, not tight-crop/center per jacket. Verify images in real renderer, inspect underbody sleeve/neck/waist, verify tan→orange triggers jacket AND pants itemIds, and report PASS/FAIL/blockers honestly. No merge, no youth activation, no deployment.
