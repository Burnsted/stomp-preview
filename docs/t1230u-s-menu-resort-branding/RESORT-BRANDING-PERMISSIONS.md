# t1230u — Resort branding asset sources & permission status

**Policy:** Prefer official, authorized brand assets already in the repo (or with a written grant). Do **not** scrape trademarked logos from the public web. Do **not** invent or approximate trademarked artwork. Missing asset → **text / wordmark fallback** (expected and correct). Identification only — never claim affiliation or commercial endorsement.

Trail maps remain **link-only** (see `docs/restore-approved-ui-t1218u/RESORT-TRAIL-MAP-LICENSING.md`). Conditions stay Trails-only, **FICTION · SAMPLE**, never LIVE.

## Mapping module

- `gb-phone/src/lib/stomp/resort-branding.ts` — resort-ID → branding row
- `gb-phone/src/components/stomp/resort-brand-mark.tsx` — Trails UI (logo or text)
- Surfaces: Trails / Maps (`trail-map-screen.tsx`)

## Permission table

| Resort | Authorized asset in repo? | Mode | Source / notes |
| --- | --- | --- | --- |
| Beaver Creek | **No** | text-fallback | Vail Resorts marks require written license (IMG / brand desk). No in-repo grant. |
| Vail | **No** | text-fallback | Same — no authorized logo bundled. |
| Breckenridge | **No** | text-fallback | Catalog row added t1230u for Trails coverage; no logo grant. Trail map link-only. |
| Keystone | **No** | text-fallback | Same Vail Resorts family — text only until grant. |
| Park City | **No** | text-fallback | Text only. |
| Stowe | **No** | text-fallback | Text only. |
| Snowbird | **No** | text-fallback | Text only. |
| Mammoth | **No** | text-fallback | Text only. |
| Palisades Tahoe | **No** | text-fallback | Text only. |
| Killington | **No** | text-fallback | Text only. |

## How to flip a resort to authorized logo

1. Obtain written logo / wordmark permission from the resort / rights holder (or use an asset the owner already authorized into this repo).
2. Bundle under `gb-phone/public/stomp/resort-brands/` (prefer light + dark variants; preserve proportions and clear space).
3. Set `mode: "authorized-asset"`, `permission: "authorized"`, and `assetLightUrl` / `assetDarkUrl` in `resort-branding.ts`.
4. Keep resort **name** readable beside or under the mark; never add “partner” / “sponsored” copy.
5. Re-run `tests/woz/s-menu-resort-branding-t1230u.test.tsx` + Trails screenshots.

## Blockers (branding)

- **No authorized resort logos ship in this PR** — all resorts correctly use text fallback.
- Owner must supply licensed assets (or written embed grant) before any logo appears in UI.
