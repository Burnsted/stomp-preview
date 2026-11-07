# REPORT — Rider source selective compare + consolidated closure (t1163u / t1164u)

**Status:** DRAFT / DO NOT MERGE · throwaway lineage only  
**PR:** https://github.com/Burnsted/stomp-preview/pull/17 (update this tip)  
**Branch:** `cursor/release-blocker-closure-t1159u`  
**Prior tip:** `b51691d9614a18e5c48122c7712b81df06fac534`  
**No merge · no Pages · no payments · no youth · no SV-0 scope expansion.**

---

## 1. Identity

| Field | Value |
|---|---|
| Draft PR | #17 (DRAFT / DO NOT MERGE) |
| Branch | `cursor/release-blocker-closure-t1159u` |
| HEAD | `0e92a44eb55fbda1e0e7b6c53b48b45c0873ae6b` (feature `add3ebb`) |
| CI | BOTH jobs PASS — https://github.com/Burnsted/stomp-preview/actions/runs/41572325511 |

---

## 2. ZIP integrity

| Check | Result |
|---|---|
| Path | uploads `STOMP-RIDER-SOURCE-HANDOFF_3448.zip` |
| Size | 30333 B |
| sha256 | `d89849228a1c6c257331782e018dd2c5c8c374362b115d04b3b7d4b0f4f4afe4` **MATCH** |
| Entries | **13** under `STOMP-RIDER-SOURCE-HANDOFF/` |
| MANIFEST | Present; recorded in this folder |

### 13-file list

1. `MANIFEST.txt`  
2. `package.json`  
3. `src/lib/stomp/social.ts` **ADDED**  
4. `src/lib/stomp/social-store.ts` **ADDED**  
5. `src/lib/stomp/social.test.ts` **ADDED**  
6. `src/lib/stomp/store.ts` MODIFIED  
7. `src/lib/stomp/session-voice.ts` MODIFIED  
8. `src/components/stomp/rider-hub.tsx` **ADDED**  
9. `src/components/stomp/session-mic.tsx` MODIFIED  
10. `src/components/stomp/app.tsx` MODIFIED  
11. `src/components/stomp/stompers.tsx` MODIFIED  
12. `src/components/stomp/bag.tsx` MODIFIED (→ ADAPT bag-of-tricks)  
13. `src/components/stomp/mountain-home.tsx` MODIFIED (→ ADAPT home)

---

## 3. Protected tip table (byte-identical — reconfirmed via `gh`)

| PR | Tip SHA | Unchanged? |
|---|---|---|
| #12 | `78dc9f9174acfbc16bf096e6c3673960a8e5da77` | YES |
| #13 | `1e40eab2aec8c6980919d3f86448f4336ee4126e` | YES |
| #14 | `ec870fe5b4ab025b3dadcfc10e78bcf517aa8736` | YES |
| #15 | `16b61211f4caecc28ced981952a7171fc9659454` | YES |
| #16 | `e737b380af51b527d91a4e0a2a8e3da084d60fc9` | YES |
| #17 prior | `b51691d9614a18e5c48122c7712b81df06fac534` | Advanced only on this throwaway lineage |

---

## 4. File matrix summary

See `FILE-DIFF-MATRIX.md` + `CHERRY-PICK-PLAN.md`.

| Bucket | Outcome |
|---|---|
| 4 ADDED | **Landed** at `gb-phone/` paths |
| store / voice / mic / app / stompers / package.json | **Surgical CHERRY-PICK** — no wholesale replace |
| bag / mountain-home | **ADAPT** into `bag-of-tricks.tsx` / `home.tsx` |
| alpine-chrome hub→crew | **ADAPT** (nav coherence) |
| greet.tsx | **Untouched** sha256 `12c006f0…859` |
| og.jpg | **Untouched** |

---

## 5. Onboarding: STOMPER-before-main preserved?

**YES.**

| Evidence | Detail |
|---|---|
| Default screen | `store.ts` initial + rehydrate → `"greet"` (not hub) |
| greet.tsx | Not in ZIP; not edited; Crew Invite intact |
| Five-tab | `PRIMARY_TABS` still HOME\|MAP\|MUSIC\|STATS\|CREW |
| Rider Hub entry | Additive: Home “Rider” text + Campfire “Open campfire” + voice → `hub` |
| Avatar-null in social.ts | Demo gate for Rider Hub journeys (`joinTrip`/`canPost`) — **orthogonal** to Woz STOMPER/greet gate; does not bypass greet |
| Main nav | Hub does not replace Home; `tabForScreen("hub")` → crew highlight only |

---

## 6. Tests

| Suite | Result |
|---|---|
| `node … social.test.ts` | **7/7 PASS** |
| `gb-phone` `npm test` (incl. social) | **66/66 PASS** |
| `gb-phone` `tsc --noEmit` | **PASS** |
| `batch1` AF-RC-01..10 | **21/21 PASS** (no SV-0 regression) |
| SV-0 scope | **Not expanded**; no verified regression from Rider fold |

---

## 7. Remaining critical blockers

1. **Server authz** for Pass / Viewer / Squad / share — client Rider Hub = DEMO ONLY  
2. **Merge-order Go** (#12→#13→rebase #14/#16) — owner only; this PR stays draft  
3. Wire batch1 CF-2/SV-0 into shell beyond phone demo — **HELD paste**  
4. Youth / payments / deletion / G1–G4 / F1–F5 — **HELD**  
5. Real identity / age / guardian consent — OPEN  
6. Pages / prod deploy — **FORBIDDEN** here  

Rider **source transfer** → **CLOSED** (verified ZIP + selective fold). See `RELEASE-BLOCKERS.md`.

---

## 8. Smallest RC path (STATE — do not merge)

1. Merge #12 → main  
2. Land #13  
3. Rebase #14 then #16  
4. Land A1–A6 (+ A5 SV-0 deny)  
5. Rider source verified — keep compare-don’t-rebuild for residual deltas  
6. Server authz  
7. Integration acceptance beyond fictional + demo  

---

## 9. Owner approvals only

1. Merge-order Go  
2. Accept throwaway Rider fold into any release lineage (not done here)  
3. Deploy/Pages Go (if ever)  
4. Youth / payments / deletion Go (if ever)  
5. Legal G4 erasure  

---

## Artifacts

- `FILE-DIFF-MATRIX.md`  
- `CHERRY-PICK-PLAN.md`  
- `RELEASE-BLOCKERS.md`  
- `MANIFEST.txt` (from ZIP)  
- Updated `docs/release-blocker-closure-t1159u/GROK-BUILD-CONTRACT-MAP.md` (HELD paste; source now verified)
