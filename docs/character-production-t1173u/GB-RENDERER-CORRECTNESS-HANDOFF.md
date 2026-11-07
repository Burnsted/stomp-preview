# GB-RENDERER-CORRECTNESS-HANDOFF — t1178u (Woz → Grok Build)

**Do not wake GB from this agent — file only.** Design CLOSED. Visual masters LOCKED.  
**Draft PR #21 tip:** see latest commit on `cursor/character-production-t1173u-e14a`.

## Stages (do not conflate)

| Stage | Status |
|---|---|
| Visual-ref approval | **CLOSED** (8/8 APPROVED_MASTER under `docs/.../masters/`) |
| Modular plate delivery | **LOOK2_PRESENT** (owner modular sheet → public/stomper); Looks 1 & 3–8 still OPEN |
| Android functionality | **OPEN_DEVICE** — Look 2 plates on disk; physical Batch E not auto-PASS |

## Required patches already on PR #21 tip (Woz)

1. **All-or-nothing plate compositing** (`plate-assembly.ts` + `AvatarRenderer`)  
   - Plate mode **only** when every required layer plate is present.  
   - Partial sets → `svg-fallback` + `data-plate-reason=incomplete-set` (never half-dressed rider).  
   - `data-acceptance-eligible=true` only when complete.
2. **Docs masters never runtime** — paths under `docs/` / `APPROVED_REFERENCES` rejected.  
3. **Jacket-set** still writes **two** itemIds (`applyJacketSet`) — never merged bitmap.  
4. **Board + goggles + backpack** in required set (backpack OFF omitted intentionally).  
5. **Missing-asset reporting** via `data-missing-plates`, `data-plate-reason`, `data-acceptance-eligible`.  
6. Look 2 defaults: `jacket-look2-mint` + `pants-look2-mint` on `f-hana`.

## Exact expected file paths (Look 2 first gate)

Drop under `gb-phone/public` (served as `/stomper/...`):

```
/stomper/adult/jacket/jacket-look2-mint@512.webp
/stomper/adult/pants/pants-look2-mint@512.webp
/stomper/adult/body/body-athletic@512.webp
/stomper/adult/face/face-female@512.webp
/stomper/adult/hair/hair-straight@512.webp
/stomper/adult/headwear/helmet-basic@512.webp
/stomper/adult/goggles/goggles-basic@512.webp
/stomper/adult/gloves/gloves-basic@512.webp
/stomper/adult/boots/boots-basic@512.webp
/stomper/adult/board/board-basic@512.webp
/stomper/adult/starter/f-hana/preview@512.webp
```

Optional `@1024.webp` masters. **Do not** ship backpack plate unless equipped (`backpack-daypack`); default is OFF.

When the **full required set** for the equipped itemIds is present, renderer flips to `data-render-mode=plates`. One missing file ⇒ still SVG + incomplete report (no false success).

## Look 2 Android pass (after plates land)

See `LOOK2-MINT-ACCEPTANCE.md`. Must verify on physical Android in real selector + Locker: jacket/pants separate, jacket swap, eyewear swap, backpack off, name persistence, return to Locker, identity vs `look2-f-hana-APPROVED.png` (sha `b92ba262…`).

## Fail modes (automatic FAIL)

| Fail | Why |
|---|---|
| Partial plate set rendered | Half-dressed rider — forbidden by t1178u |
| Docs master / poster used as layer | Masters ≠ plates |
| Merged jacket+pants bitmap | Must be two itemIds / two files |
| Claim success on SVG-only desktop still | Not Android layered acceptance |
| `data-acceptance-eligible=false` while claiming pass | Missing-asset guard |
| Silent starter labels as displayName | t1169u identity lock |
| `gromFlowEnabled=true` | Youth HELD |

## Remaining looks

After Look 2 pass, produce remaining modular plates for `m-samir`, `f-priya`, `m-devon`, `f-nova`, `m-leo`, `g-milo`, `g-aria` using same `/stomper/{band}/{slot}/{itemId}@512.webp` contract. Grom = preview only; enrollment stays off.

## Out of scope

No regenerate faces · no merge/Pages/deploy · no payments · no youth · no inventing plates in this Woz tip.
