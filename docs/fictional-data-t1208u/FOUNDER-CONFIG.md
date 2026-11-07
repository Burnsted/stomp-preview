# Founder config — disabled / unset (t1208u D5)

```ts
FOUNDER_ELIGIBILITY = {
  ruleId: "unset",          // Options A / B / C remain TBD
  cutoffAt: null,           // Owner supplies later
  firstN: null,
  awardsEnabled: false,     // Do NOT award until owner Go
  paidSku: false,
  manufacturerTrademarksAllowed: false,
  excludeYouthUntilApproved: true,
  sportsScope: "snowboarding",
}
```

**Location:** `batch1/src/trips/founder-eligibility.ts`  
**Duration stub:** existing `founderClock(...)` still `deadlineIso: null` / policyUnresolved.  
**UI:** Gold Founder board styling may appear as **fiction** only; `evaluateFounderEligibility` always denies while disabled.  
**Not** a paid SKU. No manufacturer trademarks.
