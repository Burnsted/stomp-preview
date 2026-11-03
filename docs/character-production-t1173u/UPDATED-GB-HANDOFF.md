# UPDATED-GB-HANDOFF — Precise technical asset handoff (t1173u / t1174u)

**Audience:** Grok Build — produce modular transparent plates when artwork is ready.  
**Design:** CLOSED. Roster v2.4 LOCKED. Masters ≠ modular plates.

## 0. Critical distinction

| | Visual MASTER | Modular PLATE |
|---|---|---|
| What | Owner-approved full-res render | Per-slot transparent WebP |
| Looks 1–3 | **On disk** under `docs/.../masters/` | Still required separately for layering |
| Looks 4–5 | Owner-approved; **PNG not on disk** | Do not invent; wait for masters |
| Look 6 | **OWNER LOCKED** prose; **PNG PENDING RE-ATTACH** | Do not invent `look6-m-leo-APPROVED.png` |
| Grom | Pending production approval | No handoff yet |
| Forbidden | Cropping masters/posters → fake layers | Baking pants into jacket; earrings; Woz character |

## 1. What we have now

### A. Reference / QA masters (Looks 1–3 only)

| starterId | File |
|---|---|
| `m-samir` | `masters/look1-m-samir-APPROVED.png` |
| `f-hana` | `masters/look2-f-hana-APPROVED.png` |
| `f-priya` | `masters/look3-f-priya-APPROVED.png` |

### B. Look 6 lock (no file yet)

- Starter: `m-leo` — status **OWNER_LOCKED + AWAITING_MASTER_FILE**
- Spec: young Japanese male; white jacket black/orange accents; white-and-black pants; **goggles on head ONLY** (no Meta Oakley Vanguard / `glasses-meta-oakley`)
- When Ted re-attaches: `masters/look6-m-leo-APPROVED.png` → then APPROVED_MASTER

### C. Do NOT hand off

- Invented Look 4/5/6 master PNGs  
- Any Woz-named STOMPER character / preset name  
- Grom assets before owner production approval  
- Poster-crop “layers”

## 2. Modular plates (when masters exist)

Same contract as before: `stomper/{band}/{slot}/{itemId}@512.webp` + starter previews. Jacket + pants separate. Backpack OFF by default. Look 6 eyewear = `goggles-basic` only.

## 3. Loading (wired)

Plate probe → composite; else SVG fallback. Docs masters never auto-mount as plates.

## 4. Out of scope

Youth enrollment, payments, Pages/deploy, prod authz, regenerating Looks 1–3, inventing missing masters.
