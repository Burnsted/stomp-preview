# SECRETS-DEPENDENCY-HYGIENE — checklist (t1187u Phase 2)

**STATUS:** Docs + observed `npm audit` summary. **No dependency upgrades** in this PR unless trivial/safe (none applied).

---

## A. Secrets / env hygiene checklist

| Check | Status | Notes |
|---|---|---|
| No production secrets committed | **PASS (spot-check)** | Preview repo; no `.env` files present in tree |
| `.env` / `.env.*` ignored | **PASS (t1187u)** | Added to `gb-phone/.gitignore` this Phase 2 tip |
| CI uses no secret-bearing deploy in `pr-verify` | **PASS** | `pr-verify.yml` — typecheck/test/build only; no Pages publish |
| Better Auth / DATABASE_URL optional locally | **PASS** | migrate self-skips without `DATABASE_URL` (PGLite) |
| Client demo flags ≠ credentials | **PASS** | Rider Hub / fictionalAuthz banner |
| No live payment / youth keys | **PASS** | Features HELD |

**Do not** paste real tokens into docs or audit trails.

---

## B. `npm audit --omit=dev` results (ran t1187u)

### batch1 (`stomp-batch1-local`)

```
found 0 vulnerabilities
```

### gb-phone (`app-builder-workspace`)

Observed summary (do not invent CVEs beyond this report):

| Advisory / package | Severity (npm) | Notes |
|---|---|---|
| `@better-auth/drizzle-adapter` / `better-auth` / `@better-auth/kysely-adapter` (GHSA-44jh-23m7-hpcf) | low (reported) | Concurrent PG rate-limit issue; **Better Auth not activated as prod SoT** on this tip |
| `seroval` (GHSA-f86p-h4j2-7qgj, GHSA-9wx9-5pv9-3349) | moderate | Via framework stack; `npm audit fix` available |
| `zod` (GHSA-mrhx-c7xc-m3w5) | high | Memory exhaustion on oversized collections; `npm audit fix` available |

npm rollup line: **5 vulnerabilities (2 low, 1 moderate, 1 high, 1 critical)** as reported by CLI.

**Action this PR:** Document only — **no** `npm audit fix --force` (would pull `better-auth@1.7.16` outside stated range). Ted-gated dependency bump lane separate from readiness.

---

## C. Recommended follow-ups (Ted-gated)

1. Schedule controlled `better-auth` / `zod` / `seroval` bumps on a throwaway branch with full CI  
2. Add secret scanning in CI when moving off public preview  
3. Confirm no `.env` files in future artwork/agent drops  

**Verdict:** Hygiene checklist complete; audit findings recorded honestly; no live secret activation.
