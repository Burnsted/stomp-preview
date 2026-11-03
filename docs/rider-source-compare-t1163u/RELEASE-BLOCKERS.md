# RELEASE-BLOCKERS — t1163u / t1164u (Rider source fold)

**Branch:** `cursor/release-blocker-closure-t1159u` · DRAFT / DO NOT MERGE  
**Supersedes status of:** GB Rider transfer row from `docs/release-blocker-closure-t1159u/RELEASE-BLOCKERS.md`

---

## Status changes this throw

| Item | Prior (t1159u/t1160u) | Now (t1163u/t1164u) |
|---|---|---|
| GB Rider Hub / social.* source | High — blocked (unverified) | **CLOSED for transfer** — ZIP verified + selective fold landed on throwaway tip |
| Wire A1–A6 into GB shell | Owner | Still **Owner** — contract map HELD paste |
| Client Rider/Viewer as security | Critical if treated as prod | Unchanged — **DEMO ONLY**; server authz required |
| SV-0 | Complete on #16 | Unchanged — no reopen; no regression found from Rider fold |
| Merge-order Go | Owner | Unchanged — STATE only |
| Youth / payments / deletion / G1–G4 / F1–F5 | HELD | Unchanged HELD |
| PREVIEW-BRANDING-SYNC / og.jpg | Branding lane | Unchanged — not touched |

---

## Table (delta-focused)

| Category | Item | Severity | Proceed now? | Notes |
|---|---|---|---|---|
| Missing integrations | GB Rider source transfer | — | **Closed** | sha256 `d8984922…afe4`; 13 files; selective cherry-pick on this tip |
| Missing integrations | Rider Hub ↔ batch1 CF-2/SV-0 wire | High | **Owner** | Client demo social ≠ server; paste still HELD |
| Security/privacy | Server authz Pass/Viewer/Squad/share | **Critical** | **Owner** | Client checks demo-only |
| Security/privacy | Real identity / age / guardian | Critical | **Owner** | OPEN |
| Security/privacy | Storage/CDN deletion + youth Campfire | Critical/High | **Owner** | HELD |
| Product-policy | Merge order #12→#13→rebase #14/#16 | High | **Owner** | Do not merge this PR |
| Product-policy | Home / five-tab / Crew Invite freeze | High | Hold | Preserved this fold (evidence in REPORT) |
| CI | Protected #12–#16 tips | None | — | Byte-identical reconfirmed |
| Deploy | Pages / prod / payments | Blocker | **Owner — do not** | Hard ban |

---

## Can proceed immediately (no merge)

1. Iterate Rider Hub demo + social.test on throwaway tips  
2. Keep AF-RC / AF-XINT green on fictional lane  
3. Docs-only contract-map updates (HELD paste)

## Needs owner approval

1. Any merge of #12–#17  
2. Pages / deploy / production  
3. Youth / payments / deletion jobs  
4. Treat client Rider/Viewer as production security  
5. GB paste of contract methods into live shell beyond this selective fold  
6. Change Home/nav/Crew Invite / og.jpg branding

---

## Smallest safe path to RC (STATE — do not merge)

1. Merge **#12** → `main`  
2. Land **#13** (retarget)  
3. Rebase **#14** then **#16** (SV-0)  
4. Land A1–A6 (+ A5 SV-0 deny) from rehearsal lineage  
5. ~~Transfer GB Rider~~ → **done (verified)**; keep compare-don’t-rebuild discipline for residual GB deltas  
6. Implement **server** authz for asserted paths  
7. Integration acceptance beyond fictional + phone-demo matrix  

## Owner approvals only

1. Merge-order Go  
2. ~~GB Rider source transfer acceptance~~ → **source verified; fold on throwaway only** (owner still owns merge acceptance)  
3. Explicit deploy/Pages Go (if ever)  
4. Youth / payments / deletion-job Go (if ever)  
5. Legal counsel G4 erasure  
