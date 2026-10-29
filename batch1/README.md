# STOMP Batch 1 (Woz local package)

Isolated TypeScript work on tip `702cf32` (Flutter **web static** preview).  
**Not** the Grok Build app. **Not** a Pages replacement.

| Area | Location |
|---|---|
| STOMPERS models + fixtures | `src/stompers/` |
| Crew Unlink (local) | `src/crew/unlink.ts` + `preview/` |
| Crew Invite stub (GB-owned) | `src/crew/invite-stub.ts` |
| SESSION registry | `src/session/` |
| Tests | `tests/` |

```bash
npm ci
npm run typecheck
npm test
npm run preview:unlink   # local UI only
```
