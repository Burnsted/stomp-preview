# STOMP LOOK 2 · photo-registered modular proof (PROTOTYPE)

This is **not an infographic**. `aligned_masters_1024/` contains eight real, aligned RGBA layer files. `gb-phone/public/stomper/adult/` contains eight transparently exported WebPs under distinct jacket/pants/body/identity paths. `look2-f-hana-REGISTERED-PROTOTYPE.ora` is a genuine OpenRaster editable layered source (opens in Krita/GIMP).

## Source and identity
Uses Ted/Franz's mint-jacket studio photo of the brunette (`1000100043.png`) as the pixel-locked reference. Source foreground was separated against the actual gray studio background. **No face, braid, helmet, goggles, stance, pants geometry or camera framing is regenerated.** The *same exact source-head photo pixels* appear in all three composites. The dark fitted body is painted in underneath, not extracted from hidden pixels.

## What is actually demonstrated
- A: Under-jacket dark torso and arms, original locked head + mint pants and original gloves/boots.
- B: Same layer registration with original mint jacket and mint pants over the underbody.
- C: Same layer registration and original head with a charcoal/black jacket and pants recolor, Woz's locked `look2-ink` colorway.
- Every plate preserves one affine registration. Source source-crop and transform are in `manifest.json`.
- `jacket-look2-mint`, `pants-look2-mint`, `jacket-look2-ink`, and `pants-look2-ink` are separate transparent WebPs at exact requested URLs. They are not just a poster crop of the whole character.

## What is NOT yet production finished
- The dark torso is a **constructed graphic underlayer**, not approved photo-real anatomy; check shoulders/wrists/collar and paint corrections.
- The registered head is presently a combined locked photo composite. Separate correctly-revealing face/hair/headwear/goggles swap plates were *not* fabricated; Woz's existing validated accessory plates can be used once aligned, or Franz should supply physical layer art.
- The original studio photo has no real board; this pack does not invent a fake aligned board with bindings.
- The charcoal recolor is a prototype gear colorway, not a separately painted realistic shell. Check colorway against locked ink brief and approve before production.
- No physical Android renderer acceptance has been performed.

## Integration contract
1. Inspect `proofs/A_B_C_alignment_proof.png`, then the three full-size PNGs individually.
2. Open `.ora` in Krita/GIMP to refine the dark underbody without touching pixel-locked head or garment masks.
3. Compare default photo result to original source foreground; reject if edges or background remnants show.
4. Place 512 WebPs into the matching `gb-phone/public/stomper/adult/` paths in a *draft test branch* ONLY (do not replace verified assets in protected PR #21 without owner Go).
5. Wire mint+ink jacket-set so two separate itemIds change, never merge jacket + pants.
6. Do physical Android tests in selector/Locker; retain status AWAITING_VISUAL_ACCEPTANCE until passes.
7. Grom previews remain off, no merge/Pages/deploy.

## File provenance / risks
Some semantic slicing boundaries (glove cuffs, helmet, hair braid, pants hem) are region masks, not professionally painted isolations. Pixel-lock and registration are mechanical, but seam quality needs visual inspection. No claim that this is the final 11-layer stack.
