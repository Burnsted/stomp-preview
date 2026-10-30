# Path 1 isolated integrate

- **Date:** 2026-10-29 ET
- **Base:** `gb/phone-source-2026-10-29` (GB drop tip)
- **Woz modules:** from PR #3 tip `8c700e7` (`batch1/`, `docs/`, pr-verify workflow)
- **Invite:** `gb-phone/src/components/stomp/greet.tsx` — **unmodified**; GB owns
- **Frozen:** PR #1 `820d73d`, PR #2 `480431e`, PR #3 `8c700e7`
- **Hard stops:** draft only · no merge/deploy · no live auth/location/NFC claims

## Batch 2 — 2026-10-29 (blockers cleared)
- **GB stock `npm test` (8 fails)**: pre-existing, NOT Woz-caused. `scripts/grok-pwa-plugin.test.mjs` is a template test that assumes an unbranded cwd; the GB STOMP drop ships `src/lib/og/site.json` (title "STOMP", card custom) + `public/og.jpg`, so og:title/apple title resolved to "STOMP". Failing since 473a075 (GB drop, before any Woz commit). Fix: test file chdirs to a neutral temp dir (repo-file checks still use TEMPLATE_ROOT). No product code changed. Now 197+59 pass, 0 fail.
- **Full `npm run build` incl. `db:migrate`**: exits 0. Without `DATABASE_URL`, `migrate.mjs` self-skips by design (PGLite fallback migrates itself at runtime); no live DB used (live integrations stay off).
- **Invite accept/revoke → Crew Tools mirror**: `woz-bridge/invite-mirror.ts` (pure diff + subscribe) + `invite-mirror-gb.ts` (wires to `useStomp`, read-only). Started in `app.tsx` after GB persist rehydrate; persisted baseline replays changes made while Crew Tools was closed. Re-accepting a Woz-unlinked Stomper re-links them. greet.tsx untouched (sha256 0811babf…996fc2).
- **Polish**: Home "Crew tools" chip; Invite activity card; dismissible error banner; storage quota/private-mode errors surfaced via `onStorageError`.
- **CI**: `gb-phone-woz-verify` job (typecheck, typecheck:woz, test:woz, npm test, build) is staged as `docs/integrate/pr-verify-gb-phone-job.patch` — push token lacks GitHub `workflow` scope, so apply with `git apply` from an account that has it.
