# Android & iOS testing gaps · t1207u

**Rule:** Phone viewport (e.g. ~390×844 browser) **≠** device PASS. No fake PASS.

---

## Android

| Item | Status | Evidence |
|---|---|---|
| **Batch E (modular riders)** | **NOT RUN** | `docs/multi-rider-t1205u/android-batch-e/CHECKLIST.md` status `NOT_RUN` |
| Look 2 Android checklist | Checklist only | `docs/character-production-t1173u/BATCH-E-LOOK2-ANDROID-CHECKLIST.md` |
| Device instructions | Written · unused | `docs/integration-readiness-t1206u/ANDROID-DEVICE-TEST-INSTRUCTIONS.md` |
| Browser proofs | Synthetic only | `docs/multi-rider-t1205u/screenshots/` · modular finishing proofs |
| Physical Samsung (or target) APK/WebView | **No receipt found** | — |

**Riders queued for Batch E (when authorized):** Man 1, Woman 2 (Look 2 preserved), Woman 3, Man 2 (framework — owner visual first). Grom enrollment stays **off**.

---

## iOS

| Item | Status |
|---|---|
| Dedicated iOS device matrix | **Not found** as a completed PASS packet on this tip |
| Safari / WebKit preview | May appear in general smoke notes — **not** treated as iOS acceptance |
| Wallet / Apple Pass | Stub only (`walletPassesEnabled=false`) |
| Mic / BT headset / Sesh a11y on device | **NOT RUN** |

Treat iOS as **open gap** equal to Android for journey/Sesh/share until real-device evidence is attached.

---

## What synthetic CI does prove (not device)

- batch1 + gb-phone woz tests on character stack tips (see t1206u)  
- Grom flags held  
- CrewLink SHA pin  
- Fictional Pass / SV-0 / G1–G4 policy tests  

**Does not prove:** Android Batch E, iOS device PASS, production authz, or owner visual PASS.
