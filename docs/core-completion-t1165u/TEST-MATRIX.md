# TEST-MATRIX — t1165u

Fictional data only. Client Rider Hub = DEMO ONLY.

---

## A. Complete user journey

| Step | Path | Suite | Result |
|---|---|---|---|
| 1 | STOMPER brand (A1) | AF-JOURNEY | PASS |
| 2 | Trip Drop Pass join | AF-JOURNEY / AF-RC-01/02 / AF-AUTH-02 | PASS |
| 3 | Squad membership | AF-JOURNEY / AF-RC-04 | PASS |
| 4 | Campfire post (1/Squad) | AF-JOURNEY / AF-AUTH-04 | PASS |
| 5 | Confirmed single-Squad share (20s) | AF-JOURNEY / AF-RC-05/06 / AF-AUTH-07/08 | PASS |
| 6 | Day Sesh join + close (Campfire untouched) | AF-JOURNEY / AF-RC-03 | PASS |
| 7 | Rider history / retention | AF-JOURNEY / AF-RC-09 | PASS |

---

## B. Edge / denial journeys

| Scenario | Suite | Result |
|---|---|---|
| Returning rider (active Pass) | AF-RC-02 / AF-AUTH-02 | PASS |
| Declined / no-pass invite | AF-JOURNEY denial / AF-RC-01 | PASS |
| Expired Pass / after grace | AF-AUTH-10 / AF-RC-08 | PASS |
| Multiple Squads share | AF-JOURNEY / AF-RC-05 / AF-AUTH-07 | PASS (`multi_recipient`) |
| Revoked Viewer download | AF-JOURNEY / AF-AUTH-06 / AF-RC-07 | PASS |
| Duplicate confirm (CAS) | AF-JOURNEY / AF-RC-06 | PASS (`already_handled`) |
| Session locked confirm | AF-AUTH-08 / AF-RC-06 | PASS (`session_locked`) |
| Expired pending (TTL 20s) | AF-JOURNEY / AF-RC-06 | PASS |
| Trip Viewer ≠ Campfire react | AF-AUTH-05 | PASS |
| Account ownership mismatch | AF-AUTH-01 | PASS |
| Failed network ops | Fictional — PendingStore `failed` markers exist; no live network in suite | Documented MOCK |

---

## C. Regression locks

| Suite | Count | Result |
|---|---|---|
| batch1 vitest (all) | **559 passed / 11 skipped** | PASS |
| AF-RC-01..10 | 21 | PASS |
| AF-XINT-01..14 | 14 | PASS |
| AF-SV (sesh-sv0-*) | green | PASS — **not reopened** |
| AF-AUTH-01..12 | 12 | PASS (new) |
| AF-JOURNEY | 5 | PASS (new) |
| gb-phone social.test | 7 | PASS |
| gb-phone npm test | 66+ | PASS |
| gb-phone vitest woz | **881** | PASS (+ cf2-share bridge) |
| batch1 tsc | — | PASS |
| gb-phone tsc / typecheck:woz | — | PASS |

---

## D. Explicit OPEN / HELD (not invented)

| Decision | State |
|---|---|
| G1 Day Sesh media deadline | OPEN — `DEADLINE_UNSPECIFIED` |
| G2–G4 | HELD |
| F1–F5 | HELD |
| Youth Campfire | HELD |
| Payments | HELD |
| Live deletion jobs | HELD |
| Legal G4 erasure | Owner + counsel |
| Production server authz | Packet ready — **NOT activated** |
