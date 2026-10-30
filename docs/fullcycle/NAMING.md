# Session naming (resolves duplicate "Session" labels)
| Name | Module | Meaning |
|---|---|---|
| SESSION voice | `session/voice-router.ts` | Voice assistant ("Hey/Yo Session"; optional "Sesh" off by default) |
| ParkSession (Batch 3) | `session/park-session.ts` | Legacy minimal park session — superseded by RideSession |
| RideSession | `ride/ride.ts` | On-hill session state machine, tricks, run, stashes |
| ScheduledCrewSession | `stompers/crew-store.ts` | Planned crew meetup with RSVPs |
| CrewSession (Batch 3) | `stompers/crew-session.ts` | Fixture-only list; superseded by ScheduledCrewSession |
| CampfireSession | `campfire/*` | Crew-private clip hangout; full-cycle interactions in `media/crew-dump.ts` |
New modules are exported under namespaces to avoid clashes with Batch 1–3 names.
