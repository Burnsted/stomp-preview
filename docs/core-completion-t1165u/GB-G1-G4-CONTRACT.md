# GB-G1–G4-CONTRACT — UI-facing contract for Grok Build (t1166u)

**Client demo ≠ server authority.** Preview UI may mirror these states for demo; production enforcement is a separate Go.

---

## G1 — Day Sesh media

| Concern | Contract |
|---|---|
| Required states | `live` · `expired` (past max) · `author_removed` · `permission_revoked` |
| Deadline | `officialEndedAt + 45d` maximum (`day_sesh_45d_max`) |
| Before official end | Flag `day_sesh_45d_max`; `deadlineAt` / `expiresAt` may be null until end anchors |
| Share / link / repost into Campfire | **MUST NOT** rewrite `expiresAt` / restart clock |
| Error reasons | `expired` · `not_member` · `account_erased` · `not_found` |
| Authz response | Recheck membership + expiry + account on every access |
| User-visible limitation | Access within 45d is a **maximum**, not a guarantee |

Campfire text (12 mo) and standalone Campfire media (90d) and Trip Drop media (≤45d trip official end) are **out of scope** for G1 clock changes.

---

## G2 — Squad leave / rejoin

| Concern | Contract |
|---|---|
| Leave | Membership → `left`; Campfire access terminates immediately |
| Rejoin | Requires **new** approved membership (`active` row appended; left row retained) |
| History | `historyCutoffAt = joinedAt` — prior messages **not** auto-visible |
| Media clocks | Rejoin does **not** reset historical `expiresAt` |
| Error reasons | `not_member` · `duplicate` (already active) |
| User-visible limitation | Returning members see **prospective** content only |

---

## G3 — Owner departure / transfer

| Concern | Contract |
|---|---|
| Preferred path | Owner nominates eligible **active adult** member → nominee **accepts** → ownership `resolved` |
| Pending | `ownershipState: pending_transfer` — no ownership change until accept |
| Unresolved | Depart without accepted successor → `ownershipState: unresolved` |
| Forbidden | Auto-promote oldest/most-active; fallback owner-admin elevation |
| Members | Existing members + permitted Campfire activity **preserved** |
| Moderation | Report / block / mute paths remain available |
| Error reasons | `not_squad_admin` · `not_member` · `youth_disabled` · `unresolved_policy` · `intent_invalid` |
| Recovery (docs) | Safe recovery = new nominate+accept once eligible adult available; unresolved admin authority does **not** invent owner powers |

---

## G4 — Account deletion

| Concern | Contract |
|---|---|
| Confirmed deletion | Immediate logical revoke: `accountStatus: erased`, sessions/grants revoked, memberships → `revoked`, pending invites revoked |
| Display | Author label → `Former STOMPER`; own content soft-hidden / erased state |
| Others' content | **Not** auto-deleted |
| Physical wipe | **NOT guaranteed** from backups/third parties — do not promise in UI |
| Error reasons | `account_erased` on subsequent auth actions |
| User-visible limitation | Logical access ends immediately; storage erasure schedules require separate tech+legal Go |

See `ERASURE-LIFECYCLE.md` (obligations vs live deletion). Production security proposal remains in `SERVER-AUTHZ-PACKET.md` — **prepared, not executed**.

---

## Regression locks (must stay green)

- AF-G14-01..14
- Trip Drop + Campfire retention suites
- SV-0 share confirm / SHARE_MS=20s / Squad isolation / AF-AUTH deny-by-default
