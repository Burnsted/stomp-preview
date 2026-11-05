# Halfpipe Jam — Batch A notes (Ted revision)

## Structure (aligned with BD/TP family)
- **10 story levels + Endless** with unlock chain
- **5 lives**, wipeout −1♥, auto-retry; 0 lives → Retry L1 refill
- **Board Locker** NOW / GOAL / NEXT (speed + amp + window ladder)
- **Difficulty row** like BD/TP: Grom / Standard / Advanced (pace · win · weather intensity)
- **localStorage** `halfpipeJam.progress` / `.pb` / `.mute`

## Progression identity (NOT obstacles)
Level variety = **boards + weather conditions**:
- Weather: Clear, Light Snow, Haze, Sunset, Wind Gusts, Storm Light
- Readable effects: flakes, haze overlay, wind chevrons + air drift, friction
- Skill core unchanged: pipe momentum / launch timing / grabs / spins / landings
- No obstacle-dodge hazards

## Tip inspection (unchanged reference)
- **BD:** survival dodge + board ladder via achievements
- **TP:** park grind/lip/flip + board ladder via clears
- **Halfpipe:** pipe jam — boards + weather only

## Known issues
- Weather tuning still coarse (Batch C)
- Grab Indy vs Method stilized by hold length
- Endless weather rotation every 45s — may want owner-chosen playlist later
- No shared board locker with TP yet (separate keys)

## Owner decisions
1. Keep optional module vs fold into TP tip later?
2. Tip URL / SW promote only when authorized — PR stays UNMERGED
3. Share board progress with TP or keep `halfpipeJam.*`?
4. Finalize weather set + clear goals numbers
5. Batches B–D still follow-ups
