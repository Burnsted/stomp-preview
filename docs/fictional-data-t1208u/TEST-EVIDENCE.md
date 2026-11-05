# Test evidence — t1208u

## Local runs (this batch)

### batch1

```bash
cd batch1 && npm test
```

**Result:** Test Files **37 passed** · Tests **608 passed** | **8 skipped** (616 total)  
Duration ~5.8s · tip after t1208u changes.

### gb-phone woz

```bash
cd gb-phone && npm run test:woz
```

**Result:** Test Files **32 passed** · Tests **988 passed** (988 total)  
Duration ~12.3s · includes `fictional-data-t1208u.test.ts` (CREWLINK_SHA green).

## New suites

- `batch1/tests/af-t1208u-fictional-data.test.ts` — Pass SM, welcome-back vs expiry, Founder disabled, portrait slots, Trip Drop visuals, Grom off, 12mo constant
- `gb-phone/tests/woz/fictional-data-t1208u.test.ts` — five-tab + CREWLINK_SHA, Pass demo transitions, Profile/Quick Share/portrait/Founder, Form #7 HOLD pointer

## Updated assertions (6mo → 12mo export-only)

- `af-rc-01-10.test.ts`
- `day-sesh-ds01-ds16.test.ts`
- `display-cross-feature.test.ts`
- `trip-state-af1-af12.test.ts` (AF9 deadline)
- `trip-state-af22-af28.test.ts`
- `trip-state-af29-af41.test.ts`

## CI

**GREEN** on tip `17c1a7c0b541e0e087074315688c7b4a4879ce19` — both `pr-verify` checks SUCCESS (batch1 typecheck+test, gb-phone typecheck+woz+build). No merge.
