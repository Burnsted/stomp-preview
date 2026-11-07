# EXECUTABLE IMPLEMENTATION PROMPT — t1206u next batch

**Status:** Paste-ready for a future Cloud Agent.  
**Do NOT run until Ted explicitly approves.**  
This file is documentation only in the t1206u audit PR.

---

## Copy everything below the line into a new Cloud Agent task

---

t1206v — STOMP next implementation batch (post t1206u audit). Ted approved this prompt.

### HARD RULES
- Work ONLY on a new isolated draft branch `cursor/<descriptive>-2ddb` cut from tip `7ee43f46cbcb891a81bd57d70ffadc50e1999661` (PR #39) unless Ted pins a newer SHA.
- DRAFT PR only — title must include `DRAFT` and `NO MERGE`. Do not merge, rebase onto main, publish Pages, activate services, enable youth/Grom, enable payments, or fold arcade (#42) into this work.
- Preserve five-tab nav (Home·Map·Music·Stats·Crew) and CrewLink Invite sha lock.
- Character labels ONLY: Woman 1/2/3, Man 1/2/3, Grom 1/2 — never invent display names in UI/docs Ted sees.
- Status honesty: `REGISTERED_VISUAL_PROTOTYPE_ONLY` until Ted records owner visual PASS; Android **NOT RUN** unless you attach real-device evidence (screenshots + build SHA + logs). Never claim Android PASS from browser viewport.
- Fictional data only where production auth is absent. No new sports/kiosk features. No roster expansion for test counts.
- Do not execute work outside the scope list below.

### SCOPE (do in order; stop at first Ted gate if blocked)

**A. Owner-visual support pack (no fake PASS)**
1. Produce a short owner review sheet for Woman 2 / Man 1 / Woman 3 / Man 2 with current A/B/C screenshots from the tip (browser OK if labeled engineering-only).
2. If Ted already left written visual defects in Drive ARTWORK-STATUS or PR comments, fix **only those** plate/registration defects for Woman 2; re-verify sha256 vs Franz finishing ZIP id `1Tg0OG-9poiaLKscqx8jdrpXGicMIxTby`.

**B. Production layer readiness (fail-closed)**
3. If Franz has delivered separated hair/helmet/goggles and/or board+bindings+backpack for Woman 2 in Drive folder `1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH`, ingest on the draft tip with checksums + tests. If not delivered, document ABSENT and do not invent layers.
4. Keep `acceptanceEligible=false` until Ted explicitly flips the gate after owner visual + Android evidence.

**C. Journey UI gaps (fictional/demo tip only)**
5. Implement or clearly complete phone surfaces for:
   - Clips-first STOMPER Profile
   - Bag of Tricks **My Boards** (app journey — not arcade board locker)
   - Correctable Bag of Tricks achievement flow
   - Trip Drop Replay + personal Report Card
6. Wire to existing fictional batch1 Trip/Squad/Sesh/Pass contracts where applicable; do not invent live backends.
7. Add/extend tests; keep G1–G4 / SV-0 locks; youth remains HELD.

**D. Security stack prep (draft only)**
8. Create an isolated docs+code tip that records how to restack PR #22 (`7917aa69…`) onto this character tip — or perform the restack on a **separate** draft PR. Do **not** activate production authz.

**E. Android**
9. Do not claim device PASS. If Ted provides a device path, follow `docs/integration-readiness-t1206u/ANDROID-DEVICE-TEST-INSTRUCTIONS.md` and attach real evidence; otherwise leave NOT RUN.

### OUT OF SCOPE
- Arcade (#42) features, Boulder Dodge, Terrain Park
- Merging any draft to main
- Pages deploy
- Youth/Grom enrollment
- Roster expansion
- Claiming owner visual or Android PASS without evidence

### DELIVERABLES
- Draft PR with clear DRAFT / NO MERGE title
- Receipt doc under `docs/` describing SHAs, what changed, what remains ABSENT/NOT RUN
- CI both checks green
- Short plain-English summary for Ted: what shipped, what is still blocked

### START FROM
- Audit package: `docs/integration-readiness-t1206u/` on the t1206u draft PR
- Tip: `7ee43f46cbcb891a81bd57d70ffadc50e1999661`

End of prompt.
