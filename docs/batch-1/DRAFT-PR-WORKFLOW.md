# Repeatable draft-PR workflow (Woz)

1. Branch from verified tip: `702cf32` on `Burnsted/stomp-preview`  
   `git checkout -b woz/<feature>-YYYY-MM-DD`
2. Additive changes only — never rewrite `main` or Pages “latest GB”
3. Preserve Flutter web artifacts; put new work under `batch1/` + `docs/`
4. Run `cd batch1 && npm test && npm run typecheck`
5. Push branch; open **draft** PR → base `main`
6. NEVER merge / deploy / enable secrets without Owner Ted

## Handoffs that can auto-run without Owner

| Handoff | Auto? | Notes |
|---|---|---|
| Vitest + `tsc` on PR | Yes | `.github/workflows/pr-verify.yml` |
| Status report draft from template | Yes | Agent fills `STATUS-REPORT-TEMPLATE.md` |
| Local Unlink preview | Yes | Dev machine / cloud preview only |
| Merge to `main` | **No** | Ted only |
| GitHub Pages deploy / replace tip | **No** | Ted only |
| Pull GB `/workspace` or Origin Flutter | **No** | Needs Owner drop or auth |
| Enable deploy secrets | **No** | Forbidden in Batch 1 |
| Device compat claims (Cardo/Sena/Aleck) | **No** | Needs real device tests |

## PR checklist

- [ ] Draft (not ready)
- [ ] Scope listed (A–E or subset)
- [ ] Test commands + counts pasted
- [ ] Explicit: not GB app; Invite remains GB-owned
- [ ] No deploy job / no secrets
