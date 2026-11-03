# PROD-AUTHZ-REQUIREMENTS — t1184u / t1185u

**STATUS:** Checklist / contract for production authorization.  
**HARD:** Do **NOT** activate live identity, Better Auth wire-up, credentials, payments, youth, deletion jobs, or network services from this PR.

Foundation: `docs/core-completion-t1165u/SERVER-AUTHZ-PACKET.md` + `docs/release-candidate-t1170u/PROD-SECURITY-BLOCKERS.md`.  
Fictional envelope: `batch1/src/shared/fictionalAuthz.ts` + `riderPersonalExport.ts`.

---

## Banner

> Client permission checks (Rider Hub `social.ts`, preview UI) are **NEVER** production security.  
> `fictionalAuthz` is deny-by-default over batch1 guards. Client demo ≠ production authorization.

---

## A. Capability → fictional helper → production requirement

| Capability | Fictional helper | Prod requirement (NOT activated) | Deny codes |
|---|---|---|---|
| STOMPER ↔ account ownership | `authorizeOwnStomper` | Server binds stomperId ↔ authenticated account | `account_mismatch` |
| Rider Pass → Trip join | `authorizeJoinTripAsRider` | Pass entitlement SoT on API | `pass_inactive` |
| Co-host / host | `authorizeCohostAction` | Membership role server-side | `not_host_or_cohost` |
| Squad Campfire access/post | `authorizeCampfireAccess` | Membership + accountStatus | `not_member` · `account_erased` · `youth_disabled` |
| Viewer react (no Squad leak) | `authorizeViewerReact` | Trip Viewer alone cannot Campfire-react | `not_member` |
| Viewer download | `authorizeViewerDownload` | Server clocks; refuse client-extended MediaRef | `expired` |
| MediaRef access | `authorizeMediaRefAccess` | Membership + expiry; G1 clock immutable | `not_member` · `expired` · `clock_extended` |
| Trip Drop media | `authorizeTripDropMediaAccess` | Trip retention unchanged; share ≠ extend | `intent_invalid` · `expired` |
| Day Sesh media (G1 45d) | `authorizeDaySeshMediaAccess` | `day_sesh_45d_max`; Campfire never extends | `expired` |
| Day Sesh join | `authorizeJoinDaySesh` | Pass required; Trip grace insufficient | `pass_inactive` |
| Single-Squad Quick Share | `authorizePrepareShare` | Exactly one Squad + membership | `multi_recipient` · `not_member` · `account_erased` |
| Confirm share 20s | `authorizeConfirmShare` + SESH pending | CAS + recheck; TTL=20000 | `session_locked` · `expired` · `already_handled` |
| Campfire history (G2) | `authorizeCampfireHistoryRead` | Leave ends access; rejoin prospective-only | `not_member` · `history_cutoff` |
| Owner elevation (G3) | `authorizeSquadOwnerElevation` | Accept-only transfer; else unresolved | `unresolved_policy` |
| Non-erased account (G4) | `authorizeNonErasedAccount` | Immediate logical revoke on confirmed delete | `account_erased` |
| Personal JSON export | `authorizePersonalExport` / `buildRiderPersonalExport` | Actor owns subject; erased denies | `export_actor_mismatch` · `account_erased` |
| Youth enrollment | `authorizeAdultCampfireEnrollment` | Keep HELD until separate Go | `youth_disabled` |

---

## B. Suggested endpoint envelope (design only)

```
POST /v1/trips/:id/join          → authorizeJoinTripAsRider
POST /v1/daysesh/:id/join        → authorizeJoinDaySesh
GET  /v1/viewer/download/:ref    → authorizeViewerDownload
GET  /v1/media/:ref              → authorizeMediaRefAccess | TripDrop | DaySesh
POST /v1/campfire/:squadId/post  → authorizeCampfireAccess(forPost)
GET  /v1/campfire/:squadId/history → authorizeCampfireHistoryRead (per message)
POST /v1/share/prepare           → authorizePrepareShare (single Squad)
POST /v1/share/confirm           → authorizeConfirmShare (20s TTL + recheck)
POST /v1/squads/:id/owner/nominate → nominateOwnerSuccessor
POST /v1/squads/:id/owner/accept   → acceptOwnerTransfer
POST /v1/account/delete          → revokeAccountAccess (logical only)
GET  /v1/me/export               → authorizePersonalExport + buildRiderPersonalExport
```

TTL lock: `SHARE_MS = SESH_PENDING_TTL_MS = 20000`.

---

## C. Must NOT trust from client

- `passRole` / `passExpired` / client-extended MediaRef clocks  
- Multi-Squad share arrays  
- Client claim of ownership transfer without nominee accept  
- Client claim that Campfire share extended Day Sesh clock  
- Demo Rider Hub flags as security SoT  

---

## D. Activation checklist (future — Ted Go required)

1. Architecture Go — server authz is SoT  
2. Identity provider Go — real STOMPER ↔ account binding  
3. Infra Go — API, secrets, audit logs  
4. Staging integration tests mirroring AF-AUTH + AF-EXPORT deny codes  
5. Explicit **no** youth / payments / physical deletion in same change set  
6. Counsel Go before any G4 physical erasure / legal-hold infra  

**This PR completes the fictional contract + tests only.**
