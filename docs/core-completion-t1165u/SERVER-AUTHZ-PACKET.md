# SERVER-AUTHZ-PACKET — t1165u

**STATUS:** Fictional design + tests **IMPLEMENTED** on throwaway #17.  
**Production identity / credentials / storage / live enforcement:** **NOT ACTIVATED** — owner Go required.

---

## Banner (code + docs)

> Client permission checks (Rider Hub `social.ts` flags, preview UI) are **NEVER** production security.  
> `batch1/src/shared/fictionalAuthz.ts` is an in-process deny-by-default envelope over existing guards.  
> Do not enable Better Auth, payments, youth, or deletion jobs from this packet.

---

## A. Fictional work completed (this tip)

| Capability | Helper | Tests |
|---|---|---|
| STOMPER ↔ account ownership | `authorizeOwnStomper` | AF-AUTH-01 |
| Rider Pass → Trip join | `authorizeJoinTripAsRider` | AF-AUTH-02 |
| Co-host / host actions | `authorizeCohostAction` | AF-AUTH-03 |
| Squad Campfire access / post | `authorizeCampfireAccess` | AF-AUTH-04 |
| Viewer react (no Squad leak) | `authorizeViewerReact` | AF-AUTH-05 |
| Viewer download deadline / revoke | `authorizeViewerDownload` | AF-AUTH-06 |
| Single-Squad share prepare | `authorizePrepareShare` | AF-AUTH-07 |
| Confirm share + recheck | `authorizeConfirmShare` | AF-AUTH-08 |
| Day Sesh Pass gate | `authorizeJoinDaySesh` | AF-AUTH-09 |
| Expiry / grace retention | `authorizeRiderAccessAt` | AF-AUTH-10 |
| SHARE_MS = 20s lock | constants | AF-AUTH-11 |
| Rider Hub bridge table | `RIDER_HUB_BRIDGE_TABLE` | AF-AUTH-12 |

Module: `batch1/src/shared/fictionalAuthz.ts` (+ `riderHubBridge.ts`).  
Exported via `shared` namespace. Preview re-export: `gb-phone/.../woz-bridge/cf2-share.ts`.

Deny-by-default: every helper returns `{ allow: false, code }` unless existing batch1 guards pass.

---

## B. Production IMPLEMENTATION + APPROVAL PACKET (NOT activated)

### B1. Required owner approvals before any live wire-up

1. Architecture Go — server authz is SoT; clients are UX only  
2. Identity provider Go — real STOMPER ↔ account binding  
3. Infra Go — API hosting, secrets, audit logs  
4. Explicit **no** youth / payments / deletion activation in the same change set  

### B2. Suggested endpoint envelope (design only)

```
POST /v1/share/confirm
  body: { pendingId, actorId, channel }
  server: CAS claim → recheck membership + media + sessionUnlock → confirm
  403 codes: not_member | session_locked | expired | already_handled | multi_recipient

POST /v1/trips/:id/join
  server: canJoinAsRider (Pass active; trip active/scheduled)
  403: pass_inactive | trip_not_active

GET /v1/viewer/download/:mediaRefId
  server: canDownloadViewer (deadline + not revoked)
  403: viewer_download_denied — never accept client-extended MediaRef clocks

POST /v1/campfire/:squadId/post
  server: canAccessCampfire (membership + accountStatus)
  403: not_member | youth_disabled | account_erased

POST /v1/daysesh/:id/join
  server: canJoinDaySesh (Pass only; no Trip grace)
  403: pass_inactive | day_sesh_expired
```

### B3. Must NOT trust from client

- `passRole` / `passExpired` from Rider Hub  
- Client-only `avatar !== null` as Trip join authority (STOMPER gate stays greet; Pass is separate)  
- Client-extended MediaRef / share TTL  
- Multi-Squad share arrays  

### B4. Mapping to existing fictional guards

Reuse — do not rewrite: `trips.eligibility`, `daysesh.entitlement`, `campfireCf2.guards/share/sesh-*`, A5 `guardResult`, A6 `participationFacts`, `fictionalAuthz` as the typed catalog.

### B5. Explicit OPEN / HELD (no invented rules)

| Item | State |
|---|---|
| G1 Day Sesh media deadline | **LOCKED** fictionally (`day_sesh_45d_max`) — prod authz still required |
| G2 rejoin / G3 owner transfer | **LOCKED** fictionally — prod authz still required |
| G4 logical revoke | **LOCKED** fictionally; physical wipe **not** guaranteed |
| G4 storage erasure schedules | Unresolved — see `ERASURE-LIFECYCLE.md` (docs only; NOT executed) |
| F1–F5 | HELD |
| Youth Campfire | HELD (`YOUTH_CAMPFIRE_ENABLED=false`) |
| Payments | HELD |
| Live deletion jobs | HELD (`assertNoDeletionJob().enabled === false`) |
| Legal G4 erasure activation | Owner + counsel |

**t1166u note:** G1–G4 product policies are LOCKED for fictional tip + AF-G14. This packet remains **prepared but not executed** for production identity/authz/media lifecycle/storage/deletion.

---

## C. Activation checklist (future — not this PR)

1. Owner Go on B1  
2. Implement server handlers calling same guard pure functions  
3. Add integration tests against staging with test credentials (separate lane)  
4. Flip clients to treat 403 as SoT; strip demo flags from security paths  
5. Never enable youth/payments/deletion in the same merge  
