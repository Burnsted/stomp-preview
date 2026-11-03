# THREAT-MODEL REVIEW — t1184u / t1185u

**SCOPE:** Fictional-data authorization surfaces + documented production safeguards.  
**OUT OF SCOPE / FORBIDDEN this batch:** physical erasure activation, legal-hold infra, live moderation, payments, youth enablement, real credentials.

Owner locks honored: **G1–G4**, Multi-Squad STOMPER, 1 Campfire/Squad, MediaRef links, Quick Share one Squad + 20s confirm.

---

## 1. Assets & trust boundaries

| Asset | Trust boundary today | Prod SoT required |
|---|---|---|
| STOMPER identity | Client demo flags | Authenticated account binding |
| Rider Pass / Viewer | Fictional entitlements | Server entitlement store + clocks |
| Squad membership | CF-2 world memberships | Server membership + leave/rejoin ledger |
| Campfire messages/media | In-process MediaRef | Object store + ACL + immutable expiresAt |
| Share pending (20s) | PendingStore TTL | Server CAS + TTL |
| Account deletion | Logical `erased` flag | Session kill + grant revoke; wipe separate |

---

## 2. Threat scenarios → mitigations → coverage

### T1 — Authz isolation break (cross-Squad / Viewer leak)

- **Threat:** Trip Viewer or foreign Squad member reads/reacts/posts on another Campfire.  
- **Mitigation:** Deny-by-default `authorizeCampfireAccess` / `authorizeViewerReact` / `authorizePrepareShare`; membership required.  
- **Coverage:** AF-AUTH-04/05/07/15 · AF-AUTH-t1184u · AF-G14-14  
- **Prod safeguard:** API 403 on non-member; audit log; never trust client squadIds alone.

### T2 — G1 Day Sesh 45d clock extension via Campfire share/link

- **Threat:** Repost/link/share rewrites `expiresAt` past official-end+45d.  
- **Mitigation:** `assertShareDoesNotExtendMediaClock`; `authorizeMediaRefAccess` clock_extended deny; retention `resetOn: never`.  
- **Coverage:** AF-G14-01..04 · AF-AUTH-t1184u MediaRef/Day Sesh  
- **Prod safeguard:** Server owns expiresAt; share confirm must not UPDATE media clock columns.

### T3 — Campfire repost without clock extension (Trip Drop / Campfire media)

- **Threat:** Activity or forward resets Trip Drop / Campfire media TTL.  
- **Mitigation:** MediaLink is pointer-only (no expiry field); share helpers never rewrite asset.expiresAt.  
- **Coverage:** AF-G14-13 · AF-AUTH-t1184u Trip Drop  
- **Prod safeguard:** Link table separate from MediaRef; immutable expiresAt constraint.

### T4 — Ownership transfer without explicit accept (G3)

- **Threat:** Auto-promote nominee or elevation while unresolved.  
- **Mitigation:** `nominateOwnerSuccessor` → pending; `acceptOwnerTransfer` only; `authorizeSquadOwnerElevation` denies unresolved/pending; `departOwnerWithoutSuccessor` → unresolved.  
- **Coverage:** AF-G14-08..10 · AF-AUTH-t1184u G3  
- **Prod safeguard:** Two-step nominate/accept transactions; block owner-only admin elevation when unresolved.

### T5 — Quick Share without confirm / past 20s

- **Threat:** Multi-Squad blast or confirm after TTL.  
- **Mitigation:** `assertSingleSquad`; `SESH_PENDING_TTL_MS=20000`; claimPendingConfirmation denies late; SV-0 recheck.  
- **Coverage:** AF-AUTH-07/08/11/15 · AF-DENY-05 · AF-G14-14  
- **Prod safeguard:** Server CAS pending row; TTL enforced server clock; multi-recipient 403.

### T6 — Deletion without immediate logical revoke (G4)

- **Threat:** Deleted account retains sessions, grants, Campfire post rights, or export.  
- **Mitigation:** `revokeAccountAccess` → erased + memberships revoked + invites revoked; `authorizeNonErasedAccount` / export deny; `assertNoDeletionJob().enabled===false`.  
- **Coverage:** AF-G14-11/12 · AF-AUTH-t1184u G4 · AF-EXPORT-03 · AF-DENY-04  
- **Prod safeguard:** Immediate session/token revoke; ACL deny; physical wipe is **separate** counsel track (`physicalWipeGuaranteed=false`).

### T7 — Leave / rejoin history leak (G2)

- **Threat:** Left member retains read; rejoin auto-loads prior history; clocks reset.  
- **Mitigation:** Leave → not_member; rejoin = new membership; `authorizeCampfireHistoryRead` history_cutoff.  
- **Coverage:** AF-G14-05..07 · AF-AUTH-t1184u G2 · AF-DENY-02/03  
- **Prod safeguard:** Soft-delete membership rows; historyCutoffAt server-enforced.

### T8 — Personal export by wrong actor / after erase

- **Threat:** Cross-account export or post-delete data dump.  
- **Mitigation:** `authorizePersonalExport` actor match + non-erased; `buildRiderPersonalExport`.  
- **Coverage:** AF-EXPORT-01..03  
- **Prod safeguard:** AuthN required; export audited; erased subjects 403.

### T9 — Client-trusted Pass / Viewer flags

- **Threat:** Spoofed `passExpired=false` unlocks Trip/Day Sesh.  
- **Mitigation:** Fictional helpers call Pass/Viewer guards; Rider Hub documented DEMO ONLY.  
- **Coverage:** AF-AUTH-02/06/09/10 · AF-DENY-01  
- **Prod safeguard:** Never accept client entitlement booleans.

---

## 3. Explicit non-goals (do not implement here)

- Physical erasure jobs / backup scrubbers  
- Legal hold / eDiscovery pipelines  
- Live moderation queues  
- Youth Campfire enablement  
- Payments  
- Production Better Auth flip  

---

## 4. Residual risk (honest)

| Risk | Severity | Status |
|---|---|---|
| Fictional tests ≠ prod API | Critical | BLOCKED until staging SoT |
| Android/device gaps | High | OPEN |
| Counsel-pending G4 wipe | Critical | BLOCKED |
| Artwork incomplete (#20/#21) | Medium | Parallel lane |
| Merge conflicts on #14 rebase | High | Rehearsed only |

---

## 5. Test coverage map

| Suite | Threats |
|---|---|
| AF-AUTH-01..15 | T1, T5, T6, T9 |
| AF-AUTH-t1184u | T1–T7, T9 |
| AF-EXPORT / AF-DENY | T6–T8, T5, T9 |
| AF-G14 | T2–T7 |
| AF-MERGE-ORDER | Process / tip protection |

**Verdict:** Fictional threat coverage for listed surfaces is **adequate for draft readiness**. Production release remains **BLOCKED** on real authz, identity, G4 counsel, merge Go, and device acceptance.
