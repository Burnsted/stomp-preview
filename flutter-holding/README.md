# Flutter holding page (preserved)

The previous GitHub Pages tip was a **static Flutter web build** served from the
repository root (`index.html`, `main.dart.js`, `assets/`, `canvaskit/`, …).

On Ted’s authorization (2026-10-30) the **live** preview URL
https://burnsted.github.io/stomp-preview/ was switched to the **Vite gb-phone**
app (Crew Tools + locked Invite/`greet.tsx`).

These Flutter artifacts were moved here intact so they remain in git history and
can be restored if needed. They are **not** what Pages serves anymore.

Rebuild/publish for the live site: `.github/workflows/deploy-pages.yml` →
`gb-phone` `npm run build:pages`.
