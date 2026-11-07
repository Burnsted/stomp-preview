# Pass retention — 12-month state model (D2) · t1207u

**Authority:** Owner D2 (Nov 4, 2026) — **supersedes** prior six-month Pass / Rider Archive recommendation.  
**Status:** Product-direction state model + constant proposal. **Not** production deletion-job activation.

---

## Conflict with prior tree (honest)

| Prior assumption | Where it lives today | D2 lock |
|---|---|---|
| Rider Archive **6 months** from Pass end | `batch1/src/trips/retention.ts` → `RIDER_ARCHIVE_MONTHS = 6`, kind `pass_archive_6mo` | **SUPERSEDED** → **12 months** export-only |
| Archive clock **restarts** on renewal | `restartArchiveOnRenewal(...)` in same file | Must **not** silently restore **deleted** information after renewal (D2). Renewal may grant a **new Active** window; purged history stays purged |
| Master HQ Update 03 / Overnight feasibility | Six-month Pass controlling Rider Story (bot attachment / older direction) | **Override** — use D2 |
| G1 Day Sesh media ≤45d | `DAY_SESH_MEDIA_MAX_DAYS=45` / `lifecycle-g1g4.ts` | **UNCHANGED** — media clock ≠ account retention |
| Campfire text 12mo / standalone media 90d | CF-2 policy | **Unchanged** (separate from Pass export-only) |
| Trip Viewer / trip media ≤45d from official end | `VIEWER_MEDIA_MAX_DAYS` | **Separate** approved limits |

---

## State machine (account / Pass access)

```
                    ┌──────────────────────────────┐
                    │ ACTIVE                       │
                    │ Full authorized STOMPER      │
                    │ access (Pass valid)          │
                    └──────────────┬───────────────┘
                                   │ Pass expires
                                   ▼
                    ┌──────────────────────────────┐
                    │ EXPIRED / LOCKED             │
                    │ Full profile/history locked  │
                    │ No new join/post/share       │
                    └──────────────┬───────────────┘
                                   │ enter export-only window
                                   ▼
                    ┌──────────────────────────────┐
                    │ EXPORT-ONLY (12 months)      │
                    │ Personal Report Card +       │
                    │ export/offload of owned data │
                    │ without new purchase         │
                    │ NOT full-history browse      │
                    └──────────────┬───────────────┘
                                   │ window ends + warnings
                                   ▼
                    ┌──────────────────────────────┐
                    │ DELETION LIFECYCLE           │
                    │ Warnings → legal retention   │
                    │ carve-outs → operational     │
                    │ safeguards → erase (jobs OFF │
                    │ until separate Go)           │
                    └──────────────────────────────┘
```

### Renewal rules

- Renewal while **EXPORT-ONLY** or **EXPIRED/LOCKED** restores **ACTIVE** access going forward.  
- Does **not** silently resurrect content already deleted / purged under the deletion lifecycle.  
- Does **not** invent Trip Drop physical attendance from digital records alone (also D3).

### Welcome-back (D3) interaction

- ≥90 days inactive welcome-back may fire for **ACTIVE** Pass users only for full personalized history.  
- **Pass-expiry wins:** expired users see limited-access / export experience — welcome-back must **not** unlock unauthorized full-history view.

---

## Media vs account retention (call out)

| Clock | Duration / rule | Constant / location today | Notes |
|---|---|---|---|
| **Account / Pass export-only** | **12 months** after Pass expiration (D2) | Propose `PASS_EXPORT_ONLY_MONTHS` (below) — **replace** 6mo archive semantics | Product access window |
| Day Sesh hosted media | ≤**45 days** after official Day Sesh end (G1) | `DAY_SESH_MEDIA_MAX_DAYS` | Max, not guaranteed access; Campfire share never extends |
| Trip Drop media / Viewer download | ≤**45 days** from trip official end | `VIEWER_MEDIA_MAX_DAYS` | Separate from Pass export-only |
| Campfire text | 12 months from message `createdAt` | CF-2 policy | Unchanged |
| Campfire standalone media | 90 days from upload | CF-2 policy | Unchanged |

---

## Proposed configurable policy constant

**Name:** `PASS_EXPORT_ONLY_MONTHS`  
**Value:** `12`  
**Home (when implementation Go):** single policy module (prefer `batch1` policy / retention alongside G1 constants — **not** scattered literals).  
**Companion kinds (naming suggestion):** `pass_export_only_12mo` replacing product meaning of `pass_archive_6mo` after authorized code batch (this PR is docs-only).

Related flags that stay **off** until separate Go:

- Physical deletion jobs  
- Production authz (`#22` packet sibling — restack as draft only)

---

## Fictional / demo status today

Pass expiry + export denial paths exist as **FICTIONAL-ONLY** (`fictionalAuthz`, Rider Hub `passExpired` demo, G1–G4 tests). Live wipe / legal confirm **OPEN**. See t1206u journey step 12.
