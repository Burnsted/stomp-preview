# RELEASE-BLOCKERS — t1165u + t1166u (G1–G4)

**Branch:** `cursor/release-blocker-closure-t1159u` · DRAFT / DO NOT MERGE  
**Supersedes transfer-wait rows from t1159u/t1163u where noted.**  
**t1166u:** Ted LOCKED G1–G4 Nov 2, 2026 — fictional + docs + tests only on #17.

---

## Closed on this throwaway tip

| Item | Notes |
|---|---|
| CONFLICT-1/2 (multi-Squad / recheck) | Closed fictionally (SV-0 + AF-XINT) |
| GB Rider source transfer | Verified t1163u; selective fold landed |
| Fictional integration candidate glue | AF-JOURNEY + cf2-share + riderHubBridge (t1165u) |
| Fictional server-authz design | `fictionalAuthz` + AF-AUTH-01..12 |
| **G1–G4 product policy (fictional)** | LOCKED t1166u — AF-G14 + `lifecycle-g1g4` |
| Protected tip CI #12–#16 | Both jobs SUCCESS (reconfirmed) |
| Campfire CF-3 client shell (t1190u) | **PREVIEW_WIRED** on throwaway PR #24 — fictional only |
| Campfire depth (t1193u) | Soft-cap invite / SV-0 TTL / G2–G4 UX / DS clock on throwaway — **not** merge Go |

---

## Still blocking release

| Category | Item | Severity | Owner? |
|---|---|---|---|
| Security | **Server authz production** (Pass/Viewer/Squad/share) | Critical | **Yes** — packet ready, NOT activated |
| Security | Real identity / age / guardian consent | Critical | Yes |
| Security | Storage/CDN deletion + token session | Critical | Yes — HELD (see `ERASURE-LIFECYCLE.md`) |
| Security | Youth Campfire | High | Yes — HELD |
| Security | Live moderation / legal hold | High | Yes |
| Product | Merge-order Go #12→#13→rebase #14/#16 | High | **Yes** |
| Product | Wire A1–A6 + CF-2 into GB shell beyond throwaway | High | Yes — paste **HELD** (`GROK_BUILD_CAMPFIRE_BRIDGE_STATUS`); CF-3 shell = PREVIEW_WIRED only |
| Product | G1–G3 product rules | — | **LOCKED** fictionally; prod authz still required |
| Product | G4 physical erasure / legal confirm | Medium | Unresolved — docs only |
| Product | F1–F5 | Medium | HELD |
| Product | Home / five-tab / Crew Invite freeze | High | Hold — preserved (t1193u untouched) |
| Deploy | Pages / prod / payments | Blocker | **Do not** |

---

## Can proceed now (no merge)

1. Iterate AF-AUTH / AF-JOURNEY / AF-RC / **AF-G14** / **AF-CF3** on throwaway  
2. Docs-only merge plan / authz packet / erasure lifecycle updates  
3. Keep CI green on #17 / Campfire depth drafts (#24 / t1193u) — **no merge Go**  


## Needs owner approval

1. Any merge of #12–#17  
2. Pages / deploy / production  
3. Activate production server authz  
4. Youth / payments / **live** deletion jobs  
5. Treat client Rider/Viewer as security (must not)  
6. Legal G4 physical erasure activation  

---

## Smallest RC path (STATE — do not merge)

See `MERGE-PLAN.md` §5. Headline: merge-order → adapters → selective #17 fold → **server authz** → acceptance.

## Owner approvals only (grouped)

**Merge / lineage:** Merge-order Go · Accept #17 selective fold into release lineage  
**Security:** Production authz Go · Identity provider Go  
**Policy:** G1–G4 product text LOCKED (fictional). Live storage erasure / legal G4 activation still needs counsel. F1–F5 · Youth · payments HELD  
**Deploy:** Explicit Pages/prod Go (if ever)  
