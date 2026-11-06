# t1221u — Provider readiness matrix (docs only)

**Research date:** 2026-11-05  
**Scope:** Weather · snow reports · lifts/trails · trail maps for Vail Resorts portfolio + resorts already in STOMP demo catalog.  
**Hard rules this pass:** no paid API keys, no live calls, no scraping of prohibited sources, no inventing embed rights.

App resorts: Beaver Creek, Vail, Keystone, Park City, Stowe (Vail Resorts); Snowbird; Mammoth, Palisades Tahoe, Killington (Alterra / independent).

---

## Matrix

| Provider | Weather (mtn elev) | Snow 24/48h + base + surface | Lifts / trails | Trail maps | Licensing / ToS | Cost (rough) | Coverage vs app resorts | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **NOAA / NWS API** (`api.weather.gov`) | Yes — point + hourly forecast (US) | No official resort snow report | No | No | US gov public domain; User-Agent required; do not imply NWS endorsement | **Free** | All US app resorts by lat/lon | **Stage 1 weather** — activate first after owner OK; attribution “Data source: NOAA/NWS” |
| **OpenWeather One Call 3.0** | Yes — current + 48h hourly + 8-day | Model snow fields only — **not** official resort report | No | No | Pay-as-you-call Open License (CC BY-SA style attribution) **or** commercial fixed plan | First **1,000 calls/day free**, then ~**$0.0015 / call** | Global lat/lon — all resorts | Optional weather backup if NWS grid is too coarse at summit |
| **Visual Crossing Timeline** | Yes — current + forecast | `snow` / `snowdepth` modeled fields; availability varies | No | No | Commercial OK on free tier; **attribution required** below Corporate | Free **1,000 records/day**; Pro / metered paid | Global | Low-cost weather + depth **supplement**; still not official resort snow |
| **OpenSnow API** | Yes — mountain elevation forecasts | Yes — resort `snow-report` (24/48h, base, surface, status) | Yes — lifts/runs open + totals | Overlay tiles (separate) | Partnership-only; no raw redistribution; required “Powered by OpenSnow” attribution | **Custom quote** (contact hello@opensnow.com) | Strong NA ski coverage; used by Ikon / many resorts — verify Vail Epic slugs in partnership | **Stage 2 snow + ops** — best single commercial fit; owner must approve quote + key |
| **Snoflo** | Aggregated display site | Aggregates resort + NOHRSC + SNOTEL | Partial (via resorts) | No app embed | No public developer API documented; site is consumer | N/A (no API) | US ski areas | **Do not scrape**; monitor only as research UI |
| **Resort official sites / Epic apps** | Often | Official snow & ops | Official | Official maps | **Vail ToU:** no posting/transmitting Site content on other sites without written permission; personal download ≠ embed | Licensing via resort / IMG | Exact for each property | **Link-only** for maps + deep-link for “official report”; do not scrape HTML |
| **SkiMap.org / fan archives** | No | No | No | Historical map art | User licenses ≠ resort copyright | Free / mixed | Incomplete | **Do not use** for official trail maps |

---

## Provider notes (verified URLs)

### NOAA / NWS
- Docs: https://www.weather.gov/documentation/services-web-API  
- Flow: `GET /points/{lat},{lon}` → forecast / forecastHourly / observationStations  
- Auth: descriptive `User-Agent` (app + contact); no key  
- Rate: unpublished generous limit; cache aggressively  
- Good for: temp, wind, forecast text at mountain coordinates  
- Gap: not an official ski-resort snow desk

### OpenWeather One Call 3.0
- Docs: https://openweathermap.org/api/one-call-3  
- Pricing: https://openweathermap.org/price  
- Good for: polished current + forecast UX worldwide  
- Gap: mountain snowpack / lift status not official

### Visual Crossing
- Pricing: https://www.visualcrossing.com/weather-data-pricing/  
- Snow fields guide: https://www.visualcrossing.com/resources/documentation/weather-data/how-to-find-accurate-snow-weather-data/  
- Good for: cheap commercial weather + snowdepth experiments  
- Gap: not lift/trail ops; depth not “official report”

### OpenSnow
- Partner start: https://opensnow.com/api/start  
- Snow report: https://opensnow.com/api/routes/snow-report_:id_or_slug__GET.html  
- API ToS: https://support.opensnow.com/api/api-terms  
- Returns: precip_snow_24h/48h, base_depth, conditions, lifts_open/total, runs_open/total, operating status  
- Attribution object returned per response — UI must show “Powered by OpenSnow”  
- Gap: partnership gate + custom cost; confirm Epic / Vail slug coverage in contract

### Trail maps (from t1218u / #57)
- Catalog: `gb-phone/src/lib/stomp/resort-trail-maps.ts`  
- Vail Resorts family → **link-only** until written embed grant  
- Snowbird / Mammoth / Palisades / Killington → **unclear** → link card  
- Full write-up: `docs/restore-approved-ui-t1218u/RESORT-TRAIL-MAP-LICENSING.md`

---

## Staged activation path (recommend Ted approve each gate)

### Stage 0 — **this PR (done)**
Fiction adapter + UI + shared `selectedResortId` + honesty labels. LIVE gated off.

### Stage 1 — Weather only (low cost / free)
1. Owner approves NWS (free) as weather source.  
2. Add lat/lon + elevation metadata per `DEMO_RESORTS` id.  
3. Server or edge proxy with caching (TTL ≥ 10–15 min); never ship raw keys in the SPA if a paid backup is added later.  
4. Label ready weather **LIVE** only when NWS responds; snow/lifts stay unavailable or fiction-hidden.  
5. Optional: Visual Crossing free tier as fallback with attribution.

### Stage 2 — Official snow + lifts
1. Owner solicits OpenSnow partnership quote for STOMP demo + future production hosts.  
2. Verify slugs for all nine demo resorts (esp. Vail Epic properties).  
3. Wire `snow-report` adapter → same `ResortConditions` contract; provenance=`live`.  
4. Keep map **link-only** unless written embed permission lands.

### Stage 3 — Trail map embeds (optional, separate legal)
Written permission per resort → flip `permission: "embed-authorized"` + bundle image. No scraping.

### Explicit non-goals until authorized
- Scraping beavercreek.com / vail.com / Epic HTML or JSON  
- Labeling fiction fixtures LIVE  
- Pages / playtest redeploy with live keys  
- Paid OpenWeather / OpenSnow keys in repo secrets without owner ticket

---

## Recommended next ask for Ted

> Approve **Stage 1**: NWS weather adapter behind `LIVE_CONDITIONS_ENABLED` for the nine demo resorts (lat/lon table), still no OpenSnow spend, still link-only maps. Separate ticket for OpenSnow quote if snow/lifts are required for the next playtest.
