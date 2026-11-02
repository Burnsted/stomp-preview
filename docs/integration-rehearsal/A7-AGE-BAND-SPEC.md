# A7 — ageBand ↔ AccountStatus + CrewMate view (SPEC ONLY)

**Status:** SPECIFICATION ONLY — t1152u integration rehearsal  
**GB shell:** HELD — no `gb-phone/**` edits  
**Youth enrollment / Grom authorization:** NOT changed by this rehearsal

## Mapping (planning assumption — fictional fixtures only)

| #12 Avatar `ageBand` | #14 `AccountStatus` | Campfire (YOUTH_CAMPFIRE_ENABLED=false) |
|---|---|---|
| `adult` | `active` | allowed (if Squad member) |
| `grom` | `youth` | disabled (`youth_disabled`) |
| *(existing)* `erased` | `erased` (preserved) | denied (`account_erased`) |

## Hard boundaries

1. A **grom label** on an AvatarConfig is a presentation/onboarding band — it does **not** prove an authorized youth account, guardian consent, or live age verification.
2. `ageBandToAccountStatus` / `crewMateToMembership` are pure documented stubs under `batch1/src/shared/ageBandSpec.ts` for AF-XINT and fixture wiring.
3. No runtime product change beyond those stubs. No youth enrollment flow. No Grom authorization change in GB.
4. G1–G4 remain gated; this SPEC invents no deletion/access policy.

## CrewMate → Membership view

`crewMateToMembership({ code, name })` → `{ stomperId: code, role: "member", state: "active", displayName: name, source: "crew_mate_view" }`.

View-only — does not write Squad/Membership stores and does not edit the GB Crew store.
