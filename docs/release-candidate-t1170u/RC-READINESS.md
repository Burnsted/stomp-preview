# RC-READINESS — unified candidate status (t1170u)

**STATUS:** Fictional-data release candidate tip is **technically coherent** on throwaway branch.  
**NOT** production-ready. Client demo ≠ production authorization.

---

## Candidate composition

| Layer | On RC tip? | Source |
|---|---|---|
| Avatar / Alpine / Bag | Yes | #12 ancestry |
| Trip Drop + Day Sesh | Yes | #13 ancestry |
| A1–A6 adapters + shared barrel | Yes | #15 ancestry |
| CF-2 Campfire + SV-0 Sesh (20s) | Yes (selective fold) | #15/#17 content; #14/#16 tips still parallel for rebase |
| Rider Hub selective + fictionalAuthz | Yes | #17 |
| G1–G4 policy lock (fictional) | Yes | #17 · AF-G14 |
| Avatar identity looks ≠ names | Yes | #18 · verified t1170u |
| RC journey + authz denial extensions | Yes | this batch |
| Production server authz | **No** | packet only |
| Live accounts / payments / youth / Pages | **No / HELD** | hard ban |

---

## Preserve checklist (verified on tip)

| Surface | Status |
|---|---|
| STOMPER-first onboarding (`greet` default / rehydrate) | Preserved |
| Home + five tabs `HOME\|MAP\|MUSIC\|STATS\|CREW` | Preserved |
| Crew Invite | Preserved |
| Campfire / Trip Drop / Day Sesh / Sesh | Present (fictional) |
| G1–G4 policies | Locked fictionally; not reopened |
| `SHARE_MS` / `SESH_PENDING_TTL_MS` = 20_000 | Locked |
| greet / `og.jpg` branding | Untouched |
| Youth enrollment | Disabled (`YOUTH_CAMPFIRE_ENABLED=false`, `gromFlowEnabled=false`) |
| Starter looks ≠ STOMPER names | Verified (t1169u regressions + RC-AV) |

---

## Remaining integration conflicts (docs — no merges)

1. **#14 rebase onto main after #12/#13 land** — parallel CF-2 never saw alpine/trip trees; use #15/#17 barrel as merge oracle.
2. **#16 rebase onto rebased #14** — keep SV-0 closed; do not reopen.
3. **Selective #17 fold only** — adapters + lifecycle + AF tests; forbid wholesale tip merge into main.
4. **Duplicated policy risk** — prefer calling A1–A6 / `fictionalAuthz` over cherry-picking duplicate guards.
5. **Hotspots:** `batch1/src/index.ts`, `guardResult.ts`, `cf2-index.ts`, `gb-phone` Screen union (`hub` additive), `woz-bridge`, greet/og freeze.

---

## Readiness verdict

| Gate | Verdict |
|---|---|
| Fictional RC tip for demo / CI | **Ready** (this DRAFT PR) |
| Merge to main | **Blocked** — needs Merge-order Go |
| Production security | **Blocked** — see PROD-SECURITY-BLOCKERS |
| Artwork handoff to GB | **Spec ready** — no art generated |
| Actual-device acceptance | **Not claimed** — see TEST-RESULTS gaps |
