# t1205u — Multi-rider modular system (REGISTERED_VISUAL_PROTOTYPE_ONLY)

**Draft ONLY.** No merge. No Pages/deploy. No production auth. No payments. No youth/Grom activation.

**Base tip:** `f70aaed514953b79f1c76a907931bbbde34248f7` (PR #27 Look2 finishing docs pin).

**Status:** `REGISTERED_VISUAL_PROTOTYPE_ONLY` for Man 1, Woman 2, Woman 3, Man 2 (Look 4).

### CI pin (both jobs SUCCESS)

| Field | Value |
|---|---|
| Tip SHA | `5701a1809997820386200e09bfb63d26f1e81928` |
| CI run | [41874457949](https://github.com/Burnsted/stomp-preview/actions/runs/41874457949) |
| `batch1 typecheck + test` | **SUCCESS** |
| `gb-phone typecheck + woz tests + build` | **SUCCESS** |
| Run conclusion | **success** |

Still **DRAFT — NO MERGE**. CI green ≠ owner visual PASS ≠ Android PASS.

| Claim | Value |
|---|---|
| Owner visual PASS | **NOT CLAIMED** (Man 2: NOT owner-reviewed) |
| Android device PASS | **NOT RUN** |
| `acceptanceEligible` | **false** for all modular prototypes |
| Merge / Pages | **NO** |

## Slot labels (user-facing)

| Slot label | Technical starterId | Look |
|---|---|---|
| Man 1 | `m-samir` | Adult Look 1 |
| Woman 2 | `f-hana` | Adult Look 2 (preserved Look2 corrections) |
| Woman 3 | `f-priya` | Adult Look 3 |
| Man 2 | `m-devon` | Adult Look 4 |

Never use Samir/Priya/Devon/Hana as displayNames in product copy. Starter `.label` values are slot labels.

## Franz source ZIP pins (sha256)

| Rider | ZIP sha256 |
|---|---|
| Man 1 | `d51249b715a46872fbc54d122217aaa3351c1c538f334ea0b79f2b951b605365` |
| Woman 3 | `c23e0ceb6f332b5f55ba253844b8926eb6ab3f80fd9c95e7312e551b6de2f758` |
| Man 2 | `d7d6484409c4da276ca095f21d765ff00c7d915d16befe2cccebd075d7fa7a02` |

Pack receipts: `docs/multi-rider-t1205u/packs/{m-samir,f-priya,m-devon}/`.

## Asset completeness matrix

| Rider | 8 plates | Separated hair | Separated headwear | Separated goggles | Board+bindings | Backpack | Alt outfit | Owner visual | Android |
|---|---|---|---|---|---|---|---|---|---|
| Man 1 | PRESENT | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT | TEST-ONLY (orange/charcoal) | OWNER_REVIEW_REQUIRED | NOT_RUN |
| Woman 2 | PRESENT (Look2 preserved) | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT | TEST-ONLY (ink) | LOOK2_PRESERVED | NOT_RUN |
| Woman 3 | PRESENT | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT | TEST-ONLY (fuchsia/charcoal) | OWNER_REVIEW_REQUIRED | NOT_RUN |
| Man 2 | PRESENT (framework) | ABSENT | ABSENT | ABSENT | ABSENT | ABSENT | TEST-ONLY (white/charcoal) | **NOT_OWNER_REVIEWED** | NOT_RUN |

Underbody on all packs: constructed apparel, **not** photo anatomy.

Head: **ONE locked plate** (hair/helmet/goggles not separate). Fail-closed when required production slots absent.

## Runtime itemIds (unique per rider — no shared body clobber)

See `ingested-runtime-sha256.json` and `gb-phone/src/lib/stomp/avatar/modular-riders.ts`.

## Functional A/B/C (automated)

| Rider | A (jacket OFF) | B (default) | C (alt TEST) | Render mode | acceptanceEligible |
|---|---|---|---|---|---|
| Man 1 | PASS (plates) | PASS tan/black | PASS orange/charcoal TEST | plates | false |
| Woman 2 | PASS (Look2) | PASS mint | PASS ink | plates | false |
| Woman 3 | PASS (plates) | PASS purple | PASS fuchsia/charcoal TEST | plates | false |
| Man 2 | PASS framework | PASS orange/charcoal | PASS white TEST | plates | false |

Look2 Woman2 regression suite: green (finishing / plates / registration / plate-ingest / roster).

Multi-rider Locker isolation: proven via per-rider storage keys `stomp-avatar-locker-rider:{starterId}` + `riderConfigs` map.

## Android Batch E checklist (docs only — NOT RUN)

See `android-batch-e/CHECKLIST.md`.

## Essential owner approvals (blockers)

1. Man 1 — owner visual review of tan default + underbody fit (jacket OFF).
2. Woman 3 — owner visual review vs roster card; fuchsia alt is TEST only.
3. Man 2 — **first** owner visual review of orange/charcoal locked black goggles pack (framework only today).
4. Separated hair / helmet / goggles plates (all riders) — currently ABSENT.
5. Real board + bindings + independent backpack — currently ABSENT.
6. Physical Android Batch E device proof — NOT RUN.

## Screenshots

Phone-viewport (~390×844) A/B/C proofs under `docs/multi-rider-t1205u/screenshots/` (browser CSS viewport ≠ Android PASS).
