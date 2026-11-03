# LOOK2-MINT-ACCEPTANCE — Physical Android gate (t1177u)

**Starter:** `f-hana` · Adult Look **2 of 6**  
**Visual master:** `masters/look2-f-hana-APPROVED.png`  
**sha256:** `b92ba262a516b29c3512a5e63371b30797dcaf5d6b93f47163588c04659a80da` (ASSET_MAP)  
**Code contract:** `gb-phone/src/lib/stomp/avatar/look2-acceptance.ts`  
**Status:** Visual **APPROVED_MASTER** · Modular plates **OPEN** · Android QA **AWAITING_GB_PLATES**

## Pass criteria (ALL required — physical Android only)

| # | Check | Pass only if |
|---|---|---|
| 1 | Separate mint plates | `jacket-look2-mint` + `pants-look2-mint` exist as **separate** transparent WebP plates under `public/stomper/` |
| 2 | Real surfaces | Layered in **real** character selector + Locker — **FAIL** if static still / UI mock / poster crop |
| 3 | Full-body preview | Composite shows jacket over pants without merged bitmap |
| 4 | Jacket swap | Changing jacket updates coordinated pants itemId; layers stay independent |
| 5 | Eyewear swap | Goggles slot swap works (`goggles-basic` available) |
| 6 | Backpack default | Backpack **OFF** (`backpack-none`); daypack optional, not auto |
| 7 | Name persistence | User-created STOMPER `displayName` survives look/layer changes |
| 8 | Return to Locker | Same `starterId` + layers + name after leaving and returning |
| 9 | Identity match | Face/body/outfit read matches Look 2 master (sha above) — no regenerate |

## Expected runtime paths (GB delivers — do not invent here)

```
/stomper/adult/jacket/jacket-look2-mint@512.webp
/stomper/adult/pants/pants-look2-mint@512.webp
/stomper/adult/starter/f-hana/preview@512.webp
```

Optional masters: same paths with `@1024.webp`.

## Automatic FAIL

- Poster-crop / composite-slice “plates”
- Docs masters mounted as runtime layers
- Claiming success from desktop screenshot of SVG fallback only
- Merged jacket+pants single bitmap
- Enabling `gromFlowEnabled` or youth flows

## Engineering prep (done on this tip)

- Catalog IDs + jacket-set coupling wired
- `f-hana` default layers point at Look 2 mint itemIds (SVG tint until plates land)
- `AvatarRenderer` plate probe → `data-render-mode=plates` when files exist; else `svg-fallback`
