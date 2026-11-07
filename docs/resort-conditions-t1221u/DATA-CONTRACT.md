# t1221u — Resort conditions data contract

**Branch:** `cursor/resort-conditions-t1221u-94bf`  
**NO MERGE · NO live keys · NO paid API calls in this pass**

## Shared selection

| Surface | Source of truth |
| --- | --- |
| **Home** | Shows selected resort **name only** — **no** weather / conditions UI (t1222u) |
| **Trails (Map tab)** conditions strip + trail map | `useHomeMountain.resortId` → `useResortConditions` |
| Trip Drop | `trip.resortId` (optional); on **join**, syncs into Home mountain via `syncSelectedResortId` (ID only — no Home weather) |

Canonical selected ID helper: `getSelectedResortId()`.

When no valid selected resort → Trails shows quiet empty (“Select a resort for weather and snow”) — not a Home hero widget.

## Typed model (`ResortConditions`)

```ts
provenance: "fiction" | "live"
fetchState: "idle" | "loading" | "ready" | "stale" | "unavailable" | "offline"
weather: { elevationFt, temp, tempUnit, windSpeed, windUnit, windGust, summary, forecast } | null
snow: { snowfall24h, snowfall48h, baseDepth, depthUnit, surface } | null
liftsTrails: { liftsOpen, liftsTotal, trailsOpen, trailsTotal, operatingStatus } | null
trailMap: { permission, officialMapPageUrl, attribution } | null
sources: { id, label, url }[]
updatedAtIso, staleAfterIso, honestyNote
```

Null fields mean **unavailable** — never invent numbers for missing series.

## States

| State | Meaning | UI |
| --- | --- | --- |
| `loading` | Fetch / fixture load in progress | LOADING badge; summary only |
| `ready` | Fresh payload within TTL | FICTION · SAMPLE or LIVE (live gated) |
| `stale` | Past `CONDITIONS_CACHE_TTL_MS` (15 min) | STALE (+ FICTION prefix when fiction) |
| `unavailable` | No fixture / provider miss | UNAVAILABLE; honesty note |
| `offline` | No network / forced offline rehearsal | OFFLINE |
| `idle` | Store not yet hydrated | Transient |

Cache: in-memory via zustand; refresh on resort change; skip reload if same resort + ready + within TTL.

## Fiction vs LIVE labeling rules

1. **Fiction adapter always sets `provenance: "fiction"`.**
2. Badge for fiction ready = **`FICTION · SAMPLE`** — never contains the word LIVE.
3. `isLiveLabeled()` returns true only when `provenance === "live"` AND fetch is `ready` or `stale`.
4. `LIVE_CONDITIONS_ENABLED = false` — live path gated; no network / no keys.
5. `assertHonestLabel()` fails tests if fiction ever badges LIVE.
6. Honesty note is required on every fiction payload.

## Trail maps

Reuse `#57` / t1218u catalog (`resort-trail-maps.ts`):

- Vail Resorts portfolio → **link-only** (ToU blocks embed without written permission)
- Others → **unclear** → same link-card UX
- Conditions panel links `officialMapPageUrl`; does not invent embed rights

## Code map

| Module | Role |
| --- | --- |
| `gb-phone/src/lib/stomp/resort-conditions/types.ts` | Contract + TTL + live gate flag |
| `labels.ts` | Badge / honesty helpers |
| `fiction-fixtures.ts` | ≥2 resorts (Vail, Beaver Creek, Park City) |
| `fiction-adapter.ts` | Fiction load + forced states |
| `live-gate.ts` | LIVE path OFF |
| `store.ts` | Shared selection + cache |
| `resort-conditions-panel.tsx` | Trails (Map) strip UI only — not Home (t1222u) |
