# STOMP Master HQ — Integration readiness report (t1206u)

**For:** Ted (owner)  
**Date:** 2026-11-04  
**Kind:** READ-ONLY audit. Docs only. **Do not merge.**

---

## Bottom line (plain English)

The **main snowboarding app** is still a **stack of open draft PRs**, not a single merged product tip. The farthest honest tip for avatar + journey fiction is **PR #39** (`7ee43f46…`), which sits on Look 2 finishing (#27) and the character stack (#21 → #17 → #12).

**Arcade games (#42) are already on main** and must stay **separate** from snowboard journey readiness.

Biggest blockers before a real “one complete rider journey” on a phone:

1. **Owner visual review still open** for Man 1, Woman 3, and especially Man 2 (framework only). Woman 2 finishing art matches Franz’s newest pack on disk — still **not** an owner visual PASS.
2. **Missing independent gear layers** (separate hair / helmet / goggles / board / backpack) — every modular rider is prototype 8-of-11.
3. **No physical Android proof** — Android is **NOT RUN**.
4. **Trip / Squad / Sesh / Pass rules** exist as **fictional / demo logic** with strong automated tests — **not** live production security.
5. Several journey surfaces are **partial or missing** in the phone UI (clips-first Profile polish, My Boards as a clear product surface, Trip Drop Replay + personal Report Card).

**CI (re-verified):** both checks **SUCCESS** on #27 tip `f70aaed5…` and #39 tip `7ee43f46…`. Green CI ≠ merge ready ≠ Android PASS.

---

## A. Source of truth

### What is “live” today

| Surface | Authoritative tip | Notes |
|---|---|---|
| GitHub Pages / public site | **main** `d53b0657cc963d36d6463d29f4dee65d1e4bdcc9` | Pages deploy after arcade merge |
| Arcade playtest hub | **#42 MERGED** → main | **OUT OF SCOPE** for snowboard journey |
| Main STOMP snowboarding app (avatar + Bag + trips fiction) | **Draft stack tip #39** `7ee43f46cbcb891a81bd57d70ffadc50e1999661` | Not on main; draft only |
| Mock / fictional policy + Squad / Sesh / Pass | Included in #39 ancestry via **#17** `5dc2c8e8…` | Fictional data; no live auth |

### Dependency chain (snowboard app drafts)

```
main (old base for #12: 4afd4300…)
  └─ #12 Avatar Foundation + Alpine HQ + Bag     78dc9f91…
       └─ #13 Trip Drop / Day Sesh                 1e40eab2…
            └─ #17 release-blocker + G1–G4         5dc2c8e8…
                 └─ #18 avatar identity looks      69d3dafc…
                      └─ #19 release candidate     9c6cc96e…
                           └─ #20 roster v2.4      19753634…
                                └─ #21 character production  8b4b7998…
                                     └─ #27 Look 2 finishing Woman 2  f70aaed5…
                                          └─ #39 multi-rider Man 1 / Woman 3 / Man 2  7ee43f46…  ← audit tip
```

**Verified ancestry:** #12, #17, #21, and #27 are all ancestors of #39.

### Parallel stacks (not folded into #39)

| PR | Tip | Base | Relationship |
|---|---|---|---|
| #14 Campfire CF-2 | `ec870fe5…` | main | Parallel; content selectively folded into #15/#17 |
| #16 Sesh SV-0 | `e737b380…` | #14 | Parallel; SV-0 rules folded into #17 lineage |
| #22 release-security | `7917aa69…` | #19 | **Sibling** of #20 — security docs/packet; **not** ancestor of #39 |
| #24 Campfire CF-3 shell | `cc1f153f…` | #17 | Parallel Campfire UI depth; **not** ancestor of #39 |
| #25 / #26 progress + Campfire depth | tips on #22 / #24 | stacked | Parallel; **not** on #39 |
| #23 Franz Look2 docs | `3066ba9d…` | main | Docs-only art status; superseded by #27/#39 plate work |
| #42 arcade | MERGED on main | main | **Separate product surface** |

### Conflicts / duplicates / superseded

- **#14 / #16 vs #15 / #17:** same Campfire + Sesh ideas landed twice — treat **#17 tip** as the folded oracle; keep #14/#16 for rebase history only.
- **#22 vs #20/#21/#27/#39:** both grow from #19. Security readiness (#22) and character art (#20→#39) **diverge**. A future merge must re-stack security onto the character tip (or the reverse) — **not done**.
- **#23 vs #27:** #23 docs on main; finishing plates + phone prove-out live on **#27/#39**. Prefer #27/#39 for Woman 2 runtime hashes.
- **#12 base is stale vs current main:** #12 branched from `4afd4300…`; main has since gained arcade + many Terrain Park / Boulder Dodge deploys. Rebase onto post-arcade main is a **future** integration risk — do not treat #39 as “ready for main.”
- **Arcade must not be folded** into snowboard journey scope.

### Five-tab + CrewLink (still intact on #39)

| Protection | Evidence on tip `7ee43f46…` |
|---|---|
| Five primary tabs | `PRIMARY_TABS` = Home · Map · Music · Stats · Crew (`alpine-chrome.tsx`); tests assert length/labels |
| CrewLink Invite lock | `CREWLINK_SHA` pin `7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe` in `greet-invite-sha.ts`; many woz tests assert unchanged |
| Grom / youth held | `gromFlowEnabled: false`; youth Campfire flag off in batch1 policy |

---

## B. Avatar gaps

### Woman 2 (Look 2) — finishing pack vs what is on #27 / #39

Franz Look2 folder (canonical) `1swuEBtojhgvtRnalvgMcwm9VCWm6i5fH`:

| Drive artifact | Id | Modified (UTC) |
|---|---|---|
| Newest finishing ZIP | `1Tg0OG-9poiaLKscqx8jdrpXGicMIxTby` | 2026-11-04 ~15:11 |
| ARTWORK-STATUS | `1nBoJAz5vZG7NBra5K8KgavdrSLNBKpRO` | 2026-11-04 ~15:11 |

**Checksum match (verified on tip `7ee43f46…`):**

| Plate | Franz FINISHING status sha256 | On-disk #39 |
|---|---|---|
| Locked head / face | `c2ffcbd901648b718d71d468f31090b959459b97b7fd9a7d25ca6044580bd434` | **MATCH** |
| Body (jacket-off) | `85ecf3646890a4e4a730f7045a34b8284fbea8aa5dbeb4b0d26614873d26d37a` | **MATCH** |

ZIP sha256 recorded in finishing receipt: `2118bdc84855f2aae526fdaf6111d014e5d990dd0705a1354113988b67bdbd84`.

**Status:** `REGISTERED_VISUAL_PROTOTYPE_ONLY`. Crotch clip cleared in engineering notes. **Not** owner visual PASS. **Not** Android PASS.

### Multi-rider modular set on #39

| Slot label | Look | Ingest on #39 | Owner visual | Android |
|---|---|---|---|---|
| Man 1 | Look 1 ART PASS ZIP `1V-2Ve-OUaRX8zziiKHIbNIrQ0RiFGzHo` | PRESENT (prototype) | OWNER_REVIEW_REQUIRED | NOT RUN |
| Woman 2 | Look 2 finishing (above) | PRESENT (preserved) | LOOK2_PRESERVED — finishing staged; **no PASS claimed** | NOT RUN |
| Woman 3 | Look 3 prototype ZIP `1Ig8de_AtYKdmRLEd2eTpmGG-54HFw5nN` | PRESENT (prototype) | OWNER_REVIEW_REQUIRED | NOT RUN |
| Man 2 | Look 4 prototype ZIP `1lU8TagATSNf4MtN-Sdau7c3Q6H2bApIz` | PRESENT (framework) | **NOT owner-visually approved** | NOT RUN |

Woman 1, Man 3, Grom 1, Grom 2: roster **masters exist** in docs; **not** part of the #39 modular ingest set. **No roster expansion** for test counts.

### Missing independent layers (all modular riders)

| Layer | Status |
|---|---|
| Separated hair | ABSENT (locked into one head plate) |
| Separated helmet / headwear | ABSENT |
| Separated goggles | ABSENT |
| Real board + bindings | ABSENT (board stays OFF) |
| Independent backpack | ABSENT / OFF by default |
| Production 11-slot outfit | NOT COMPLETE (prototype ~8 plates) |

### Jacket-off + clothing-swap honesty

- Jacket-off (variant A) and coordinated clothing-swap (variant C) are **registered prototype behaviors** with automated A/B/C proofs.
- Alt outfits are marked **TEST-ONLY** where noted (e.g. Man 1 orange, Woman 3 fuchsia, Man 2 white).
- `acceptanceEligible=false` for all modular prototypes — fail-closed.
- Do **not** treat browser phone-viewport shots as Android acceptance.

### Per-rider Locker isolation

Present on #39: separate storage keys `stomp-avatar-locker-rider:{starterId}` + per-rider config map. Automated isolation proof documented in multi-rider functional results. **Real-device confirmation: NOT RUN.**

---

## C. One complete snowboard rider journey (audit only)

Full step table: [RIDER-JOURNEY-AUDIT.md](./RIDER-JOURNEY-AUDIT.md).

| # | Step | Verdict |
|---|---|---|
| 1 | Create STOMPER avatar | **PARTIAL** — onboard + modular prototypes; production layers incomplete |
| 2 | Onboarding + STOMPER ID | **PRESENT** (local / draft tip) |
| 3 | Clips-first STOMPER Profile | **PARTIAL** — clips exist; dedicated clips-first Profile product surface incomplete |
| 4 | Bag of Tricks level + My Boards | **PARTIAL** — Bag + levels present; “My Boards” not a clear completed product surface |
| 5 | Connect with another STOMPER | **PRESENT** — CrewLink Invite (locked) |
| 6 | Join approved Squad | **FICTIONAL-ONLY** (#17 lineage) |
| 7 | Create / join Trip Drop | **FICTIONAL-ONLY** (#13/#17) |
| 8 | Squad Quick Share clip/music | **FICTIONAL-ONLY** (#17; Quick Share contracts) |
| 9 | Sesh + recipient preview + affirmative confirm | **FICTIONAL-ONLY** (SV-0 folded into #17; 20s TTL) |
| 10 | Correctable Bag of Tricks achievement | **PARTIAL** — self-reported marks on phone; full correctable achievement product incomplete |
| 11 | Trip Drop Replay + personal Report Card | **MISSING / PARTIAL** — Trip fiction + Ride Replay demos elsewhere; personal Report Card not found as finished journey UI |
| 12 | Test Pass expiry, export access, deletion boundaries | **FICTIONAL-ONLY** — policies + tests locked; live deletion jobs **off**; prod authz **not activated** |

---

## D. Test matrix (summary)

| Area | Synthetic / CI | Real device |
|---|---|---|
| batch1 + gb-phone CI on #27 / #39 | SUCCESS | — |
| Avatar A/B/C + Look2 regressions | PASS (automated) | NOT RUN |
| Themes / persistence (local) | Covered in woz tests | NOT RUN |
| QR / Smart ID | Local / stub | NOT RUN |
| Permissions / Trip Viewer / Pass | Fictional authz tests PASS | NOT RUN |
| Grom gates | Held (`gromFlowEnabled=false`) — synthetic asserts | NOT RUN (must stay held) |
| Sesh confirm | Fictional SV-0 tests PASS | NOT RUN |
| Offline / media expiry | Policy + lazy expiry tests | NOT RUN; deletion jobs disabled |
| Arcade regression | On main (#42) — **separate** | N/A to journey |

Detail: [TEST-MATRIX.md](./TEST-MATRIX.md). Device steps: [ANDROID-DEVICE-TEST-INSTRUCTIONS.md](./ANDROID-DEVICE-TEST-INSTRUCTIONS.md) (**do not claim results**).

---

## E. Consolidated outputs

### Exact SHAs (pins)

| Role | SHA |
|---|---|
| Audit tip (#39) | `7ee43f46cbcb891a81bd57d70ffadc50e1999661` |
| Look 2 finishing (#27) | `f70aaed514953b79f1c76a907931bbbde34248f7` |
| Character production (#21) | `8b4b79986637ea69330698d8363726feaa8f477f` |
| Release-blocker + G1–G4 (#17) | `5dc2c8e8bd198b4f244226b3ff18ad1dd21ba7fb` |
| Avatar + Alpine + Bag (#12) | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` |
| Day Sesh (#13) | `1e40eab2aec8c6980919d3f86448f4336ee4126e` |
| main (Pages after arcade) | `d53b0657cc963d36d6463d29f4dee65d1e4bdcc9` |
| Arcade merge (#42) | `862657bbbc1444359bf61c94fa052c7d878cdbe0` |

### Completed vs missing (honest)

**Completed (draft / fictional / prototype):** five-tab + CrewLink locks; Bag of Tricks shell; STOMPER ID; Woman 2 finishing ingest matching Franz; Man 1 / Woman 3 / Man 2 modular framework; Trip/Squad/Sesh/Pass **fictional** contracts + G1–G4 policy lock; CI green on #27/#39.

**Missing / open:** owner visual PASS for modular riders; separated production layers; Android device evidence; production authz; full phone journey for Profile / My Boards / Report Card / Trip Replay; stacking security (#22) onto character tip; rebase onto post-arcade main.

### Owner visual items (queue)

1. Woman 2 finishing pack (engineering match only — needs Ted eyes)
2. Man 1 jacket-off underbody + tan default
3. Woman 3 vs roster card (fuchsia alt stays TEST-ONLY)
4. Man 2 first review (framework; **not** approved today)

### Security / youth gates (must stay held unless Ted explicitly opens)

- Youth / Grom enrollment: **HELD**
- Production server authz: packet exists on #22 lineage — **NOT activated**
- Payments / wallet: stubs only
- Physical deletion jobs: **disabled**
- Live Pages publish of draft snowboard tip: **NO**

### Hours + next batch

See [NEXT-BATCH.md](./NEXT-BATCH.md) (~**34–52 engineering hours** for the recommended implementation batch after owner Go; owner review time separate).

Paste-ready prompt (do **not** execute until Ted approves): [EXECUTABLE-IMPLEMENTATION-PROMPT.md](./EXECUTABLE-IMPLEMENTATION-PROMPT.md).

---

## What this audit did **not** do

- No merge, no rebase of stacks, no Pages publish, no service activation  
- No app/runtime product code changes  
- No Android PASS / owner visual PASS claims  
- No arcade fold-in  
- No roster expansion for testing  
- No launch of the next implementation batch
