# Changelog — Trip state machine (fictional-data)

## [t1138u] — 2026-11-02

### Added
- `batch1/src/trips/*` pure TypeScript Trip Drop state machine (fictional accounts only):
  - States: `draft` → `scheduled` → `active` ⟲extend → `completed` → `retention-expired`; `draft|scheduled` → `cancelled`
  - Fields: `scheduledEndAt`, append-only `extensions[]`, `officialEndDate` null-until-finalize then lock, IANA `timeZone`
  - Auto-finalize at current deadline; early-end (host/co-host + confirmation + audit); cancel (scheduled/draft only)
  - `TripMembership.participationEndsAt` + `graceUntilAt` (Pass-lapse freeze; later extensions do not move frozen riders)
  - Pass entitlement checks; extension approver must hold active Pass (D5)
  - Separate Rider / Viewer / Day Sesh eligibility guards
  - Independent retention clocks (media/Viewer 45d, Rider Archive 6mo, viewer-only 12mo, never-Rider, Founder stub)
  - Mid-trip renewal prompt returns disabled purchase interface (no auto-buy / no Viewer conversion)
  - `PolicyDecision` stubs for unresolved refunds, paid Viewer early-end, live admin, deletion jobs
- Fixtures (separate, no shared refs): Saturday Park Lap, October Park Lap, fictional-peak, extended, cancelled, early-ended, Day Sesh demo
- AF acceptance suite: AF1–AF12, AF22–AF28, AF29–AF41 (+ documented `POLICY_UNRESOLVED` skips)

### Changed
- `batch1/src/index.ts` re-exports `trips` namespace

### Not in this batch
- No GB shell / gb-phone UI changes
- No Avatar Foundation / PR #12 tip `78dc9f9` modifications
- No live auth, payments, deletion jobs, merge, deploy, or publish
