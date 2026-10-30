# STOMP — Grok Build Brief (Ted 2026-10-26)

Tagline: The Hands-Free Snowboard Caddy & Trick Log
Platform: iOS / Android (React Native or Flutter / Native Mobile)
Voice-first, hands-free; phone in jacket pocket. Bluetooth headphones / helmet speakers primary. Smart glasses optional video add-on only.

## Modules
1. Inertial Motion Trick Engine (IMU) — accel + 6-axis gyro ~60Hz; Zero-G airtime; landing Stomped vs Washed Out; audio prompt on landing
2. Audio Ducking & Glove-Free Interface — AVAudioSession ducking; voice micro-log loop; optional watch haptics
3. Spatial Memory & Tactical Caddy — GPS + altimeter; 20-ft geofence stashes; contextual line callouts
4. Flat-Zone Warning Engine (FLATTOS) — Mapbox/OSM pitch; <2% slope alerts

## Design — Dark Powder
- Carbon Black `#0B0F19`, Neon Orange `#FF5A36`, Electric Cyan `#00F0FF`
- Main HUD: Airtime, Audio Assistant Status, Hold to Speak
- Map: 3D resort trails, flat-zone warnings, lift waits, stash markers

## Stack (from brief)
Mobile: React Native / Flutter OR Native SwiftUI + Kotlin
Motion: CoreMotion / SensorManager
Audio: OpenAI Realtime / ElevenLabs TTS + OS ducking
Maps: Mapbox 3D + geofencing

## Preview gate (Woz)
Cheap static concept/thumbnail first → Ted OK → then cloud project init + IMU/audio/HUD steps.

## Playlist / self-guided tour (Ted 2026-10-26 ~4:21 PM ET)
- Rider can **upload a playlist** (a saved run / routine down the mountain).
- Integrate with **mapping** + **suggestions**: improve on a prior run, or start from scratch with a new routine.
- Voice of a **self-guided tour guide**: proactive callouts for what’s coming up — not only lines they’ve done before; can suggest new lines/stashes they’ve never ridden.
- Feeds Spatial Memory / Tactical Caddy + FLATTOS context (ahead-of-you audio cues).

## Design energy (Ted 2026-10-26 ~4:38 PM ET)
Current Flutter UI is **too boring**. STOMP is a snowboard trail-following / hit-following app — must feel that: powder, speed, stashes, airtime — not sterile cards. Keep Dark Powder palette but amp visual energy (motion, trail ribbons, bold hit typography, less “enterprise dashboard”).

## Concept pivot (Ted 2026-10-26 ~4:39 PM ET)
**Dark Powder is retired** for now. Redesign as a **light, hip trail-map** look with a **TikTok video upload aura** — social clip energy, trail/hit following, not a dark dashboard.

## Design — Trail Clip (LOCKED Ted 2026-10-26 ~4:54 PM ET)
Dark Powder retired. Ted: "This is one hundred percent on point. Continue, full steam ahead."

Palette:
- Snow Mist `#F3F6F4`
- Night Ink `#111827`
- Clip Rose `#FF2E63`
- Trail Aqua `#00D1C1`
- Powder Lime `#C8F542`

Locked concept frames (photo-heavy):
- splash_or_home.png — air hit hero + crew selfie card
- trail_hud.png — RUN LIVE, airtime, what’s coming up, HOLD TO SPEAK
- clip_upload_map.png — filming a hit + trail ribbons + crew selfie / filming slots

Photo pack under photo-refs/for-cloud/ (01–09): real snowboard air, crew on slope, snow selfie, filming a flyer.

## Song sample ↔ run match (Ted 2026-10-27 ~8:01 AM ET) — CORE NICHE
Rhythm-Synced Audio Feed is not just a waveform toy. Built-in **song samples matched to run length**:
- Short park laps / rail lines → ~1 track timed to the ride
- Mile-long mountain runs → 1–2 songs chained to cover the descent
- Timing + hit preferences: amp / drop energy at the right moments (approaching a hit, not on flats)
- Seeded demo tracks (royalty-free stubs / placeholders labeled Sample) per mountain run — no fake licensed catalog claims

### Future side branch (product, not this slice)
Community lane: riders upload matched playlists to mountains across the US / world, synced with timing + hit preferences. Attractive whole product branch of STOMP. Stub an entry point ("Crew playlists — coming") only; do not build social upload yet.

### WOZ lock UI (Ted 2026-10-27)
Four-page light interactive look locked; no currency/$ anywhere. Remaining = %. Nav: Home · Maps · Park · Clips · Settings.

## Rider skill → run time → song (Ted 2026-10-27 ~8:17 AM ET)
Beginner / Intermediate / Advanced control adjusts assumed snowboard speed down the run.
Guesstimated ride time = run length ÷ skill speed → drives Sample song count/duration and beat/hit cue placement.
Planning speeds (approx): Beginner ~10 mph, Intermediate ~17 mph, Advanced ~25 mph.

### Calculable core (Ted 2026-10-27 ~8:18 AM ET)
Not graphics-only. Shared calculator: pathLength(mountain, line) × skillSpeed(beginner|intermediate|advanced) → estimatedRideSeconds → song sample count/duration + beat/hit cues. Must work for every level × every mountain.

## Background — Sticker bands LOCKED (Ted 2026-10-27 ~8:30 AM ET)
C — Sticker bands / research Sticker Bomb. Mag-ad graphic backgrounds on every page: Snow Mist + Lime/Aqua diagonal bands, sticker marks, grain — NO HD photos. Sample: artifacts/mag-bg/C_stickerband.jpg
