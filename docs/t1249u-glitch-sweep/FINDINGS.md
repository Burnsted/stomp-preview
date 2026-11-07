# t1249u — Glitch QA sweep findings

**Tip under test:** `3b44dd62ed55fe099e1c980d4e2eee3cf4a1b536` (t1246u)  
**Method:** headless Playwright @ **360 / 390 / 430**, every chrome screen + Spot/Stash/Sesh simplify flows (`gb-phone/scripts/t1249u-glitch-sweep.mjs`).  
**Constraint:** no redesign — glitch fixes only; preserve t1238u / t1243u / t1246u behavior + tests.  
**No merge · no deploy.**

Before screenshots: `docs/t1249u-glitch-sweep/before/`  
After screenshots: `docs/t1249u-glitch-sweep/after/`

---

## Confirmed glitches (fix)

| ID | Screen | Widths | Kind | Repro | Before shot |
| --- | --- | --- | --- | --- | --- |
| **G-A** | Trails · Spot detail | 360/390/430 | Tiny / low-contrast hit target | Open Spot (Little Launcher). **Close** is ~29×16px and faint on the dark hero. | `before/spot-detail-390.png` |
| **G-B** | Trails · Spot info sheet | 360/390/430 | Clipped / unreachable keeper actions | Open Spot → tap **i**. Transfer Keeper / Archive sit below the visible sheet fold (and under FAB chrome); easy to miss without knowing to scroll. | `before/spot-info-sheet-390.png` |
| **G-C** | Home (greet) · Squad | 360/390/430 | FAB caption collision | Seed stomper → Home. **HEY SESH** caption overlays Squad row meta (“Preview · N riders”). | `before/screen-greet-360.png` |
| **G-D** | Hub / boards list | any | Console error — duplicate React key | Navigate Hub (or any path that mounts profile boards). Console: duplicate key **`board-powder`** (`DEFAULT_OWNED` lists FAMILY board + catalog id twice; `ownedIds.map` keys collide). | `before/screen-hub-390.png` |

Raw detector dump: `sweep-raw.json` (G01–G23 include width repeats of the above).

---

## Detector noise / left intentional (not fixed)

| Item | Why left open |
| --- | --- |
| Bag of Tricks horizontal cards past viewport | Intentional `overflow-x-auto` carousels |
| Stompers “Campfire” tab chip past 360 edge | Intentional tab `overflow-x-auto` |
| `home-today-lineup` “overflow” | `sr-only` legacy hook (off-screen by design) |

---

## Fix plan (small commits)

1. Spot detail Close — larger hit target + clearer contrast (`data-testid="spot-detail-close"`).
2. Spot info sheet — scroll body + sticky keeper/archive footer with FAB-safe padding.
3. Home squad rows — right padding so meta clears Hey Sesh FAB/caption.
4. Dedupe `board-powder` in boards collection owned list (+ hub list uses unique ids).

Regression tests: `gb-phone/tests/woz/spot-stash-t1249u.test.tsx` (+ boards key assert).
