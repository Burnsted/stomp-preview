# Integration Rehearsal Changelog — t1152u

## 2026-11-02 — cursor/integration-rehearsal-t1152u

### Combined
- Branched from #13 tip `1e40eab2` (includes #12).
- Cherry-picked #14 `ec870fe5` (CF-2); resolved `batch1/src/index.ts` to export `trips` + `daysesh` + `campfireCf2`.

### Adapters (thin, fictional-data)
- **A1** `shared/ids.ts` — branded StomperId/SquadId/TripId/DaySeshId/MediaRefId + `toStomperId` (rejects empty / `former_stomper`).
- **A2** `shared/tripToEndAnchor.ts` — completed→ended; draft denied; retention-expired → ended+flag.
- **A3** `campfire/trip-shim.ts` — re-exports #13 `mediaViewerDeadline` / `VIEWER_MEDIA_MAX_DAYS` / clock arithmetic; kills UTC-only duplicate SoT.
- **A4** `shared/daySeshToStub.ts` — participants→participantIds.
- **A5** `shared/guardResult.ts` — GuardReason↔DenyReason total map; `guardToResult` / `resultToGuard`.
- **A6** `shared/participationFacts.ts` — derive isTripViewer / isDaySeshParticipant from #13 data.
- **A7** SPEC ONLY — `shared/ageBandSpec.ts` + `docs/integration-rehearsal/A7-AGE-BAND-SPEC.md` (grom→youth); no GB shell change.

### Tests
- Adapter unit tests + AF-XINT-01..14.
- AF-XINT-11/12 = `it.fails` documenting CONFLICT-1/2 (SV-0); not weakened.

### Explicit non-goals
- No merge/deploy; PR #12/#13/#14 heads untouched; no Sesh Voice; G1–G4 gated; GB bridge HELD.
