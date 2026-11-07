# PROD-SECURITY-BLOCKERS — remaining production security + approval packet (t1170u)

**STATUS:** Implementation + testing **requirements** prepared.  
**HARD:** Do **NOT** activate real auth, data services, deletion jobs, or payments in this PR.

Foundation: `docs/core-completion-t1165u/SERVER-AUTHZ-PACKET.md` + `ERASURE-LIFECYCLE.md` (reconfirmed).  
Fictional envelope on tip: `batch1/src/shared/fictionalAuthz.ts` + AF-AUTH-01..15 + AF-G14 + AF-RC-JOURNEY.

---

## Banner

> Client permission checks (Rider Hub `social.ts`, preview UI) are **NEVER** production security.  
> `fictionalAuthz` is an in-process deny-by-default catalog over existing guards.  
> Client demo ≠ production authorization.

---

## A. Exact remaining production blockers

| # | Blocker | Severity | State |
|---|---|---|---|
| 1 | **Server authz SoT** — Pass / Viewer / Squad / share / Day Sesh enforced on API | Critical | Packet ready · **NOT activated** |
| 2 | **Real STOMPER ↔ account ownership** binding (identity provider) | Critical | Design only |
| 3 | **Rider Pass + Viewer entitlement** server enforcement + clock authority | Critical | Fictional only |
| 4 | **Squad membership authz + Campfire isolation** server-side | Critical | Fictional only |
| 5 | **Trip Drop + Day Sesh permissions** server-side (Pass; no Trip-grace for DS) | Critical | Fictional only |
| 6 | **Confirmed single-Squad share + 20s auth expiration** (`SHARE_MS=20000`) CAS + recheck | Critical | Fictional SV-0 only |
| 7 | **Media access / revocation / retention** — server refuses client-extended clocks | Critical | Fictional MediaRef only |
| 8 | **Account deletion → immediate logical revoke** + session revocation | Critical | Fictional G4; physical wipe **false** |
| 9 | **Lawful erasure / storage / CDN / backup wipe schedules** | Critical | Docs only · counsel required |
| 10 | Identity / age / guardian consent providers | Critical | Unresolved |
| 11 | Live moderation / legal hold infra | High | Stub only |
| 12 | Youth Campfire | High | **HELD** (`YOUTH_CAMPFIRE_ENABLED=false`) |
| 13 | Payments | Blocker | **HELD** |
| 14 | Pages / prod deploy | Blocker | **FORBIDDEN** this batch |

---

## B. Implementation requirements (design — not executed)

### B1. Real STOMPER identity / account ownership

- Server binds `stomperId` ↔ authenticated account id; never trust client `actorId`.
- Map to fictional `authorizeOwnStomper` + `authorizeNonErasedAccount`.
- Tests required before Go: mismatch deny; erased deny; session revoke after delete.

### B2. Rider Pass + Viewer entitlement

- `POST /v1/trips/:id/join` → `canJoinAsRider` / `authorizeJoinTripAsRider`.
- `GET /v1/viewer/download/:mediaRefId` → `canDownloadViewer` with server clocks.
- Deny codes: `pass_inactive` · `expired` · `viewer_download_denied`.
- **Must NOT trust** client `passRole` / `passExpired` / client-extended MediaRef.

### B3. Squad membership + Campfire isolation

- `POST /v1/campfire/:squadId/post` → `authorizeCampfireAccess` / membership + accountStatus.
- Cross-Squad reads denied; Trip Viewer alone cannot Campfire-react (`authorizeViewerReact`).
- Youth: keep `YOUTH_CAMPFIRE_ENABLED=false` until separate Go.

### B4. Trip Drop + Day Sesh permissions

- Day Sesh join requires Pass; Trip grace alone insufficient (`authorizeJoinDaySesh`).
- Finish Day Sesh must not mutate Campfire (`campfireEffects: []`).

### B5. Confirmed single-Squad share + 20s expiration

```
POST /v1/share/confirm
  body: { pendingId, actorId, channel }
  server: CAS claim → recheck membership + media + sessionUnlock → confirm
  TTL: SHARE_MS = SESH_PENDING_TTL_MS = 20000
  403: not_member | session_locked | expired | already_handled | multi_recipient
```

### B6. Media access / revocation / retention

- Server owns MediaRef `expiresAt`; share confirm must not reset clocks (G1).
- Revocation immediate on grant revoke; soft-hide ≠ physical wipe.
- `assertNoDeletionJob().enabled === false` until separate deletion Go.

### B7. Account deletion / session revocation / lawful erasure

- On confirmed delete: logical revoke sessions + grants + memberships (G4 fictional today).
- Physical storage / backup / third-party erasure = **owner + counsel** before activation.
- See `ERASURE-LIFECYCLE.md` — obligations documented, **not executed**.

---

## C. Testing requirements before production Go

| Suite | Purpose |
|---|---|
| Staging integration vs same pure guards | Prove API returns same deny codes as AF-AUTH |
| Clock / TTL fuzz around 20s share | No client extension |
| Isolation: Squad A cannot read Squad B | Leak tests |
| Erasure: deleted actor 403 on all mutating routes | Session revoke |
| Negative: youth / payments flags remain off | Regression |
| Load + audit log completeness | Infra Go |

Fictional suites already green on RC tip are **necessary but not sufficient**.

---

## D. Approval packet (grouped)

See `OWNER-APPROVALS.md`. Minimum before any live wire-up:

1. Architecture Go — server authz is SoT  
2. Identity provider Go  
3. Infra Go — hosting, secrets, audit logs  
4. Explicit **no** youth / payments / deletion in same change set  
5. Counsel Go for G4 physical erasure schedules  

---

## E. Explicitly out of scope this PR

- Better Auth / live credentials  
- Deletion workers / CDN purge jobs  
- Payments, Arcade, Capture Studio, additional sports  
- Youth activation  
- Treating Rider Hub as security  
