# COMPLETED — technical work this batch (t1170u)

**Branch:** `cursor/release-candidate-t1170u-8e36` · DRAFT  
**Base:** #18 tip `69d3daf` (avatar identity looks ≠ names)  
**Hard bounds honored:** no main merge · no Pages · no live auth/payments/youth/deletion jobs · SV-0 not reopened · G1–G4 not reopened without regression.

---

## Workstream 1 — Unified release candidate

- Reconfirmed MERGE-PLAN sequence against live heads (#12→#13→rebase #14/#16→A1–A6→selective #17→#18).
- Confirmed #18 already contains #12/#13/#15/#17 ancestry + selectively folded CF-2/SV-0 surfaces (not git-ancestor of #14/#16).
- Identified remaining **owner-Go** conflicts: #14/#16 rebase onto post-#12/#13 main; avoid wholesale #17 tip merge (adapters only).
- Isolated candidate branch cut from #18; preserved STOMPER-first (`greet` default), Home, five tabs, Crew Invite, Campfire, Trip Drop, Day Sesh, Sesh, G1–G4 fictional, greet/og branding.

## Workstream 2 — Security readiness (NOT activation)

- Extended `fictionalAuthz.ts` with `authorizeNonErasedAccount` + `authorizeAdultCampfireEnrollment` (deny-by-default; fictional).
- Added AF-AUTH-13..15 denial paths (erased account, youth HELD, Squad isolation + 20s SESH TTL).
- Documented production implementation + testing requirements in `PROD-SECURITY-BLOCKERS.md` (extends SERVER-AUTHZ-PACKET; **not activated**).

## Workstream 3 — Frontend artwork readiness (technical only)

- Audited `AvatarRenderer` + locker/customization layer slots.
- Wrote `ARTWORK-INTEGRATION-SPEC.md` — format, dimensions, transparency, naming, compression, layering contract for GB.
- Verified t1169u still true: starters are looks; user-chosen names independent; youth/grom flag off.
- No substitute artwork generated; selector not redesigned.

## Workstream 4 — RC fictional-data journey tests

- New `batch1/tests/af-rc-journey-t1170u.test.ts` — RC-J01..J10 (invite/join, share, Day Sesh retention, leave/rejoin, ownership, deletion, Pass/Viewer expiry, Sesh delivery, Trip composition, youth HELD).
- New `gb-phone/tests/woz/update02/rc-journey-t1170u.test.tsx` — first-time / returning / youth-off / layer contract / 390×844 viewport constant.
- Extended AF-AUTH matrix; prior AF-G14 / AF-JOURNEY / AF-SV left intact (no reopen).

## Workstream 5 — Docs packet

All eight deliverables under `docs/release-candidate-t1170u/` plus this batch report.

---

## Files touched (summary)

| Area | Paths |
|---|---|
| Authz | `batch1/src/shared/fictionalAuthz.ts` |
| Tests | `batch1/tests/af-auth-01-12.test.ts`, `batch1/tests/af-rc-journey-t1170u.test.ts`, `gb-phone/tests/woz/update02/rc-journey-t1170u.test.tsx` |
| Docs | `docs/release-candidate-t1170u/*` |
