# STOMP Batch 1/2 (Woz local package)

Isolated TypeScript work on tip `702cf32` (Flutter **web static** preview).  
**Not** the Grok Build app. **Not** a Pages replacement.

| Area | Location |
|---|---|
| STOMPERS models + fixtures | `src/stompers/` |
| Crew Unlink + owner transfer | `src/crew/` + `preview/unlink.html` |
| Crew Invite stub (GB-owned) | `src/crew/invite-stub.ts` |
| SESSION registry + Settings stub | `src/session/` + `preview/session-settings.html` |
| Campfire / QR·NFC (types+fixtures) | `src/campfire/` · `src/identity/` |
| Tests | `tests/` |

```bash
npm ci
npm run typecheck
npm test
npm run preview:unlink
npm run preview:session
```
