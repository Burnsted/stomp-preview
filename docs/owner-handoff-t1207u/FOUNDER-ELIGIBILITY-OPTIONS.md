# Founder eligibility cutoff — OPTIONS for Ted (D5) · t1207u

**Locked direction:** Gold Founder's Edition for **all early registered** STOMPERs — not a paid SKU; no skill advantage; no individual sale; no real manufacturer trademarks / exact board artwork without permission.  
**Cutoff:** **NOT locked.** Prepare a **configurable eligibility rule**; Ted picks later.

---

## Existing tree note

`batch1/src/trips/retention.ts` → `founderClock(...)` is a **stub** (`deadlineIso: null`, `policyUnresolved: "Founder retention duration not owner-specified; stub only."`). Preserve previously approved Founder **entitlement-duration** rules unless owner changes them — cutoff options below are **registration eligibility**, not duration.

---

## Proposed configurable rule shape

```
FOUNDER_ELIGIBILITY = {
  ruleId: string;           // which option below
  cutoffAt: string | null;  // ISO UTC — OWNER SUPPLIES when chosen
  registeredByField: "accountCreatedAt" | "stomperProfileCreatedAt";
  sportsScope: "snowboarding"; // hard scope
  excludeYouthUntilApproved: true; // D7 — no live youth Founder grants
}
```

Implement as **one** policy constant / config object — not hardcoded dates in UI copy.

---

## Option A — Soft-launch registration window (recommended default for planning)

| Field | Proposal |
|---|---|
| Rule | Every adult STOMPER whose registration timestamp is **≤ soft-launch cutoff** (owner-chosen UTC instant) |
| Cutoff | **TBD by Ted** (example placeholder only: “end of first public invite wave” — **not locked**) |
| Pros | Clear cohort; matches “all early registered” |
| Cons | Needs precise launch definition |

## Option B — First-N registered (count cap)

| Field | Proposal |
|---|---|
| Rule | First **N** successfully registered adult STOMPERs (N owner-chosen; e.g. planning placeholder 500 / 1000 — **not locked**) |
| Cutoff | Implicit = when count reaches N |
| Pros | Caps art/logistics cost |
| Cons | Race / fairness optics; needs tie-break (exact `registeredAt` + stable id) |

## Option C — Invite-code / Founder cohort flag

| Field | Proposal |
|---|---|
| Rule | Registration completes with an owner-issued **Founder invite code** or server-side `founderCohort=true` before a **cohort close** timestamp |
| Cutoff | Cohort close = **TBD by Ted** |
| Pros | Manual control; easy to pause |
| Cons | Ops overhead; must prevent post-close code reuse |

---

## Entitlement content (locked product, not optional)

For every qualifying early registrant:

- Gold collectible identity styling  
- Founder recognition  
- Original metallic silver collectible snowboard  
- **No** extra skill advantage  
- **No** separate paid upgrade  
- **Not** sold individually  

Youth / Grom: remain **preview-only** until D7 unlock — do not grant live Founder youth entitlements early.

---

## Owner pick checklist (later)

- [ ] Choose Option A / B / C (or hybrid)  
- [ ] Supply exact cutoff date **or** N **or** cohort close  
- [ ] Confirm entitlement duration (preserve prior rule unless changed)  
- [ ] Confirm artwork source (no trademarked manufacturer decks)
