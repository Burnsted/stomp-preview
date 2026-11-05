# What shipped — t1208u fictional-data batch

Isolated draft implementation only. No merge. No Pages/deploy.

| # | Scope | Delivery |
|---|---|---|
| 1 | Pass expiration + **12-calendar-month** export retention; `PASS_EXPORT_ONLY_MONTHS = 12`; supersede 6mo archive meaning | `batch1/src/trips/retention.ts`, `pass-lifecycle.ts`; kind `pass_export_only_12mo`; G1 45d unchanged |
| 2 | 90-day inactivity welcome-back; Pass-expiry wins | `batch1/src/trips/welcome-back.ts` + RiderHub Profile + `demo-history.ts` |
| 3 | Report Card / export after Pass expiry; lock full profile/history + new Rider participation | `canAccessReportCard` / `exportPack` / History lock / Pass panel |
| 4 | Clips-first STOMPER Profile on **existing RiderHub** | `stomper-profile.ts` + RiderHub **Profile** panel (no new CREW You tab) |
| 5 | Five-tab nav + CrewLink preserved | Untouched `alpine-chrome.tsx` / `greet.tsx`; pin tests green |
| 6 | Consolidated Squad Quick Share | `squad-quick-share.ts` + RiderHub Squad sheet; native handoff ≠ delivery |
| 7 | Trip Drop visual states Countdown / Today's Drop / Replay | `trip-drop-visual.ts` + RiderHub Trip + TripHub strip |
| 8 | Consent-safe Crew portrait (slot labels Woman/Man/Grom N) | `crew-portrait.ts` + RiderHub Trip portrait strip |
| 9 | Founder eligibility **unset/disabled** | `founder-eligibility.ts`; awardsEnabled=false |
| 10 | Form #7 unchanged (D1 HOLD) | Tracking note only — [FORM-7-HOLD.md](./FORM-7-HOLD.md) |
| 11 | Grom / youth / wallet / AI gen stay disabled | Flags asserted false in tests |
| 12 | Regression + state-transition tests | `batch1/tests/af-t1208u-fictional-data.test.ts`, `gb-phone/tests/woz/fictional-data-t1208u.test.ts` |

## Hard locks honored

- Did **not** edit `greet.tsx` or CrewLink.
- Did **not** activate deletion jobs, prod auth, payments, Grom, Pages, or merge.
- Did **not** restack/activate security PR #22.
- Arcade (#42) untouched.
- Franz separated layers still ABSENT — fail-closed.
- REGISTERED_VISUAL_PROTOTYPE_ONLY / `acceptanceEligible` unchanged.
