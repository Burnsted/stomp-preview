# Owner decisions D1–D7 — LOCKED product direction (t1207u)

**Source:** STOMP MASTER HQ — FINAL RIDER DESIGN HANDOFF (Nov 4, 2026).  
**Authority:** Overrides conflicting earlier recommendations (including any **6-month** Pass retention).  
**Scope:** Snowboarding only.  
**Status:** Approved product direction — **not** implementation or release Go.

---

## Verbatim locks + reconciliation

### D1 — Form #7: REVIEW REQUIRED

**Locked text:** Do not remove, replace, or redesign Form #7 yet. Identify purpose, implementation, dependencies, user-facing behavior. Screenshot or precise functional description for owner review. Remains unresolved.

| Field | Status |
|---|---|
| Reconciliation | **HOLD** — Form #7 **NOT FOUND IN TREE** at tip `59344235…` / ancestry `#39` (search evidence in `FORM-7-FINDINGS.md` + `evidence/FORM-7-SEARCH-LOG.md`) |
| Action | Do **not** remove/replace/redesign. Owner must identify or supply artifact before any Form #7 work |
| Overrides | Any earlier “drop / redesign Form #7” suggestions |

### D2 — Expired Pass retention: 12 MONTHS

**Locked text:** Active Pass = full authorized access. Expired Pass = full profile/history **locked**. Export-only period = **12 months** after Pass expiration (authorized personal Report Card + export/offload without new purchase). Then approved deletion lifecycle (warnings, legal retention, safeguards). Do **not** immediately delete on expiry. Do **not** silently restore deleted information after renewal. Prior **six-month** retention recommendation is **SUPERSEDED**. Account retention ≠ media retention. Day Sesh media ≤45d after official Trip Drop / Day Sesh end (**G1 unchanged**). Trip Viewer limits separate. Duration = **one configurable policy constant**.

| Field | Status |
|---|---|
| Reconciliation | **CONFLICT CALLED OUT** — tree still has `RIDER_ARCHIVE_MONTHS = 6` / `pass_archive_6mo` in `batch1/src/trips/retention.ts`; also `restartArchiveOnRenewal` must be revisited vs “no silent restore” |
| G1 | **Preserved** — Day Sesh media max 45d (`DAY_SESH_MEDIA_MAX_DAYS` / `day_sesh_45d_max`) |
| Spec | See `PASS-RETENTION-12MO-STATE-MODEL.md` |

### D3 — Welcome-back trigger: 90 DAYS INACTIVE

**Locked text:** Returning STOMPER inactive ≥90 days may get personalized welcome-back from **actual saved** info (last eligible trip, Working On / Stomped tricks, saved boards, avatar, upcoming Trip Drop invites, Report Card availability). Do not invent accomplishments or claim physical attendance from digital Trip Drop alone. **90-day trigger does NOT override Pass expiration.** Expired users get limited-access/export experience, not unauthorized full-history view.

| Field | Status |
|---|---|
| Reconciliation | **Design note only** — no dedicated welcome-back surface found as finished journey UI; Pass-expiry still wins |
| Status | Demo/fictional journey still **MISSING / PARTIAL** for Returning STOMPER polish |

### D4 — CREW navigation: NO NEW YOU LINK

**Locked text:** Keep personal identity/profile via existing Profile/Home route. Do **not** add redundant You destination inside CREW. Preserve approved five-tab nav and CrewLink behavior.

| Field | Status |
|---|---|
| Reconciliation | **CONFIRMED** on tip — `PRIMARY_TABS` = Home · Map · Music · Stats · Crew; CrewLink Invite SHA pin intact; `greet.tsx` / CrewLink **unmodified** by this PR |
| Evidence | `gb-phone/src/components/stomp/alpine-chrome.tsx`; `tests/woz/greet-invite-sha.ts` (`CREWLINK_SHA`); `evidence/GATE-AND-RETENTION-SNAPSHOT.md` |

### D5 — Founder's Edition board: ALL EARLY REGISTERED RIDERS

**Locked text:** Gold Founder's Edition for every qualifying early registered STOMPER (gold collectible identity styling, Founder recognition, original metallic silver collectible snowboard). No skill advantage. No separate paid upgrade. Not sold individually. Exact early-registration cutoff **NOT YET SPECIFIED** — configurable eligibility rule; cutoff flagged for owner approval. Preserve previously approved Founder entitlement-duration rules unless owner changes them. Do not reproduce real manufacturer trademarks / exact board artwork without permission.

| Field | Status |
|---|---|
| Reconciliation | **OPTIONS ONLY** — see `FOUNDER-ELIGIBILITY-OPTIONS.md`; founder clock stub exists (`founderClock` — deadline null / policy unresolved) |
| Not a paid SKU | Confirmed in lock language |

### D6 — Crew portrait names: FIRST NAMES ALLOWED

**Locked text:** Approved Riders and authorized Trip Viewers may see first names on Crew portrait. First names only; no surnames/private identity by default. Participant consent + age-aware permissions. No unauthorized participant identity. Safe fallback when avatar/name cannot be shared. Do **not** expose portrait publicly merely because a Viewer can access it.

| Field | Status |
|---|---|
| Reconciliation | **Behavior spec** in `CREW-PORTRAIT-PRIVACY.md` — product UI still partial; do not treat Viewer access as public |

### D7 — Grom: FICTIONAL PREVIEW ONLY

**Locked text:** Maintain existing Grom feature gate **DISABLED**. Fictional previews OK (simplified avatar, guardian permissions, family-linked identity, restricted sharing, youth-safe profile). **NO** live child enrollment, real youth data, unrestricted Squad messaging, Campfire, or production activation. Separate owner approval + legal/security review mandatory before live youth.

| Field | Status |
|---|---|
| Reconciliation | **VERIFIED DISABLED** — `AVATAR_FLAGS.gromFlowEnabled === false`; `YOUTH_CAMPFIRE_ENABLED === false`; see `GROM-GATE-VERIFICATION.md` |

---

## Also preserved (prior audits / G1–G4)

- **G1–G4** (t1166u / `#17`): Day Sesh media ≤45d; Squad rejoin / owner succession / account deletion logical revoke — see `docs/core-completion-t1165u/G1-G4-POLICY-LOCK.md`.
- Five-tab + Crew Invite lock language from prior audits — still in force.
- Prior integration package: `docs/integration-readiness-t1206u/` (extend, do not wholesale rewrite).
