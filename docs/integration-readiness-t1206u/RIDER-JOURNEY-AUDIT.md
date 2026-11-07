# Rider journey audit — 12 HQ steps (t1206u)

Verdict vocabulary:

| Label | Meaning |
|---|---|
| **PRESENT** | Usable on the draft tip as a real phone surface (still may be demo/local) |
| **PARTIAL** | Pieces exist; product step incomplete |
| **MISSING** | Not found as a finished journey surface |
| **FICTIONAL-ONLY** | Logic + tests exist on draft tip; not live production / not full phone product |

**Audit tip:** `#39` `7ee43f46cbcb891a81bd57d70ffadc50e1999661` (includes #12→#17→#21→#27 ancestry).  
**Arcade (#42):** excluded from this journey.

---

## Step table

| # | HQ step | Verdict | Primary tip / PR | What exists | What’s missing |
|---|---|---|---|---|---|
| 1 | Create STOMPER avatar | **PARTIAL** | #12 · #21 · #27 · #39 | Onboarding flow; starter selector; modular plates for Man 1 / Woman 2 / Woman 3 / Man 2 | Production 11-slot layers; owner visual; Android |
| 2 | Onboarding + STOMPER ID | **PRESENT** | #12 (+ later) | Multi-step onboard; STOMPER ID card + revocable QR (`stomper-id.tsx`) | Live wallet / Apple·Google Wallet (stub only) |
| 3 | Clips-first STOMPER Profile | **PARTIAL** | #12 / Woz bridge | Local clips store; Campfire can load clips; privacy settings; playlist rows | Dedicated clips-first Profile as the primary rider identity surface |
| 4 | Bag of Tricks level + My Boards | **PARTIAL** | #12 | Bag of Tricks hub, level cards (beg/int/adv), progress UI, “My Bag” | Clear **My Boards** product surface (board locker is arcade-side on main — out of journey scope) |
| 5 | Connect with another STOMPER | **PRESENT** | #12 (CrewLink) | Invite (Crew Link) locked export; local crew link | Cloud account linking / production invite |
| 6 | Join approved Squad | **FICTIONAL-ONLY** | #17 (folded CF-2) | Squad membership guards + tests | Live Squad service / enrollment |
| 7 | Create / join Trip Drop | **FICTIONAL-ONLY** | #13 · #17 | Trip Drop state machine, Pass, eligibility, display helpers | Live Trip Drop backend; full phone create/join UX parity |
| 8 | Squad Quick Share clip/music | **FICTIONAL-ONLY** | #17 · gb-phone `cf2-share.ts` | Quick Share begin/confirm/cancel; one-Squad rule; music/clip share contracts in tests | Live share transport; production media pipeline |
| 9 | Sesh with recipient preview + affirmative confirmation | **FICTIONAL-ONLY** | #17 (SV-0 fold from #16) | Pending Sesh + 20s TTL; confirm / cancel / recheck; denial paths | Live Sesh delivery; real-device UX proof |
| 10 | Correctable Bag of Tricks achievement | **PARTIAL** | #12 Bag | Self-reported marks with copy that confirmed clips stay on Rider history | Full correctable achievement lifecycle (dispute / confirm / roll-back product) |
| 11 | Trip Drop Replay + personal Report Card | **MISSING** / **PARTIAL** | Trip fiction #13/#17; older Ride Replay demos in HQ inventory | Trip retention / viewer clocks (fiction); historical Ride Replay demos elsewhere | Unified **Trip Drop Replay** + **personal Report Card** as finished journey screens on the draft tip |
| 12 | Test Pass expiration, export access, deletion boundaries | **FICTIONAL-ONLY** | #17 G1–G4 · trips retention · #22 packet (parallel) | Pass expiry rules; viewer download windows; export denials in fictionalAuthz; logical revoke; deletion jobs **off** | Production authz activation; physical wipe / legal confirm (unresolved) |

---

## Journey continuity notes

1. **You can demo pieces**, not one sealed production path. Avatar + CrewLink are the strongest phone surfaces; Trip/Squad/Sesh are strongest as **batch1 fictional tests**.
2. **Youth / Grom** cannot complete this journey — enrollment held.
3. **Security tip #22** is not stacked on #39 — Pass/export/deletion **policy text + fictional tests** live on the character stack; **merge-rehearsal / server packet** also lives on the sibling security branch.
4. Completing the journey for Ted’s “one rider” bar needs: owner visual → Android proof → journey UI gaps (3, 4, 10, 11) → then security stack reconcile — see `NEXT-BATCH.md`.

---

## Evidence anchors (paths)

| Area | Path |
|---|---|
| Onboard / ID / Locker | `gb-phone/src/components/stomp/avatar/` |
| Bag of Tricks | `gb-phone/src/components/stomp/bag-of-tricks.tsx` |
| CrewLink | `gb-phone/src/components/stomp/greet.tsx` + `tests/woz/greet-invite-sha.ts` |
| Trips / Pass | `batch1/src/trips/` |
| Day Sesh | `batch1/src/daysesh/` |
| Campfire / Quick Share / Sesh | `batch1/src/campfire/` · `gb-phone/src/lib/stomp/woz-bridge/cf2-share.ts` |
| G1–G4 | `docs/core-completion-t1165u/` · `batch1/src/campfire/lifecycle-g1g4.ts` |
| Modular avatars | `docs/multi-rider-t1205u/` · `gb-phone/src/lib/stomp/avatar/modular-riders.ts` |
