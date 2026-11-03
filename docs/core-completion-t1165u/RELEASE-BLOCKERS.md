# RELEASE-BLOCKERS — t1165u core completion

**Branch:** `cursor/release-blocker-closure-t1159u` · DRAFT / DO NOT MERGE  
**Supersedes transfer-wait rows from t1159u/t1163u where noted.**

---

## Closed on this throwaway tip

| Item | Notes |
|---|---|
| CONFLICT-1/2 (multi-Squad / recheck) | Closed fictionally (SV-0 + AF-XINT) |
| GB Rider source transfer | Verified t1163u; selective fold landed |
| Fictional integration candidate glue | AF-JOURNEY + cf2-share + riderHubBridge (t1165u) |
| Fictional server-authz design | `fictionalAuthz` + AF-AUTH-01..12 |
| Protected tip CI #12–#16 | Both jobs SUCCESS (reconfirmed) |

---

## Still blocking release

| Category | Item | Severity | Owner? |
|---|---|---|---|
| Security | **Server authz production** (Pass/Viewer/Squad/share) | Critical | **Yes** — packet ready, NOT activated |
| Security | Real identity / age / guardian consent | Critical | Yes |
| Security | Storage/CDN deletion + token session | Critical | Yes — HELD |
| Security | Youth Campfire | High | Yes — HELD |
| Security | Live moderation / legal hold | High | Yes |
| Product | Merge-order Go #12→#13→rebase #14/#16 | High | **Yes** |
| Product | Wire A1–A6 + CF-2 into GB shell beyond throwaway | High | Yes — paste HELD |
| Product | G1 Day Sesh media deadline | Medium | OPEN |
| Product | G2–G4 / F1–F5 | Medium | HELD |
| Product | Home / five-tab / Crew Invite freeze | High | Hold — preserved |
| Deploy | Pages / prod / payments | Blocker | **Do not** |

---

## Can proceed now (no merge)

1. Iterate AF-AUTH / AF-JOURNEY / AF-RC on throwaway  
2. Docs-only merge plan / authz packet updates  
3. Keep CI green on #17  

## Needs owner approval

1. Any merge of #12–#17  
2. Pages / deploy / production  
3. Activate production server authz  
4. Youth / payments / deletion jobs  
5. Treat client Rider/Viewer as security (must not)  
6. Legal G4 erasure  

---

## Smallest RC path (STATE — do not merge)

See `MERGE-PLAN.md` §5. Headline: merge-order → adapters → selective #17 fold → **server authz** → acceptance.

## Owner approvals only (grouped)

**Merge / lineage:** Merge-order Go · Accept #17 selective fold into release lineage  
**Security:** Production authz Go · Identity provider Go  
**Policy HELD:** Youth · payments · deletion · G1–G4 · F1–F5 · legal G4  
**Deploy:** Explicit Pages/prod Go (if ever)  
