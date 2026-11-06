# Haven's Garden — greenhouse layers v1 (QA revision)

## Capacities & hits (delivery gate)
| Size | Beds | Positions | Active | Inactive | min hit native | min @390×844 |
|------|------|-----------|--------|----------|----------------|--------------|
| small | 2 | 12 | **12** | 0 | 66×66 | 44.0×44.0 |
| medium | 4 | 24 | **20** | 4 | 66×66 | 44.0×44.0 |
| large | 5 | 30 | **30** | 0 | 66×66 | 44.0×44.0 |
| outdoor | 2 | 12 | **12** | 0 | 66×66 | 44.0×44.0 |

Every active `hitBounds` ≥ **66×66** native (**44×44** at 390), **both** W and H. Roots **strictly inside** soil polygon (pixel test). Medium: 20 active + 4 unavailable.

**Geometry note:** Non-overlapping 66×66 in a 2×3 grid needs soil height ≳210px. The earlier “≥132px soil” figure cannot satisfy that gate; beds use ≥210×198 soil and a flatter layout in the lower ~750px.

## Compositing (no doubled lips)
`plateNoLip` → `soil_dry`/`soil_wet` → plants → `front_lip` (extracted from same paint pass).

## Growth
Daisy family: seedling → leaves → closed daisy bud → open daisy bloom.

## Validation
OK=True
{
  "ok": true,
  "checks": [
    "small: active=12 minHitNative=66x66 proj=[44.0, 44.0] roots-strict-inside=PASS",
    "medium: active=20 minHitNative=66x66 proj=[44.0, 44.0] roots-strict-inside=PASS",
    "large: active=30 minHitNative=66x66 proj=[44.0, 44.0] roots-strict-inside=PASS",
    "outdoor: active=12 minHitNative=66x66 proj=[44.0, 44.0] roots-strict-inside=PASS"
  ],
  "failures": []
}
