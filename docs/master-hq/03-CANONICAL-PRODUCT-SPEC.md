# 03 Canonical Product Spec (HQ Phase 3 + Woz established)
Status: AGREE = consistent with shipped/Woz; NEW = HQ addition not yet in code; CONFLICT = tension, both kept.
| Item | Spec | Status | Source |
|---|---|---|---|
| STOMP | Social ski & snowboard app | AGREE (app exists; social layer mostly NEW) | HQ pt980u; README |
| Fun/social/voice-first; no AI coaching | — | AGREE (no coaching module in code) | HQ; grep |
| Trick library / Trick Log, Park Session | Preserve | AGREE (FACT shipped) | README |
| Session planning, run builder, Ride Replay Demo Run | Preserve | AGREE | README |
| Maps (6 schematics; real GPS/Mapbox stubbed) | Preserve | AGREE | README |
| Clips + Add photo/Selfie | Preserve | AGREE | e65f394 |
| Music + song↔run calculator; Crew playlists "coming" | Preserve | AGREE | README |
| Demo Day, Progress %, Skill levels | Preserve | AGREE | README |
| STOMPERS community/discovery | NEW | NEW | HQ |
| CREW private opt-in groups | NEW (only Crew playlists stub + local jam seed exist) | NEW | HQ; README |
| SESSION voice assistant, wake "Hey Session / Yo Session / Sesh" | NEW | **CONFLICT (naming)**: "Session" already names Terrain Park Session, TourSession, PhotoSessionStore, AudioDuckingSession, jam session. Keep both; resolve labels later | HQ vs code |
| CAMPFIRE post-ride social | NEW | NEW | HQ |
| STOMP CONNECT (Cardo/Sena/Aleck/BT/phone) | NEW; AudioDuckingSession stub is the nearest hook | NEW | HQ; code |
| Secure cloud, minimal offline, opt-in location, QR/NFC identity | NEW | **CONFLICT (scope)**: current app is local-demo; Mapbox/cloud out of scope per README | HQ vs README |
| Nav | Home·Maps·Park·Clips·Settings | **CONFLICT**: Grok Build reports Home/Run/Park/Tricks/Clips/Music/Stash/Session (UNVERIFIED) | README vs GB claim |
| Hardware optional (IMU stubs) | AGREE | AGREE | README; HQ |
