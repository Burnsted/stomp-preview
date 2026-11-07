# Android device test instructions — t1206u

**Status of this audit:** instructions only. Results: **NOT RUN**.  
Do **not** fill PASS/FAIL from browser screenshots or CI green.

---

## Purpose

Prove modular avatar + core rider surfaces on a **physical Android phone**. This is not arcade testing.

## Build under test

| Field | Fill during the run |
|---|---|
| Tip SHA | Must match approved draft tip (start from `#39` `7ee43f46cbcb891a81bd57d70ffadc50e1999661` unless Ted pins a newer docs-only tip) |
| CI | Both jobs SUCCESS on that SHA before install |
| Install method | Draft APK / WebView build from that tip — **not** production Pages as acceptance proof |
| Device model | ________________ |
| Android OS version | ________________ |
| Tester | ________________ |
| Date (UTC) | ________________ |

---

## Preconditions (all required)

1. Ted has recorded owner visual review for the rider(s) under test (or explicitly authorizes “engineering-only device smoke” — still **not** visual PASS).  
2. `gromFlowEnabled` remains **false** — do not enroll Grom.  
3. No payments / live auth / Pages publish as part of the test.  
4. Arcade hub is **out of scope** for this checklist.  
5. Character labels on screen must show slot language (Man 1 / Woman 2 / …), not invented personal names.

---

## Evidence pack (required artifacts)

For **each** rider tested, collect:

| Evidence | Requirement |
|---|---|
| Screenshots | Device screenshots (not emulator CSS crop alone) for every step marked ★ |
| Build fingerprint | Screenshot or log line showing tip SHA / build id |
| Logcat excerpt | Start → select → Locker → jacket-off → clothing-swap (errors only + gate attrs) |
| Written result | `PASS` / `FAIL` / `BLOCKED` per step with one-line reason |
| Upload location | Attach under a new dated folder under `docs/` **only if Ted asks** — this audit does not create fake results |

---

## A. Avatar Batch E (per rider)

Run separately for: Woman 2 (priority) · Man 1 · Woman 3 · Man 2 (only after owner allows — Man 2 not owner-visually approved).

| Step | Action | Pass only if | Evidence |
|---|---|---|---|
| E1 ★ | Cold start → Create / selector | Slot labels Look N of M; no personal-name roster copy | Screenshot |
| E2 ★ | Select rider → open Locker | Shows prototype gate: acceptance eligible **false** / prototype-only | Screenshot + attrs if available |
| E3 ★ | Variant A — jacket OFF | Underbody visible; note holes/gaps honestly | Screenshot |
| E4 ★ | Variant B — default outfit | Head registration stable vs A; default colors correct | Screenshot |
| E5 ★ | Variant C — alt outfit | Coordinated jacket+pants swap; still TEST-ONLY where marked | Screenshot |
| E6 ★ | Missing layers | No invented separate hair/helmet/goggles/board; backpack OFF default | Screenshot + note |
| E7 ★ | Locker isolation | Change Man 1 outfit → switch Woman 3 → return — Man 1 unchanged | Screenshots before/after |
| E8 | Persist | Force-stop app → reopen — name + outfit survive | Screenshot |
| E9 | Themes | Toggle light/dark (if offered) — avatar still coherent | Screenshot |
| E10 | Record | Write `androidQa: PASS\|FAIL\|BLOCKED` + tip SHA | Text receipt |

**Automatic FAIL:** claiming PASS from desktop browser; enabling Grom; treating prototype 8-of-11 as production 11; claiming owner visual PASS without Ted.

---

## B. Journey smoke (synthetic product paths — still device)

Only after avatar E1–E10 for at least Woman 2.

| Step | Action | Evidence |
|---|---|---|
| J1 ★ | Complete onboard → STOMPER ID QR visible | Screenshot ID card |
| J2 ★ | Five tabs: Home · Map · Music · Stats · Crew | Screenshot tab bar |
| J3 ★ | Crew → Invite (Crew Link) opens invite flow | Screenshot |
| J4 | Open Bag of Tricks → level cards visible | Screenshot |
| J5 | Attempt Squad / Trip / Sesh paths if exposed | Screenshot; mark **FICTIONAL/DEMO** if local-only |
| J6 | QR scan simulation / Smart ID | Screenshot; note NFC stub |
| J7 | Airplane mode / offline screen | Screenshot |
| J8 | Confirm youth/Grom still blocked | Screenshot or note |

Do **not** claim production Pass expiry / deletion / export without a live backend — record “fiction/demo only” if that is what the build shows.

---

## C. What not to test in this batch

- Arcade Boulder Dodge / Terrain Park (#42)  
- Youth enrollment  
- Production account deletion wipe  
- Publishing to GitHub Pages as “acceptance”

---

## Result block (leave blank until a real run)

```
Tip SHA:
Device:
Woman 2 Avatar Batch E: NOT RUN
Man 1 Avatar Batch E: NOT RUN
Woman 3 Avatar Batch E: NOT RUN
Man 2 Avatar Batch E: NOT RUN
Journey smoke: NOT RUN
Owner visual referenced: (none / list)
```
