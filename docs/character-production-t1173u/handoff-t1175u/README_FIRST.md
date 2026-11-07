# STOMP STOMPER — APPROVED ARTWORK HANDOFF

**Approval:** Eight looks (six adults + two Grom appearance previews) are LOCKED by the owner.
**Purpose:** Exact, byte-for-byte copies of the approved visual references for Grok Build and Woz; includes the roster composite for identity cross-checks.
**NOT included:** transparent isolated character renders, editable source illustration models, clothing/hair/eyewear plates, or a working avatar customization implementation.

## Read this before implementing
- DO NOT regenerate/reinterpret these characters, change facial structure, body types, outfits, eyewear, proportions or color palettes.
- Individual source images are not uniform: some are studio portraits, others have UI text, multiple views or gear details baked into the original.
- DO NOT fake transparent modular plates by cropping a multi-panel poster, and do not silently substitute the low-detail SVG token character in acceptance previews.
- Preserve user-created STOMPER names; the 8 `starter_id` mappings in ASSET_MAP are technical only.
- Preserve STOMPER-first onboarding, Home, 5 tabs and Crew Invite.
- Grom Boy/Grom Girl are appearance previews; youth enrollment, Pass, payment and social access stay disabled.

## Runtime art requirements (from Woz's draft PR #19/#20/#21 contract)
- 1024×1024 px master working art; optimized alpha WebP plates at 512×512 px.
- Separate: body, face, hair, jacket, pants/bib, headwear, goggles/glasses, gloves, boots, board, optional backpack.
- Identical anchor points and pivots; a jacket-set selection coordinates jacket plus pants/bibs while keeping layers technically separate.
- Backpack OFF by default; no hair penetrating beanie; appropriate eyewear (Look 4 black non-reflective goggles, Look 5 red-orange mirrored wraparound glasses, Look 6 black goggles on head with white strap).
- Keep SVG fallback only for missing development assets; don't falsely claim final art is integrated.
- Render one fully layered adult sample, ideally Look 2, and verify on physical Android before completing remaining plates.

## Approval and transfer
The files in APPROVED_REFERENCES are original copies, NOT altered exports.
Verify SHA-256 values from ASSET_MAP.json before use.
Only declare production art complete when independently isolated, compositable transparent assets have been tested without altering these approved characters.
No merges, publishing, live identity, payments or youth activation are authorized by this package.
