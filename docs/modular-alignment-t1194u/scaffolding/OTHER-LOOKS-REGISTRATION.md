# Other looks — registered-canvas scaffolding (t1194u)

**Gate:** Apply only **after** Look 2 visual registration gate passes (Franz under-jacket body + jacket-off A PASS).  
**HARD:** Do **not** invent plates for Looks 1, 3–8 or Grom. Preserve distinct proportions (Look 3 fuller; groms child). Groms preview-only; youth disabled (`gromFlowEnabled=false`).

## Method (same as Look 2)

1. Canonical **1024×1024** production canvas per look.
2. One `RegistrationTransform` from that look’s MASTER figure (not independent per-piece fit).
3. Clothing plates = in-place masks / Franz pose-locked layers on that canvas.
4. Runtime export = **one common scale** 1024→512.
5. Banned: `tight_crop`→center, `fit_to_canvas` per piece, `aligned_stack_canvas`, `enrich_with_iso` reposition.

## Per-look checklist (empty until assets land)

| Look | Starter | Master | Underlayer | Mint/outfit plates | Notes |
|---|---|---|---|---|---|
| 1 | `m-samir` | APPROVED_MASTER (docs) | — | **missing** | After Look 2 |
| 2 | `f-hana` | APPROVED + modular sheet | **AWAITING_FRANZ_BODY** | registered mint PRESENT | This tip |
| 3 | (roster) | APPROVED_MASTER | — | **missing** | Fuller proportions — do not reuse Look 2 body |
| 4–6 | roster | APPROVED_MASTER | — | **missing** | Eyewear locks per CONSISTENCY-CONTRACT |
| 7–8 / Grom | roster | preview-only | — | **missing** | Youth disabled |

## Deliverable when unblocked

- `scripts/extract-lookN-registered-plates.py` cloning Look 2 contract
- `registration-transform.json` per look
- Editable ORA/PNG layer pack
- Visual A/B/(C if approved variants) evidence — no fake PASS
