# UPDATED-GB-HANDOFF — Precise technical asset handoff (t1173u)

**Audience:** Grok Build — produce modular transparent plates when artwork is ready.  
**Supersedes handoff emphasis in** `docs/character-roster-v24-t1171u/GB-HANDOFF-CONTRACT.md` **with the clarifications below.** Design remains CLOSED. Roster v2.4 LOCKED.

## 0. Critical distinction (READ FIRST)

| | Visual MASTER | Modular PLATE |
|---|---|---|
| What | Owner-approved full-res character render / sheet | Per-slot transparent WebP (`itemId@512`) |
| Looks 1–3 | **Delivered** under `docs/.../masters/` for reference/QA | **Still required separately** if layering/customization is needed |
| Looks 4–6 + Grom | **Not available** — do not invent | Do not produce until master approved (or explicit owner go-ahead) |
| Runtime | Not loaded as layers | Loaded by `buildPlateUrl` / `AvatarRenderer` |
| Forbidden | Cropping masters/posters → fake “layers” | Baking pants into jacket; earrings; non-STOMP boards |

**Masters ≠ modular plates.** Accepting a master does **not** unlock cropping it into production assets.

## 1. What we have now (handoff only these)

### A. Reference / QA masters (Looks 1–3) — ACCEPT as authority

| starterId | File (repo) | Notes |
|---|---|---|
| `m-samir` | `docs/character-production-t1173u/masters/look1-m-samir-APPROVED.png` | Tan/black sheet; subtle smile; turnaround + gear + carousel context |
| `f-hana` | `docs/character-production-t1173u/masters/look2-f-hana-APPROVED.png` | Brunette braid; mint/teal jacket + matching pants |
| `f-priya` | `docs/character-production-t1173u/masters/look3-f-priya-APPROVED.png` | Fuller blonde; purple/white + purple pants |

Use these for:

- Face / proportion / clothing colorway QA against any future modular plates  
- Optional export of **true** transparent layers **authored as separate masters** (not poster crops)

### B. Do NOT hand off assets we do not have

- Adult Looks 4 (`m-devon`), 5 (`f-nova`), 6 (`m-leo`) — **AWAITING_MASTER**  
- Grom Boy (`g-milo`), Grom Girl (`g-aria`) — **AWAITING_MASTER** + enrollment HELD  
- No substitute / regenerated faces  
- No composite-poster slices labeled as modular plates

## 2. Still required for runtime customization (Looks 1–3 when layering needed)

Separate modular transparent plates per `ASSET-LAYER-MANIFEST` / prior GB contract:

```
stomper/adult/starter/{starterId}/preview@512.webp
stomper/adult/{slot}/{itemId}@512.webp   (+ optional @1024 masters)
```

Independent layers: body/face · hair · jacket · pants/bibs · helmet/beanie · goggles/glasses · gloves · boots · snowboard · optional backpack.

Jacket + coordinated pants = **two files**. Backpack default OFF (`backpack-none`). Eyewear: `goggles-basic` and `glasses-meta-oakley`.

## 3. Loading (already wired — no redesign)

1. Probe plate URL → composite if present.  
2. Else SVG fallback (`data-render-mode="svg-fallback"`).  
3. Docs masters are never auto-mounted as plates.

## 4. Dimensions & quality (unchanged)

| | |
|---|---|
| Master plate | 1024×1024 alpha |
| Runtime plate | 512×512 alpha WebP |
| Pivot | Shared feet/head anchors |
| Jewelry | None |

## 5. Out of scope

Youth enrollment, payments, Pages/deploy, prod authz, regenerating approved Looks 1–3 faces, inventing Looks 4–6/Grom art without owner masters.

## 6. When remaining masters arrive

1. Owner drops APPROVED PNGs → copy to `docs/character-production-t1173u/masters/`.  
2. Flip slot status AWAITING_MASTER → APPROVED_MASTER in `slot-readiness.ts`.  
3. Only then produce matching modular plates for that look.
