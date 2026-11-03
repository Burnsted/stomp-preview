# G1–G4 POLICY LOCK — t1166u (folded into t1165u)

**Authority:** Ted owner-approved product direction — Nov 2, 2026.  
**Status:** LOCKED product requirements.  
**Scope:** Fictional-data + docs + tests only on draft PR #17.  
**NOT authorization** for production deletion jobs, real-user data changes, or live storage wipe.

---

## Verbatim locked decisions

### G1 — Day Sesh media retention

- Day Sesh-hosted photos/videos: **max retention 45 days** after official Day Sesh end (maximum, not guaranteed access).
- Earlier author deletion, permission revocation, applicable restrictions still apply.
- Reposting / linking / sharing Day Sesh-hosted media into Campfire **MUST NEVER** restart or extend its deletion clock.
- Campfire text: keep existing separate retention (**do not change**).
- Standalone Campfire media: keep existing separate policy (**do not change**).
- Trip Drop media: keep separately approved official-end-based retention (**do not silently change**).

### G2 — Squad rejoining

- Leaving terminates current membership-based access.
- Rejoining requires **NEW approved membership** — no automatic reentry from former membership.
- Previous Campfire history must **NOT** automatically become accessible after rejoining.
- New membership = prospective access per current permissions only.
- Previously contributed content stays under author-deletion / moderation / retention policies.
- Rejoining does **NOT** reset historical media deletion clocks.

### G3 — Squad owner departure

- Preferred: departing owner nominates eligible existing adult member.
- Transfer completes **ONLY** after nominated successor explicitly accepts.
- Without accepted successor → **safe unresolved-owner** state.
- Do **NOT** destroy existing members / permitted Campfire activity merely because ownership unresolved.
- Departing owner must **NOT** be forced to remain active participant.
- Do **NOT** auto-promote oldest / most active / longest-serving.
- Do **NOT** grant owner-only admin via fallback.
- Protect reporting / blocking / moderation paths.
- Document safe recovery options + unresolved admin authority separately (docs).

### G4 — Account deletion

- Confirmed deletion → **immediate revocation** of active account access, sessions, associated grants.
- Remove active memberships/invitations as appropriate.
- Eligible PII/media → documented erasure process (**document only; NO live storage deletion**).
- Preserve only for genuine legal requirement + restricted access + retention basis.
- Do **NOT** retain indefinitely merely because reported.
- Do **NOT** auto-delete other Squad members' content.
- Do **NOT** promise instantaneous physical deletion from all backups/third parties unless impl can guarantee it (**it cannot — say so**).
- Detailed storage erasure schedules / backup / legal exceptions = separate tech+legal review before live activation.

---

## Mapping vs tip + #12–#16 contracts

| Surface | Prior tip (#12–#16 / t1165) | G1–G4 LOCKED delta |
|---|---|---|
| Day Sesh media | `DEADLINE_UNSPECIFIED` / gate unresolved | **G1** `day_sesh_45d_max` — 45d after `officialEndedAt`; Campfire share never rewrites `expiresAt` |
| Campfire text | 12 months from createdAt | **Unchanged** |
| Campfire standalone media | 90 days from upload | **Unchanged** |
| Trip Drop media | ≤45d from trip official end | **Unchanged** |
| Squad leave | Membership → `left` | **G2** reinforces access termination |
| Squad rejoin / accept invite | Could revive rows ambiguously | **G2** always append NEW membership + `historyCutoffAt`; no history auto-expose |
| Owner succession | AF-CF-36 unresolved / skip | **G3** nominate → accept only; else `unresolved`; no auto-promote |
| Owner account deletion | AF-CF-59 forced-stay unresolved | **G3/G4** owner may depart; unresolved-owner safe |
| Account erasure | Soft hide + Former STOMPER; legal confirm unresolved | **G4** logical revoke immediate; physical wipe **not** guaranteed; erasure schedule docs only |
| SV-0 share | SHARE_MS=20s; confirm+recheck | **Unchanged** — AF-G14-14 regression lock |
| STOMPER-first / Home / five-tab / Sesh | Preserved | **Preserved** |

### Conflicts resolved (prefer Ted LOCKED text)

1. **Day Sesh deadline:** tip used `DEADLINE_UNSPECIFIED` → replaced by `day_sesh_45d_max` / 45d-after-official-end. Tests AF-CF-61/75, AF-XINT-08, AF-RC-09 updated; delta noted in REPORT.
2. **Rejoin history / owner transfer / owner deletion gates:** were `unresolved`/`skipped` → product behavior **locked**; physical erasure / legal infra remain unresolved/disabled.
3. **No silent change** to Trip Drop or Campfire text/standalone media clocks.

---

## Implementation surfaces (fictional)

| Module | Role |
|---|---|
| `batch1/src/campfire/lifecycle-g1g4.ts` | Canonical G1–G4 helpers |
| `batch1/src/campfire/retention.ts` | `daySeshMediaDeadline` / `computeMediaExpiry` |
| `batch1/src/campfire/world.ts` | upload/share freeze, rejoin, nominate/accept/depart, erase revoke, recheck |
| `batch1/src/campfire/policy.ts` | `DAY_SESH_MEDIA_MAX_DAYS=45`; gates `locked` |
| `batch1/src/campfire/erasure.ts` | Owner deletion allowed; physical wipe false |
| `batch1/tests/af-g14-policy-lock.test.ts` | Ted's 14 cases |

---

## Hard bans (reinforced)

No real-user access · no prod data changes · no production authz rollout · no storage deletion jobs · no payments · no live youth · no merges · no protected-branch edits · no Pages/deploy/publish · SV-0 closed unless regression.
