# OWNER-APPROVALS — grouped gates for next step (t1170u)

**Ted Burns owner batch.** DRAFT PR only until explicit Go.

---

## Already locked (do not reopen without regression)

| Item | State |
|---|---|
| G1–G4 product policy text (fictional) | **LOCKED** Nov 2, 2026 |
| SV-0 single-Squad share + 20s TTL | **Closed** fictionally |
| Starter looks ≠ STOMPER display names | **Locked** t1169u · verified t1170u |
| Youth Campfire / grom enrollment | **HELD** (flags false) |
| F1–F5 | **HELD** |
| Client demo as production authz | **FORBIDDEN** |

---

## Grouped approvals required

### Merge / lineage

- [ ] **Merge-order Go** — #12 → #13 → rebase #14/#16 → A1–A6 → selective #17 → #18/t1170u  
- [ ] Accept **selective** fold of #17 + RC tip into release lineage (not wholesale)  
- [ ] Confirm protected tips #12–#16 remain unrewritten  

### Security

- [ ] **Production authz Go** — server SoT per PROD-SECURITY-BLOCKERS / SERVER-AUTHZ-PACKET  
- [ ] **Identity provider Go** — real STOMPER ↔ account binding  
- [ ] Infra Go — API hosting, secrets, audit logs  
- [ ] Explicit **no** youth / payments / deletion jobs in same change set  

### Policy / legal

- [ ] Counsel Go for **G4 physical erasure** schedules / backups / third parties  
- [ ] Legal hold / moderation provider Go (if live)  
- [ ] Age / guardian consent provider Go (before any youth consideration)  

### Product / artwork

- [ ] GB artwork drop acceptance against ARTWORK-INTEGRATION-SPEC  
- [ ] Actual-device Android acceptance (390×844 assumption ≠ device QA)  

### Deploy

- [ ] Explicit **Pages / prod Go** (if ever) — currently forbidden  

---

## Can proceed now (no merge)

1. Keep CI green on this DRAFT RC PR  
2. Iterate fictional AF-AUTH / RC-JOURNEY / docs only  
3. Artwork production by GB against the spec (outside this PR)  

## Must not proceed without Go

1. Any merge of #12–#18 / RC into `main`  
2. Pages / deploy / production  
3. Activate production server authz  
4. Youth / payments / live deletion jobs  
5. Treat client Rider/Viewer as security  
