# Next batch — estimate, order, gates (t1206u)

**Not started.** Awaiting Ted approval of `EXECUTABLE-IMPLEMENTATION-PROMPT.md`.  
Hours are **engineering effort**, not calendar days.

---

## Hours estimate (recommended implementation batch)

| Workstream | Hours (eng) | Notes |
|---|---|---|
| Owner visual review support (screens + defect notes only) | 2–4 | Owner review time separate |
| Woman 2 finishing residual fixes **if** Ted marks defects | 4–8 | Only after visual notes |
| Separated hair / helmet / goggles ingest path (first rider: Woman 2) when Franz delivers | 6–10 | Art lead time outside eng |
| Board + bindings + backpack production slots (Woman 2 first) | 4–8 | Fail-closed until art arrives |
| Journey UI gaps: clips-first Profile, My Boards surface, correctable achievement, Trip Replay + Report Card (fictional/demo tip) | 12–20 | No new sports/kiosk; no roster expansion |
| Stack reconcile prep: document merge of #22 security onto #39 tip (docs + conflict map only **or** isolated tip) | 3–6 | Do not activate prod authz |
| Android Batch E execution support + evidence intake | 3–6 | Device time separate |
| **Total recommended batch** | **~34–52** | Split if Ted wants a smaller first cut |

Smaller “Batch A only” (~10–16h): owner visual support + Woman 2 residual + Android Batch E for Woman 2 only — **no** journey UI expansion yet.

---

## Recommended order

1. **Ted owner visual** — Woman 2 finishing, Man 1, Woman 3, Man 2 (Man 2 is first-look; may reject).  
2. **Franz art** — separated head parts + board/bindings for the first accepted rider (prefer Woman 2).  
3. **Eng ingest** — plates only; keep `REGISTERED_VISUAL_PROTOTYPE_ONLY` / `acceptanceEligible=false` until Ted says otherwise.  
4. **Android Batch E** — Woman 2 first on physical device; then others that pass visual.  
5. **Journey UI batch** — close PARTIAL/MISSING steps 3, 4, 10, 11 on an isolated draft tip (fictional data).  
6. **Security stack reconcile** — re-base/restack #22 onto character tip **as draft**; still **do not activate** live authz.  
7. **Only later** — rebase snowboard stack toward post-arcade main (conflict-prone); arcade stays separate forever.

---

## Security / youth gates (non-negotiable unless Ted opens them)

| Gate | State |
|---|---|
| Grom / youth enrollment | **HELD** |
| Production server authz | Packet may exist — **NOT activated** |
| Payments / wallet | Stub only |
| Physical deletion jobs | **Off** |
| Pages publish of draft tip | **No** |
| Merge to main | **No** until explicit Merge-order Go |
| Arcade fold into journey | **Forbidden** |

---

## Owner visual-review items (queue)

| Priority | Item | Current label |
|---|---|---|
| 1 | Woman 2 finishing pack (hashes already match tip) | REGISTERED_VISUAL_PROTOTYPE_ONLY |
| 2 | Man 1 jacket-off + tan default | OWNER_REVIEW_REQUIRED |
| 3 | Woman 3 default (fuchsia alt TEST-ONLY) | OWNER_REVIEW_REQUIRED |
| 4 | Man 2 framework first look | **NOT owner-visually approved** |
| 5 | Any new separated hair/helmet/goggles plates | Not delivered |

---

## What the next batch must preserve

- Five-tab nav + CrewLink Invite lock  
- Character slot labels only (Woman 1/2/3, Man 1/2/3, Grom 1/2)  
- No roster expansion for tests  
- Fictional data where production auth absent  
- Arcade (#42) separate  

---

## Success for the next batch (when Ted approves the prompt)

- Isolated draft PR(s); CI green  
- Honest status labels only  
- Android results only if real device evidence attached  
- Executable work stays within approved scope — no surprise merge
