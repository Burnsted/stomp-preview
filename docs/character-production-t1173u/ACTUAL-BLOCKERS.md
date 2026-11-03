# ACTUAL-BLOCKERS — t1173u consolidated (real blockers only)

Technical integration for eight slots is ready. Below are **actual** remaining blockers — not intentional holds restated as failures, and not work already done on tip.

## OPEN (blocks full artwork acceptance / layered customize)

| # | Blocker | Owner | Notes |
|---|---|---|---|
| 1 | **Modular transparent layer plates not delivered** for any of the eight looks (1024/512). Runtime = SVG fallback only. | Grok Build / art | Masters for Looks 1–3 exist for QA; they are **not** modular plates |
| 2 | **Starter preview WebPs** missing under `gb-phone/public/stomper/.../preview@512.webp` for mapped IDs | Grok Build / art | URL contract ready; files not on disk |
| 3 | **Owner visual masters still missing** for Adult Looks 4–6 + Grom Boy/Girl | Owner / art production | Slots wired; status AWAITING_MASTER — no substitutes |
| 4 | **Jacket-set art plates** (coordinated pants/bibs as separate alphas) + Look 5 glasses/beanie hair plates | Grok Build / art | Logic ready; art outstanding |
| 5 | **Physical Android device QA** (390×844 + hardware) once plates land | QA | Carried; cannot close without assets |

## HELD (intentional — not ship defects)

| Item | Status |
|---|---|
| `gromFlowEnabled=false` (Grom enrollment) | **HELD** — legal/owner |
| Payments / wallet / production authz | **HELD** — out of scope |
| Pages / prod deploy / merge to main | **HELD** — DRAFT PR only |

## NOT blockers (done on this tip)

- Eight-look ID mapping (`m-samir` … `g-aria`) from PR #20 preserved  
- Slot readiness for all 8 (APPROVED_MASTER ×3 + AWAITING_MASTER ×5)  
- Plate URL + SVG fallback path  
- Consistency contract across selector / Build Your Look / Locker  
- Jacket→pants coordination; backpack OFF; eyewear options; STOMPER names (t1169u)  
- Looks 1–3 visual masters archived under `docs/.../masters/` for provenance/QA  
- Explicit forbid: poster-crop → fake modular plates  
- Grom enrollment remains disabled
