# ANDROID-SECURITY-SMOKE — device checklist (t1187u Phase 2)

**STATUS: OPEN** — physical Android run **not** executed in this PR.  
Do **not** claim PASS. Unit/fictional AF suites ≠ device acceptance.

---

## Purpose

Authz-relevant surfaces that must be smoked on a real Android device before release:

| # | Surface | Expected | Device status |
|---|---|---|---|
| 1 | Expired / lapsed Rider Pass UI | Trip join / retain denied; no client override | **OPEN** |
| 2 | Leave Squad | Campfire post/read denied immediately | **OPEN** |
| 3 | Rejoin without approval | No auto history / access | **OPEN** |
| 4 | Export after G4 logical revoke | Personal export denied; session treated dead | **OPEN** |
| 5 | Quick Share 20s TTL | Confirm after 20s fails; single Squad only | **OPEN** |
| 6 | Day Sesh media past 45d | Media not served; Campfire share did not extend clock | **OPEN** |
| 7 | Youth enrollment | Remains disabled / no enrollment path | **OPEN** |
| 8 | Offline / kill-app resume | Demo flags do not elevate privileges | **OPEN** |

---

## How to run (when Ted schedules device time)

1. Install preview build from draft tip (not Pages prod publish)  
2. Use fictional fixtures only — no real user accounts  
3. Record PASS/FAIL per row above with device model + OS  
4. File regressions against throwaway tip; do not reopen SV-0 / G1–G4  

---

## Related automated coverage (not a substitute)

- AF-AUTH / AF-AUTH-t1184u / AF-EXPORT / AF-P2-t1187u  
- AF-G14 policy lock  
- SHARE_MS === 20000 lock  

**Verdict:** Checklist published. **Device status remains OPEN.**
