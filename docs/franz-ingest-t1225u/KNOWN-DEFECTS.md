# Known defects and honest limits — 2026-11-05 EST

## Scope and source evidence
Eight approved-reference appearances located, not 18. Counts: 0 finished, 8 partial, 10 missing approved artwork. Rider 1 found; appearance restored in a new local artwork package, NOT restored in app code.

Latest owner screenshots of the listed defects were NOT found in connected Drive searches or box/chat-adjacent folders. Existing Woz 390x844 screenshots are integration evidence, not substituted for owner screenshots. Therefore no claim that the two Grom screenshot identities were confirmed.

## Actual repairs performed
Four existing nonblank layered ORAs were opened. Interior cloth alpha was repaired only inside source-backed individual garment masks. Source RGB restored where the matte had erased fabric/boot detail. No whole-character shape behind artwork, no mountain concealment, no face generation, no face/body changes. Separate jacket/pants/glove/boot layers retained. Head and body files byte-identical in all four repaired packages.

- Man 1 / Rider 1: tan hem pixels incorrectly erased beside left glove recovered to jacket only. Gloves not polluted with jacket cloth. Clothing opacity interiors repaired.
- Woman 2: mint jacket/pants/cuffs and boot opacity repaired; obvious missing left toe patch and translucent light sole closed from the existing reference. No shoulder/face design change.
- Woman 3: Batch B clothing interior opacity; pronounced transparent boot upper/sole patches restored from original registered source.
- Man 2 / Look 4: Batch B garment/glove/boot interior opacity. This remains a test prototype, NOT owner visual PASS. White alternate remains test and is NOT Man 3.

Changed-alpha pixel counts by layer (not a completeness score):
```
{
  "Man 1 / Rider 1": {
    "jacket_tan": 1388,
    "pants_black": 1989,
    "gloves": 621,
    "boots": 920,
    "source-hem-recovery": 348
  },
  "Woman 2": {
    "jacket_mint": 1936,
    "pants_mint": 2601,
    "gloves": 745,
    "boots": 2664
  },
  "Woman 3": {
    "jacket_purple": 11524,
    "pants_purple": 4848,
    "gloves": 1392,
    "boots": 4477
  },
  "Man 2 / Look 4": {
    "jacket_orange": 1642,
    "pants_charcoal": 2088,
    "gloves": 1165,
    "boots": 2089
  }
}
```

## Remaining visible/structural defects
- Man 1 / Rider 1: locked head carries tan chin/collar sliver and source-gray edge. Left upper sleeve silhouette still has a hard stepped crop and residual background. Pants have baked source gray shadow. Jacket-off may show the removed-hem gap; no approved anatomy source exists to call that combination finished. White/blue camo not built.
- Woman 2: locked jaw/head/collar edge artifacts remain. Existing constructed underbody not owner-approved; jacket-off/independent headwear not production accepted. Small mask seam lines and outer-contour pixels still need artist QC. Missing-RGB restoration uses the same approved studio image at a different available resolution (opaque boot MAE ~6/255), not the unavailable original 1229x1536 source.
- Woman 3: source gray floor fragments/shadows persist outside soles. Combined head/hair alpha artifacts are untouched by the head lock. Source visual match and constructed underbody still need Ted review. Fuchsia/charcoal alternate not approved.
- Man 2 / Look 4: combined head/goggle interior alpha holes and source-edge artifacts remain untouched. Existing underbody not a recovered anatomical master. No owner visual PASS; white alternate not approved.
- Woman 1 / Man 3 / Grom 1 / Grom 2: only flattened references existed locally. Newly recovered continuous source-pixel appearance masks provided for review, not fabricated modular sets. Extraction edges may still need cleanup. No source defective runtime alpha pack was available to demonstrate owner-before/after repair. No jacket-off, alternate clothing or independent equipment supported.
- No four repaired package provides complete independent hair/headwear/goggles/board/two-bindings/backpack with approved hidden surfaces. PR #27 has generic equipment layers, but their source/proportion approval for these looks was not established; not silently grafted onto characters.
- Ten target slots lack approved appearances: three female adults, three male adults, two girl Groms, two boy Groms. Existing stable catalog IDs do not supply missing approved artwork. No redesign or invented replacements.

## Transparency proof and acceptance
All eight available appearances have white, black, bright-magenta and detailed snowy-mountain tests at 1024 and 512. The same alpha is used on each background; snowy photograph is a local test background only. Repaired layered sets also have A/B/C tests; A and C remain explicitly provisional/test. Any remaining head holes/edge artifacts remain visible in magenta proofs.

The 18-slot visualization is an AUDIT with ten source-missing cells, NOT an all-18 completed character sheet. Actual app-renderer/mobile/physical-Android acceptance and owner approval were not performed. No code/runtime paths modified, no merges/deploys/publishing, no youth activation, no paid art, Form #7 preserved.
