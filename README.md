# STOMP friend preview

**Live:** https://burnsted.github.io/stomp-preview/

Serves the **Vite gb-phone** app (Crew Tools + GB Invite). Demo Day labels stay; no live auth / NFC / GPS / wake.

| Path | Role |
| --- | --- |
| `gb-phone/` | Phone app source (TanStack Start / Vite) |
| `batch1/` | Woz Crew Tools modules |
| `flutter-holding/` | Previous Flutter Pages tip (preserved, not live) |
| `.github/workflows/deploy-pages.yml` | Build + publish Pages |

Invite/`greet.tsx` is locked — see `docs/integrate/GITHUB-PAGES-DEPLOY.md`.
