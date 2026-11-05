# Resort trail map licensing — t1218u research (2026-11-05)

**Policy for this app:** Bundle or hotlink **only** when `permission === "embed-authorized"` with a written grant. If permission is denied or unclear, show an **official-map link card** — never invent a fictional trail diagram and never present SVG sketches as real resort maps.

**No paid map services** used.

## Catalog (app resorts)

| Resort | Operator | Official map page | Permission | Action in app |
|---|---|---|---|---|
| Beaver Creek | Vail Resorts | https://www.beavercreek.com/the-mountain/about-the-mountain/trail-map.aspx | **link-only** | Link card |
| Vail | Vail Resorts | https://www.vail.com/the-mountain/about-the-mountain/trail-maps.aspx | **link-only** | Link card |
| Keystone | Vail Resorts | https://www.keystoneresort.com/the-mountain/about-the-mountain/trail-maps.aspx | **link-only** | Link card |
| Park City | Vail Resorts | https://www.parkcitymountain.com/the-mountain/about-the-mountain/trail-maps.aspx | **link-only** | Link card |
| Stowe | Vail Resorts | https://www.stowe.com/the-mountain/about-the-mountain/trail-maps.aspx | **link-only** | Link card |
| Snowbird | Snowbird | https://www.snowbird.com/the-mountain/maps/ | **unclear** | Link card |
| Mammoth | Mammoth / Alterra | https://www.mammothmountain.com/on-the-mountain/trail-map | **unclear** | Link card |
| Palisades Tahoe | Alterra | https://www.palisadestahoe.com/mountain-information/trail-maps | **unclear** | Link card |
| Killington | Alterra | https://www.killington.com/the-mountain/trail-map | **unclear** | Link card |

## Findings

### Vail Resorts family (Beaver Creek, Vail, Keystone, Park City, Stowe)

- Epic Shop / Vail Resorts Terms of Use: Site content may be displayed/printed/downloaded as **one copy for personal noncommercial use**, and must **not** be copied, posted, distributed, or transmitted **on any other website** / network / media without authorization.
- Vail Resorts operates a commercial licensing program (IMG) covering resort names, logos, **trails and trail maps**, and imagery for merchandise — not a free embed grant for third-party apps.
- **Conclusion:** Embedding or hotlinking official trail-map images in STOMP is **not authorized** on publicly available terms. Use official page links + attribution only until written permission is obtained.

### Snowbird / Mammoth / Palisades Tahoe / Killington

- Official trail / interactive map pages exist.
- No clear public license granting third-party app embedding or hotlinking of map images was located in this research pass.
- **Conclusion:** Treat as **unclear** → official-map link card (same UX as link-only). Do not invent layouts.

### SkiMap.org / third-party archives

- Not used. User-submitted archive licenses do **not** transfer resort copyright for embedding official maps.

## Implementation pointers

- Catalog: `gb-phone/src/lib/stomp/resort-trail-maps.ts`
- Viewer / link card: `gb-phone/src/components/stomp/trail-map-viewer.tsx`
- Map tab: `gb-phone/src/components/stomp/trail-map-screen.tsx`
- Home secondary card: `gb-phone/src/components/stomp/home-map-card.tsx`

## How to flip a resort to embed

1. Obtain written embed/hotlink permission from the resort / rights holder.
2. Set `permission: "embed-authorized"` and `authorizedImageUrl` to a **bundled** asset under `gb-phone/public/` (prefer bundle over hotlink).
3. Keep attribution string and link to the official map page.
4. Re-run trail-map tests + capture fit/zoom screenshots.
