# Batch 1 automated handoffs

## CI (draft recommendation — added)

Workflow: `.github/workflows/pr-verify.yml`

- Triggers: pull_request
- Jobs: `npm ci` → `npm run typecheck` → `npm test` in `batch1/`
- **No** secrets, **no** deploy, **no** Pages publish

## Status reporting

Use `docs/batch-1/STATUS-REPORT-TEMPLATE.md` for Owner-facing updates.  
Test paste rules: `docs/batch-1/TEST-OUTPUT-CONVENTIONS.md`.

## Agent → Owner triggers (require Ted)

1. Drop GB `/workspace` ZIP (or authorize a GB-source repo) so Invite/`greet.tsx` can merge  
2. Authorize Origin Flutter source access for Feature parity / `flutter test`  
3. Approve merge or Pages redeploy (never auto)

## Agent-only loop (no Owner)

- Extend Unlink/STOMPERS/SESSION registry behind draft PRs  
- Keep Master HQ docs preserved  
- Re-run Vitest; refresh draft PR description
