# REPORT — t1194u TRUE modular Look 2 alignment (DRAFT)

**Title:** DRAFT t1194u — TRUE modular Look2 alignment (do not merge)  
**Owner:** Ted Burns (`t1194u`)  
**Base:** stacked from #21 tip `8b4b79986637ea69330698d8363726feaa8f477f`  
**Branch:** `cursor/modular-look2-alignment-t1194u-a5c4`  
**Hard nos:** no merge · no Home/five-tab/Crew Invite · no payments/youth/live/Pages · no face/pose redesign · tips #12–#20/#22–#26 untouched

## Verdict

Engineering registration pipeline **corrected** (canonical 1024×1024 → common 512 scale; banned independent per-piece fit).  
Under-jacket body **AWAITING_FRANZ_BODY** (Franz: blank Drive stack; Runway auto FAIL; will not invent).  
Overall visualRegistrationGate **BLOCKED_UNDERLAYER** — **no fake PASS**.  
Composite **A BLOCKED** · **B EXTRACTED_REGISTERED** · **C BLOCKED** (ink ABSENT).  
Android Batch E **OPEN_DEVICE** — no physical-device PASS claimed.

## Corrected pipeline

| Piece | Path |
|---|---|
| Extract (rewritten) | `scripts/extract-look2-mint-plates.py` |
| Validate | `scripts/validate-look2-registration.py` |
| Contract | `docs/modular-alignment-t1194u/REGISTRATION-CONTRACT.md` |
| Transform | `docs/modular-alignment-t1194u/registration-transform.json` |
| Runtime plates | `gb-phone/public/stomper/adult/**/*.webp` |
| Manifest | `gb-phone/src/lib/stomp/avatar/look2-plate-manifest.json` |

**Rules enforced:** one master-derived `RegistrationTransform`; clothing = in-place masks on registered master; runtime = scale 0.5 only; banned `tight_crop`→center / `fit_to_canvas` / `aligned_stack_canvas` / `enrich_with_iso` reposition.

## Editable master status

| Asset | Status |
|---|---|
| ORA | `docs/character-production-t1173u/masters/editable-look2/look2-f-hana-REGISTERED-MASTER.ora` |
| PNG layer pack `@1024` | `docs/modular-alignment-t1194u/masters/registered-1024/` |
| Body layer slot | **AWAITING_FRANZ_BODY** (`editable-look2/ARTWORK-STATUS-BODY.txt`) |
| Provisional `body-athletic@512.webp` | sheet base_body foot-aligned to master — pipeline only |
| Approved / sheet provenance | `docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png` + `…-MODULAR-SHEET.png` |

## Plates (runtime 512, shared canvas)

Required LOOK2_MINT paths rewritten with matching manifest sha256 (see JSON). Optional backpack PRESENT. Ink paths **absent**.

## Composites A / B / C

| ID | Status | Evidence |
|---|---|---|
| A jacket-off underlayer | **BLOCKED** | `composites/A-STATUS.txt`, `composites/A-jacket-off-PROVISIONAL.png`, `evidence/A-BLOCKED-underjacket-holes.png` (coverage ≈0.85 < 0.92) |
| B mint outfit | **EXTRACTED_REGISTERED** | `composites/B-mint-identity-swap-REGISTERED.png`, `evidence/B-master-vs-layered-registered.png` |
| C ink outfit | **BLOCKED** | `composites/C-STATUS.txt`, `evidence/C-BLOCKED-ink-absent.png` — Franz will not invent |

## Visual / registration evidence

- `evidence/validation-summary.json` — engineering checks OK; artwork underlayer expected FAIL; overall **BLOCKED_UNDERLAYER**; Android **NOT_CLAIMED**
- `evidence/registration-metrics.json` — centroids / coverage
- Preview screenshots: composites + evidence PNGs above (not DOM/checksum-only)

## CI + commit

| Field | Value |
|---|---|
| Tip SHA | `d05b3a93f122b16f3538656592985e0911f2ad05` |
| CI | both pr-verify jobs must be green before claiming engineering done |
| AF tests | existing Look 2 plate tests + `look2-registration-t1194u.test.tsx` |

## Remaining artwork blockers

1. Franz under-jacket body (complete torso+arms, shoulders match jacket, neck/wrist connections) — **blocks A + visual PASS**
2. Ink C plates if/when owner-approved — currently ABSENT
3. Physical Android Batch E device evidence
4. Other looks plates — scaffolding only (`scaffolding/OTHER-LOOKS-REGISTRATION.md`); do not invent; preserve Look 3 fuller / grom child proportions

## Untouched

Home · five-tab · Crew Invite · payments · youth · live accounts · Pages deploy · #12–#20/#22–#26 tips (except stack base #21).
