# TEST-MATRIX — t1165u + t1166u (G1–G4)

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

---

## C. G1–G4 policy lock (Ted's 14) — AF-G14

| ID | Case | Result |
|---|---|---|
| AF-G14-01 | Day Sesh media window / flag | PASS |
| AF-G14-02 | 45d max after official end | PASS |
| AF-G14-03 | Campfire link no clock reset | PASS |
| AF-G14-04 | Expired / revoked deny | PASS |
| AF-G14-05 | Leave terminates access | PASS |
| AF-G14-06 | Rejoin new approval | PASS |
| AF-G14-07 | No history auto-expose | PASS |
| AF-G14-08 | Ownership accept-only | PASS |
| AF-G14-09 | Unresolved no elevate | PASS |
| AF-G14-10 | Members + moderation intact | PASS |
| AF-G14-11 | Deletion denies new auth | PASS |
| AF-G14-12 | Others' content not erased | PASS |
| AF-G14-13 | Trip Drop + Campfire retention | PASS |
| AF-G14-14 | SV-0 / authz / Squad isolation | PASS |

---

## D. Regression locks

| Suite | Count | Result |
|---|---|---|
| batch1 vitest (all) | tip | PASS target |
| AF-G14-01..14 | 14 | PASS (new) |
| AF-RC-01..10 | 21 | PASS (G1 flag update) |
| AF-XINT-01..14 | 14 | PASS (G1 flag update) |
| AF-SV (sesh-sv0-*) | green | PASS — **not reopened** |
| AF-AUTH-01..12 | 12 | PASS |
| AF-JOURNEY | 5 | PASS |
| gb-phone social.test | 7 | PASS |
| gb-phone vitest woz | tip | PASS |
| batch1 / gb-phone tsc | — | PASS |

---

## E. Explicit OPEN / HELD (not invented)

| Decision | State |
|---|---|
| G1 Day Sesh media deadline | **LOCKED** — `day_sesh_45d_max` / 45d after official end |
| G2 rejoin history | **LOCKED** — prospective only |
| G3 owner transfer / unresolved | **LOCKED** — nominate+accept; no auto-promote |
| G4 logical revoke | **LOCKED** (fictional) |
| G4 physical storage erasure / legal confirm | **unresolved** — docs only |
| F1–F5 | HELD |
| Youth Campfire | HELD |
| Payments | HELD |
| Live deletion jobs | HELD / disabled |
| Production server authz | Packet ready — **NOT activated** |
