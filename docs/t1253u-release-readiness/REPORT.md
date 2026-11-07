# t1253u — Release readiness (Issue #100)

**DRAFT ONLY · NO MERGE · NO DEPLOY · NO Pages · NO live GPS · NO media deletion jobs**

| Field | Value |
| --- | --- |
| Issue | [#100](https://github.com/Burnsted/stomp-preview/issues/100) |
| Authoritative product | [#87](https://github.com/Burnsted/stomp-preview/issues/87) |
| Start tip | PR [#99](https://github.com/Burnsted/stomp-preview/pull/99) `f7864b78e6508dbd79511f7b0b639cf9db89b698` |
| Branch | `cursor/t1253u-release-readiness-423f` |
| Draft PR | [#101](https://github.com/Burnsted/stomp-preview/pull/101) |
| Green tip SHA | `a1735fccf1bab835252551f497cb6baaab2b7059` |
| CI run | [42344042727](https://github.com/Burnsted/stomp-preview/actions/runs/42344042727) — both checks SUCCESS |

---

## 1. Reconcile — draft PRs #82 / #90 / #99

| PR | Tip | Commits vs `main` | Role |
| --- | --- | --- | --- |
| [#82](https://github.com/Burnsted/stomp-preview/pull/82) | `fdb7c04` | 154 | Social-first Home, Form #7 S menu, FAB clearance, Locker/Boards, styles+names, Woman 3 modular |
| [#90](https://github.com/Burnsted/stomp-preview/pull/90) | `40bf081` | 171 | Spot/Stash + Keeper + 7d TTL + t1246u TikTok-style UI + t1249u glitch fixes |
| [#99](https://github.com/Burnsted/stomp-preview/pull/99) | `f7864b7` | 173 | GB handoff ACL/media repository layer on top of #90 |

**Ancestry:** `#82 ⊂ #90 ⊂ #99` (merge-base checks). Unique `#90→#99` commits: `75a6ac5`, `f7864b7` (46 files, +1463/−23).

### Approved work preserved

| Item | Status |
| --- | --- |
| t1236u social-first Home | Present (`SocialHome`, Invite/Start + Upload Past) |
| Form #7 S menu (social-first order) | Present; monochrome lockups; no taglines |
| t1246u simplified TikTok-style Spot/Clips | Present (`SpotsPanel` / spot detail) — Ted APPROVED |
| t1249u glitch fixes | Present (prior tests green) |
| t1228u FAB clearance | Present (`HEY_SESSION_FAB_BOTTOM_CLASS`, single FAB) |
| Woman 3 modular | Present (locker/modular plates; not rewritten) |
| Locker / Boards | Present in S menu + screens |
| Styles + public names | Stomper Woman/Man/Grom only |
| `greet.tsx` CrewLink Invite SHA | **Pinned** `7795349de918fc1228687f677ff0064f4287e817662f6ccb4fd0fa2ba421fcbe` — match |

### Explicit gaps

1. **No production backend** — ACL/TTL/media are in-memory fiction; not CDN/authZ.
2. **Clock skew** — media resolve trusts the **injected** clock. A behind clock can revive expired media in the prototype. Production must bind repository calls to **server clock only** (documented in stress tests).
3. **Physical purge / CDN invalidation** — design-only (`DELETION-ARCHITECTURE.md`); live job OFF.
4. **Historical screenshot dual-write** (pre-t1250u `docs/` ↔ `gb-phone/screenshots/`) left in place — stripping inherited evidence would discard approved audit trails. Only t1250u duplicate set was removed (see audit).
5. **Licensed rider photos** still pending (PHOTO SLOT placeholders).

---

## 2. PR #99 change-set audit (+68765 / −1023 · 1279 files vs `main`)

| Class | Approx | Notes |
| --- | --- | --- |
| `docs/` evidence + screenshots | 609 files · +14k lines | Inherited #82/#90 history (character masters, modular proofs, owner reports) |
| `gb-phone/` app + tests + screenshots | 571 files · +35k/−1k | Product code + historical screenshots |
| `batch1/` Spot/Stash domain + tests | 93 files · +18k | Core ACL/TTL/repo |
| `scripts/` / brand / `__grok` | few | Form #7 OG/favicon lineage |
| **#99-only delta** | **46 files · +1463/−23** | Real integration: `repository.ts`, `media-access.ts`, tests, docs, shots |

### Accidental / flagged

| Finding | Action |
| --- | --- |
| Duplicate identical `docs/t1250u-…/screenshots/*` ↔ `gb-phone/screenshots/t1250u/*` (~3MB×2) | **Removed** `gb-phone/screenshots/t1250u/`; script now writes docs + artifacts only |
| `node_modules`, lockfile churn | **None** |
| `gb-reference/` (7 PNGs + HANDOFF, ~172K) | **Kept** — intentional GB archive, not product UI |
| Binary count vs `main` (~754) | Mostly approved character/modular evidence under `docs/` — not #99 bloat |
| Unrelated arcade | Not introduced by #99 tip (ancestry is Spot/Stash social chain) |

---

## 3. Privacy / security stress (repository layer)

New: `batch1/tests/spot-stash-t1253u.test.ts` (12 tests) — all **pass**.

| Case | Result |
| --- | --- |
| Direct stash `getPin` by non-member | `unauthorized`; **no lat/lng leak** |
| Removed crew → future `getPin` / `accessMedia` / list | Denied |
| Stale signed URL after ACL revoke | `unauthorized` |
| Keeper transfer + founder immutable; old keeper rename denied | Pass |
| Share without `confirmed:true` | `confirm_required` |
| 1ms before / exact / 1ms after `expiresAt` | Live / unreachable / unreachable |
| Signed URL after expiry | Unreachable (`token_expired` or `expired_unreachable`) |
| Export before ok; at deadline denied | Pass |
| Authoritative clock vs skewed client | Documented: wrong clock revives; server clock must be used |
| Live deletion job | OFF |

---

## 4. Mobile journey @ 360 / 390 / 430

Script: `gb-phone/scripts/t1253u-screenshots.mjs`  
Shots: `docs/t1253u-release-readiness/screenshots/` (+ `/opt/cursor/artifacts/t1253u/`)

| Step | Shot |
| --- | --- |
| STOMPER Home + single Sesh FAB | `01-home-social-single-sesh-fab-390.png` |
| Map/Trails Spots | `02-trails-spots-list-390.png` |
| Spot detail | `03-spot-detail-390.png` |
| Stash create (crew) | `04-stash-create-crew-390.png` |
| Stash detail | `05-stash-detail-390.png` |
| Sesh confirm share | `06-sesh-confirm-share-390.png` |
| Home widths 360/390/430 | `07-home-width-*.png` |
| Trails widths 360/390/430 | `08-trails-spots-width-*.png` |

`mobile-smoke.json`: each width → `fabCount: 1`, `trailSpots: map-tab-entry`.

---

## 5. Regression

| Area | Result |
| --- | --- |
| Social Home + Form #7 S menu + Trip Drops / Locker / Boards | Pass (`spot-stash-t1253u`, `social-home-t1236u`) |
| Single bottom-right Sesh FAB + t1228u clearance | Pass |
| Spot/Stash t1246u / t1249u / t1250u woz | Pass (24 tests across 4 files) |
| CrewLink SHA | Unchanged |
| Full `batch1` suite | **644 passed** / 8 skipped |
| Key woz regressions (social, FAB, locker, S-menu) | **45 passed** |

---

## 6. Bugs found / fixed

| Item | Severity | Action |
| --- | --- | --- |
| Duplicate t1250u screenshot tree | Bloat | Removed; script de-duplicated |
| Clock-skew revive if non-authoritative clock injected | Prototype risk | **Documented + tested**; no redesign; production must use server clock |
| Product logic bugs in ACL / expiry / confirm-share | — | **None found** requiring code change |

---

## 7. Functional vs simulated

| Capability | Status |
| --- | --- |
| Spot/Stash lists, Keeper transfer, crew ACL, one-shot pin, 7d TTL, confirm-share, export-before-expiry, signed preview URLs | **Functional** (in-memory) |
| Purge worker / CDN / backups / live GPS / live mic / network share | **Simulated / OFF** |

---

## 8. Blockers (owner)

- No merge / Pages / family playtest / production until owner approval
- Real authN/authZ + object storage + CDN signed URLs with server clock
- Enable purge worker only after owner sign-off
- Licensed rider photography still pending
- Device GPS/mic/battery **not measured** on hardware

---

## 9. Decisions (did not wait)

1. Canonical screenshots for t1250u/t1253u live under `docs/…/screenshots/` only.
2. Kept `gb-reference/` archive.
3. Did not strip inherited `docs/` modular/character evidence from #82/#90.
4. Stress tests assert exact `expiresAt` boundary as expired (`>=`).
5. No UI redesign of Ted-approved Spot/Clips.

---

## 10. Next recommendations (priority)

1. Wire repository media/ACL to a real server clock + auth session (closes skew gap).
2. Object storage + short-lived signed URLs; purge worker behind owner flag.
3. Owner visual review of licensed photo slots; then family playtest candidate (still draft).
4. Optionally collapse older dual-written screenshot trees in a dedicated chore PR (not this batch).
