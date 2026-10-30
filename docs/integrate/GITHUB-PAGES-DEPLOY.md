# GitHub Pages → gb-phone (Vite + Crew Tools)

**Authorized by:** Owner Ted (deploy Vite gb-phone / Crew Tools to Pages)  
**Live URL:** https://burnsted.github.io/stomp-preview/  
**Invite lock:** `gb-phone/src/components/stomp/greet.tsx` sha256  
`0811babf8c7139a86738e2bd677db8544f09672b83a8fad345075f8bfb996fc2` — do not edit.

## What changed

| Before | After |
| --- | --- |
| Legacy Pages from `main` `/` Flutter holding page | Vite **gb-phone** SPA with base `/stomp-preview/` |
| Root `index.html` + `main.dart.js` + CanvasKit | Flutter tree preserved under `flutter-holding/` |
| No Pages workflow | `.github/workflows/deploy-pages.yml` |

## Build

```bash
cd gb-phone
npm ci
npm run build:pages   # sets GITHUB_PAGES=1, base=/stomp-preview/, SPA shell
# stages ../site-pages/ (index.html, 404.html, assets/, .nojekyll, …)
```

Default `npm run build` is unchanged (Vercel/Nitro SSR for the GB platform).

## Deploy workflow

1. **Actions Pages** (`actions/upload-pages-artifact` + `actions/deploy-pages`) — durable target. The job best-effort flips `build_type=workflow` if the token allows.
2. **Legacy main root sync** — rsync of `site-pages/` into repo root + bot commit `[skip ci]` (only `index.html` / `404.html` / `assets/` / `stomp/` / `__grok/` / …). Does **not** use peaceiris main→main (prohibited). Leaves `gb-phone/`, `docs/`, `batch1/`, `flutter-holding/` alone.

Current Pages setting remains **legacy** `main` `/` unless Settings → Pages is switched to **GitHub Actions**.

Demo constraints unchanged: no live auth / NFC / GPS / wake; demo labels stay; no Invite UX inventing.

## Hard-refresh

- Desktop: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
- Mobile Safari: open the URL, then pull-to-refresh after clearing website data if an old Flutter SW is sticky (`flutter_service_worker.js` lived on the old tip)
