# Halfpipe Jam — Batch A notes

## Tip inspection summary (avoid identity collision)

### Boulder Dodge tip (`arcade/boulder-dodge/` ~v0.7.12)
- **Identity:** side-scroll survival — dodge rocks/wildlife/sleds/snowcats.
- **Controls:** big JUMP (ground + optional 2× on late levels); hold-to-flip in air.
- **Progress:** 10 story + Endless; Easy/Normal/Hard; **5 lives**; board locker via achievements; localStorage `boulderDodge.*`.
- **Scoring:** distance, clears, near-misses, flips, pickups, storm atmosphere.
- **SW:** `boulder-dodge-v0-7-12` tip cache (network-first HTML).

### Terrain Park tip (`arcade/terrain-park/` ~v0.3.8)
- **Identity:** side-scroll park line — grind boxes/rails, lips, kickers/tables/gaps/hips/QP.
- **Controls:** JUMP / hold-flip; lip windows; grind friction; combo boost.
- **Progress:** 10 lines + Endless; Easy/Normal/Hard; **5 lives** + late heart pickups; board locker by clears; purple dusk / cream / coral-amber UI.
- **Scoring:** distance + grind/lip/flip/star/combo; per-level trick goals.
- **SW:** `terrain-park-v0-3-8` tip cache.

### Halfpipe Jam (this module) — distinct identity
- **Not** a side-scroll obstacle/park line. Side-view **pipe oscillator**: auto L/R, momentum/amplitude, launch above lip, aerial rotations/grabs, landing timing.
- Visual language **TP-adjacent** (purple dusk / cream / coral-amber) but own loop.
- Difficulties named **Grom / Standard / Advanced** (gameplay windows only — no youth accounts).
- Isolated path so TP tip size/behavior stay frozen.

## Known issues (Batch A)
- Pipe feel still coarse vs a polished Snowboard Party–class pipe; Batch C polish expected.
- Grab classification is stylized (Indy vs Method by hold length), not full board-edge physics.
- No board locker in Halfpipe yet (intentionally lean for size/scope).
- Chrome/headless may show transient pointer dots in screenshots; not in-game art.
- Challenges are implemented and completable; Free Jam is the high-score path after.

## Owner decisions needed before any tip/release ship
1. Keep Halfpipe as **optional module** (`arcade/halfpipe-jam/`) vs fold into TP tip later?
2. Promote to tip URL / SW cache-bust when authorized (this PR must stay **UNMERGED** until then).
3. Add board locker / shared progress with TP, or keep separate `halfpipeJam.*` keys?
4. Session length (currently 90s) and challenge set finalization.
5. Batches B–D still out of scope: BD upgrades, Halfpipe polish, consolidated review.
