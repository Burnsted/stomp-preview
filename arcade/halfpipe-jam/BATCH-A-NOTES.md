# Halfpipe Jam — notes (through Batch C)

## Version
`0.3.0-batchC` — PR #49 UNMERGED

## Structure (BD/TP family)
- 10 story levels + Free Jam (Endless)
- **L1–5 intro challenges:** First Air, Grab It, Spin Doctor, Three in a Row, Pipe Flow
- **L6–10** weather story; Free Jam rotates weather
- 5 lives, wipeout auto-retry; Board Locker NOW/GOAL/NEXT
- Difficulty: Grom / Standard / Advanced (distinct win/land/wipe)

## Batch C polish
- Transition pumps build amp (`AMP +` at bottom); early/ideal/late lip bands + tones
- Landing windows per difficulty tightened; max-safe height meter (amber→red)
- Weather: pulsed gusts, flurry drag, haze fair windows, sunset pump, storm friction/flakes
- Board unlocks: 0 / 2 / 4 / 6 / 10 (fair across intros→story)

## Identity
Boards + weather only — **no obstacles**. Skill = momentum / launch / grabs / landings.

## Known issues
- Weather still room for Batch D taste-pass
- Grab Indy/Method stilized by hold length
- Free Jam weather rotate every 40s — may want playlist

## Owner decisions
1. **Settled (Ted 2026-11-04):** Halfpipe stays a **standalone game** under `arcade/halfpipe-jam/` — **not** folded into Terrain Park. See `README.md`.
2. Tip URL / SW promote only when Ted authorizes.
3. Shared board progress with TP? (still open — default separate `halfpipeJam.*` keys)
4. Final weather/goal taste numbers? (Batch D / later)
