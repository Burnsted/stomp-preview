# Family Playtest Preview — t1210u

**Status:** DRAFT · **NO MERGE** · FAMILY PLAYTEST PREVIEW ONLY  
**Objective:** Stable shareable STOMP Snowboarding preview for Cameron, Justin, and small invited testers on their phones. **Not** production beta.

| Field | Value |
|---|---|
| Base tip (PR #48 head) | `7bc585e87215b2043d66d222ecd75c88bffd73f9` |
| Branch | `cursor/family-playtest-t1210u-af0f` |
| Priority | P0 Stability → P1 Useful demo → P2 Phone testing → P3 Feedback → P4 Preview prep |

---

## Documents

| File | Purpose |
|---|---|
| [WHAT-SHIPPED.md](./WHAT-SHIPPED.md) | Delivery map vs priorities |
| [STABILITY.md](./STABILITY.md) | Crash hardening, nav, Reset Demo |
| [DEMO-SEED.md](./DEMO-SEED.md) | Family trip seed + Explore Demo |
| [FEEDBACK.md](./FEEDBACK.md) | Local feedback capture |
| [DEVICE-TEST.md](./DEVICE-TEST.md) | Browser / viewport evidence (honest) |
| [KNOWN-LIMITATIONS.md](./KNOWN-LIMITATIONS.md) | What still waits |
| [CAMERON-JUSTIN-INSTRUCTIONS.md](./CAMERON-JUSTIN-INSTRUCTIONS.md) | How to playtest |
| [BLOCKERS.md](./BLOCKERS.md) | What would block a useful playtest |
| [PREVIEW-DEPLOY-PLAN.md](./PREVIEW-DEPLOY-PLAN.md) | Plan only — **do not deploy** |
| [DEFAULTS-TAKEN.md](./DEFAULTS-TAKEN.md) | Safe defaults + deferred polish |

---

## Hard locks (unchanged)

- Do **not** merge, deploy Pages, or publish.
- Do **not** edit `greet.tsx` or `CrewLink`.
- Do **not** enable live youth/Grom, prod auth, payments, deletion jobs, live Squad sharing, real child accounts.
- Do **not** claim device PASS without real devices.
- Do **not** introduce a new DB or collect PII.
- Keep arcade release links intact (Terrain Park / approved arcade paths from main/#40/#42 lineage).

Authoritative prior fiction batch: `docs/fictional-data-t1208u/`.
