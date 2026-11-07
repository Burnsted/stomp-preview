# What shipped — t1210u

Isolated draft only. No merge. No Pages/deploy.

## P0 — Stability

| Item | Status | Notes |
|---|---|---|
| Page crash / blank / fatal render recovery | Done | `ScreenErrorBoundary` + `AppErrorComponent` reload/home |
| Five-tab nav Home\|Map\|Music\|Stats\|Crew | Verified | Unchanged `PRIMARY_TABS` |
| Avatar / Profile / Bag / Boards / Squad / Trip Drop / Sesh open | Done | Wired via Explore Demo stops + existing screens |
| Missing artwork / media / mic / browser feature fallbacks | Partial→Hardened | Avatar SVG plate fallback retained; mic quiet path; safe storage |
| Refresh / Back / return Home | Done | Alpine back → greet; error boundary → Home |
| Invalid/stale local demo data | Done | Screen allowlist merge; safe JSON parse; Reset Demo |
| Visible **Reset Demo** | Done | Home chrome + Explore + RiderHub inline |
| Simulated feature badges | Done | Small `DemoSimBadge` on playtest / Rider / Bag |

## P1 — Useful demo

| Item | Status |
|---|---|
| Fictional family Trip Drop seed | Done — `Beaver Creek Family Drop` |
| Create/customize STOMPER | Existing + Explore stop |
| Clips-first profile + boards | Family boards seeded on Profile |
| Join Trip Drop / Countdown / Today's Drop / Replay | Existing RiderHub Trip + seed |
| Squad + Quick Share (no PII) | Seeded Family Drop Squad + North/Lot |
| Bag of Tricks | Existing + demo badge |
| **Explore Demo** entry (no forced onboarding) | Done — Home chrome |
| Character labels Woman/Man/Grom N only | Done — UI maps member ids → slots |

## P3 — Feedback

| Item | Status |
|---|---|
| liked / confused / crashed / wish list | Done |
| Local copy / share summary | Done |
| No new DB / no PII collection | Done (email/phone redaction) |

## Intentionally not shipped

- Pages deploy / preview URL publish
- Physical Android/iPhone PASS claims
- Perfect modular art / every avatar plate
- Live auth, payments, Grom, live Squad sharing
- Edits to `greet.tsx` / `CrewLink`
- Arcade fold-in (links preserved, out of scope)
