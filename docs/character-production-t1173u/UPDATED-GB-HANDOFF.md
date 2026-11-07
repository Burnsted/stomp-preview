# UPDATED-GB-HANDOFF — Look 2 first gate (t1177u / t1178u)

**Audience:** Grok Build (when Ted unfreezes messaging) — produce **real composable transparent plates**.  
**Primary consolidated handoff:** `GB-RENDERER-CORRECTNESS-HANDOFF.md` (exact paths + Woz patches + fail modes).  
**Also:** `handoff-t1175u/` · `LOOK2-MINT-ACCEPTANCE.md` · `PLATE-RENDERER-CONTRACT.md`  
**Design:** CLOSED. Visual refs LOCKED. Masters ≠ modular plates. All-or-nothing plate compositing (no partial assemble).

## Stages

| Stage | Status |
|---|---|
| Visual-ref approval | **CLOSED** (8/8) |
| Asset delivery (modular plates) | **OPEN** — first deliver Look 2 mint |
| Android functionality | **AWAITING_GB_PLATES** — gate = Look 2 |

## Quote — GROK_BUILD_HANDOFF.md

> Do a ONE-character compositing QA first: test Look 2's mint jacket with real tinted jacket/pant plates; verify full-body preview, jacket swap, eyewear swap, backpack, name persistence and return to Locker on the same phone. Do not claim success from a static still, an enlarged poster crop, or an isolated UI mock.

## First acceptance = Adult Look 2 (`f-hana`)

| | |
|---|---|
| Jacket plate | `/stomper/adult/jacket/jacket-look2-mint@512.webp` |
| Pants plate | `/stomper/adult/pants/pants-look2-mint@512.webp` |
| Preview | `/stomper/adult/starter/f-hana/preview@512.webp` |
| Master QA | `masters/look2-f-hana-APPROVED.png` sha256 `b92ba262…` |

Pass = separate transparent plates layered in **real** selector + Locker on **physical Android** (full checklist in `LOOK2-MINT-ACCEPTANCE.md`).

## Runtime (wired — no invent)

`AvatarRenderer` probes plate URLs → `plates` mode; else `svg-fallback`. Docs masters never auto-mount. Jacket-set keeps jacket/pants as two itemIds. Backpack OFF by default. Look N of M naming; user STOMPER names preserved.

## Forbidden

Poster-crop · regenerate faces · Woz-named STOMPER · youth/payments/Pages/merge · claiming Look 2 pass without Android checklist.
