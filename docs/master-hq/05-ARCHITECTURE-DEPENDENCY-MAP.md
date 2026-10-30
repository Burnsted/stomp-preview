# 05 Architecture & Dependency Map
```
Origin Flutter (tmp-1bc65ad0541faa7b, main)  --(manual export, Ted OK)-->  Burnsted/stomp-preview (static web) --> GitHub Pages
  ├ UI: Home · Maps · Park · Clips · Settings  (Sticker-band backdrops, photo cards)
  ├ Domain: RunTimeCalculator, TourSession, PhotoSessionStore, Trick Log, Skill level, Progress
  ├ Stubs: AudioDuckingSession (→ future STOMP CONNECT/SESSION), IMU, audio, GPS/Mapbox, TTS
  └ Data: local only (no cloud/auth)
Future (HQ, NEW): Cloud auth → CREW/STOMPERS → CAMPFIRE; SESSION voice → STOMP CONNECT; QR/NFC identity; opt-in location
```
Dependencies: CREW/STOMPERS/CAMPFIRE require cloud auth + backend (not chosen — UNDECIDED). SESSION wake words require background audio + platform BT headset APIs. NFC requires native plugins. Mapbox requires keys (out of scope).
Local assets: /workspace/stomp/** (reference only).
