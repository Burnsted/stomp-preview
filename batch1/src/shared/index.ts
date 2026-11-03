/**
 * Integration rehearsal adapters (t1152u) — thin, fictional-data only.
 * t1165u: + fictionalAuthz (deny-by-default design) + riderHubBridge (compare-don't-rebuild).
 * t1184u: + riderPersonalExport (fictional personal JSON + G4 revoke-then-deny).
 * t1187u: + audit trail, session revoke, rate-limit stubs (still fictional only).
 */
export * from "./ids.js";
export * from "./tripToEndAnchor.js";
export * from "./daySeshToStub.js";
export * from "./guardResult.js";
export * from "./participationFacts.js";
export * from "./ageBandSpec.js";
export * from "./fictionalAuthz.js";
export * from "./riderHubBridge.js";
export * from "./riderPersonalExport.js";
export * from "./fictionalAuthzAudit.js";
export * from "./fictionalSessionRevoke.js";
export * from "./fictionalRateLimit.js";
