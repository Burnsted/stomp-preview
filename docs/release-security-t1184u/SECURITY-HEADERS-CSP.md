# SECURITY-HEADERS-CSP — readiness (t1187u Phase 2)

**STATUS:** Docs only. **Do NOT publish Pages. Do NOT change live hosting in this PR.**

Recommended headers for eventual static/hosting surface (GitHub Pages or future CDN).  
Preview middleware today focuses on PWA install injection — it is **not** a production CSP SoT.

---

## Recommended response headers (future host)

| Header | Suggested value (starting point) | Notes |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` | Tighten after measuring Vite/TanStack needs; avoid `'unsafe-eval'` in prod |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Only after HTTPS everywhere; N/A for plain `file:` / local preview |
| `X-Frame-Options` | `DENY` | Defense in depth with CSP `frame-ancestors` |
| `X-Content-Type-Options` | `nosniff` | |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Align with product: no payments; mic/camera only if owner Go for SESSION voice |
| `Cross-Origin-Opener-Policy` | `same-origin` | Review if OAuth popups required later |
| `Cross-Origin-Resource-Policy` | `same-origin` | |

---

## Explicit non-actions (this PR)

- No GitHub Pages workflow edits for security headers  
- No `peaceiris` / deploy job changes  
- No production CDN / Cloudflare rule flips  
- Optional comment-only notes may exist in preview config; **no deploy**

---

## Mapping to STOMP threats

| Concern | Header help |
|---|---|
| Clickjacking Campfire / share confirm | `X-Frame-Options` + CSP `frame-ancestors` |
| Accidental third-party script | CSP `script-src 'self'` |
| Payment / sensitive API misuse | `Permissions-Policy` payment=() until payments Go |
| Referrer leakage of invite tokens | `Referrer-Policy` |

---

## Owner Go required before activation

1. Hosting Go (Pages vs other)  
2. CSP report-only → enforce rollout plan  
3. Confirm PWA / service-worker / OG image hosts allowed in CSP  

**Verdict:** Checklist ready. **Not applied to live hosting.**
