# ERASURE-LIFECYCLE — G4 obligations vs live storage (t1166u)

**STATUS:** Documented obligations only.  
**NO live storage deletion jobs. NO production purge. NO backup wipe.**

Fictional tip implements **logical revocation** only (`eraseStomper` / `revokeAccountAccess`).  
Detailed schedules, backup retention, third-party processors, and legal exceptions require **separate tech + legal review** before any live activation.

---

## A. What fictional tip does (logical)

| Step | Behavior |
|---|---|
| Confirmed deletion | `accountStatus → erased`; display → Former STOMPER |
| Sessions / grants | Marked revoked (`sessionsRevoked` / `grantsRevoked` flags) |
| Memberships | Active → `revoked` with `leftAt` |
| Invites | Pending → `revoked` |
| Own messages / media | Soft-hide / erased state; `localUri → null` for owned media |
| Other members' content | **Untouched** |
| Deletion jobs | `assertNoDeletionJob().enabled === false` |
| Physical wipe guarantee | **`false`** — never promised in UI or API |

---

## B. Documented erasure obligations (not executed)

1. Eligible PII / media under account control should enter an erasure **process** after confirmed deletion.
2. Preserve only for **genuine legal requirement** + restricted access + documented retention basis.
3. Do **not** retain indefinitely merely because content was reported.
4. Do **not** auto-delete other Squad members' content as a side effect of one account's deletion.
5. Do **not** claim instantaneous physical deletion from all backups / replicas / third parties — current impl **cannot** guarantee that.
6. Storage erasure schedules, backup windows, subprocessors, and legal exceptions = **owner + counsel + security** review before live Go.

Gate: `UNRESOLVED_GATES.account_erasure_legal_confirm` remains **`unresolved`** until that review.

---

## C. Relation to SERVER-AUTHZ-PACKET

- Packet covers identity / authz / media lifecycle / storage / deletion **design readiness**.
- This document separates **erasure obligations** from **live storage deletion**.
- Neither document authorizes production rollout. Prepare only; **do not execute**.

---

## D. Safe recovery notes (G3 cross-link)

Unresolved-owner Squads keep members and moderation. Account deletion of a former owner does not invent a successor — succession remains nominate+accept (or remains unresolved).
