# Test matrix — t1206u

**Rule:** Separate **synthetic** (CI / unit / browser viewport) from **real-device**.  
No real-device PASS found in this audit → Android column stays **NOT RUN**.

Audit tip CI: #39 `7ee43f46…` both jobs SUCCESS · #27 `f70aaed5…` both jobs SUCCESS.

---

## Matrix

| Area | Synthetic result | Evidence path | Real-device | Notes |
|---|---|---|---|---|
| **Android (avatar Batch E)** | Browser 390×844 proofs only | `docs/multi-rider-t1205u/screenshots/` · `docs/modular-prototype-t1197u/finishing/` · Android checklists | **NOT RUN** | Never equate CSS viewport with device PASS |
| **Themes** | Covered in avatar / alpine woz tests | `gb-phone/tests/woz/` (theme toggle surfaces) | **NOT RUN** | |
| **Assets / plates** | Look2 + multi-rider suites PASS on tip | `docs/multi-rider-t1205u/FUNCTIONAL-RESULTS.md` · look2 plate tests | **NOT RUN** | sha256 match Woman 2 finishing ≠ device PASS |
| **Persistence** | Local storage / hydrate tests PASS | woz-store / avatar store tests · multi-rider Locker keys | **NOT RUN** | |
| **QR / Smart ID** | Local QR generation + scan simulation | `stomper-id.tsx` · `woz-bridge/smartid.ts` · related tests | **NOT RUN** | NFC stub |
| **Permissions (Pass / membership)** | Fictional authz AF-AUTH / AF-RC PASS | `batch1` AF suites · `docs/core-completion-t1165u/TEST-MATRIX.md` | **NOT RUN** | No live server |
| **Trip Viewer** | Fictional participationFacts + denial PASS | `batch1/src/shared/participationFacts.ts` · AF-AUTH-05 | **NOT RUN** | Viewer ≠ Campfire react |
| **Grom / youth gates** | Asserts `gromFlowEnabled=false`; youth Campfire denied | `avatar/flags.ts` · `batch-d-hardening.ts` · campfire policy | **NOT RUN** (must remain held) | Do not enable for testing |
| **Sesh confirm** | SV-0 / AF-RC / AF-JOURNEY PASS (fiction) | `batch1/src/campfire/sesh-*.ts` · RC TEST-RESULTS | **NOT RUN** | 20s TTL locked in fiction |
| **Offline** | Offline screen + local-first patterns present | `offline-screen.tsx` · local URI campfire rules | **NOT RUN** | |
| **Media expiry** | Lazy read-time expiry tests; G1 45d Day Sesh lock | `campfire/retention.ts` · `trips/retention.ts` · AF-G14 | **NOT RUN** | Deletion jobs **disabled** |
| **Regression — five-tab / CrewLink** | Pins PASS on tip | `greet-invite-sha.ts` · alpine / bag / avatar-foundation tests | **NOT RUN** | |
| **Regression — Woman 2 Look2** | Finishing / plates / registration PASS | multi-rider + modular-prototype docs | **NOT RUN** | |
| **Arcade (#42)** | Merged on main | separate product | N/A | **Do not fold into journey regression** |

---

## CI pins (synthetic)

| Tip | Run | Jobs |
|---|---|---|
| #39 `7ee43f46cbcb891a81bd57d70ffadc50e1999661` | [41874806319](https://github.com/Burnsted/stomp-preview/actions/runs/41874806319) | both SUCCESS |
| #27 `f70aaed514953b79f1c76a907931bbbde34248f7` | [41857103766](https://github.com/Burnsted/stomp-preview/actions/runs/41857103766) | both SUCCESS |

Earlier #39 pin `5701a180…` also SUCCESS ([41874457949](https://github.com/Burnsted/stomp-preview/actions/runs/41874457949)) — tip advanced with docs pin commit; current head remains green.

---

## Explicit non-claims

- Synthetic PASS ≠ merge readiness  
- Synthetic PASS ≠ owner visual acceptance  
- Synthetic PASS ≠ Android PASS  
- Fictional authz PASS ≠ production security live
