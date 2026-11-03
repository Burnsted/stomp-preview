# GROK-BUILD-CONTRACT-MAP — t1159u / t1160u · updated t1163u/t1164u

**STATUS: HELD paste policy unchanged — do NOT paste contract methods into live GB shell beyond the verified selective Rider fold.**  
**t1163u/t1164u:** Rider source ZIP verified (`d8984922…afe4`); ADDED `social.*` + `rider-hub.tsx` + surgical MODIFIED hunks landed on throwaway tip only (compare-don’t-rebuild).  
**Branding sync:** orange accent · Hands-Free retired · Core Sesh artwork · Home / five-tab nav / Crew Invite **preserved**.

---

## 0. Capability labels

| Label | Meaning |
|---|---|
| **IMPLEMENTED (fictional)** | batch1 pure TS + vitest; not production security |
| **IMPLEMENTED (preview)** | gb-phone UI on box; local/demo |
| **MOCK/FICTIONAL** | Stub / bridge / SPEC only |
| **GB source verified (t1163u)** | ZIP sha256 `d8984922…afe4`; selective fold on throwaway tip |
| **NOT IMPLEMENTED / HELD** | Needs Ted Go + separate unfreeze |

---

## 1. batch1 export surface (this tip)

Namespace exports from `batch1/src/index.ts`:

| Namespace | Source | Role |
|---|---|---|
| `trips` | `#13` Trip Drop | lifecycle, Pass, Viewer, extensions, retention, display |
| `daysesh` | `#13` Day Sesh | plan/join/close, Pass-only, Campfire-safe |
| `campfireCf2` | `#14` + `#16` SV-0 | Squad Campfire, Quick Share, retention, safety, PendingStore |
| `shared` | `#15` A1–A7 | ids, tripToEndAnchor, daySeshToStub, guardResult, participationFacts, ageBandSpec (A7 SPEC) |

Also legacy: stompers, crew stubs, session voice registry, `core`/`media`/`smartId`, etc.

### campfireCf2 key modules

`policy` · `trip-shim` · `guards` · `retention` · `media-link` · `share` · `safety` · `erasure` · `sesh-voice` · `sesh-pending` · `sesh-recheck` · `sesh-character` · `daysesh-boundary` · `gb-contract` · `world`

### GB_CAMPFIRE_CONTRACT_METHODS (type/docs only — HELD)

`listMyCampfires` · `readCampfire` · `postMessage` · `react` · `prepareShare` · `confirmShare` · `cancelShare` · `fileReport` · `renderForViewer` · `revealCollapsed` · `deleteOwnMessage` · `leaveSquad` · `block` · `unblock`

Exclusions: auth, live_data, push, upload, moderation_execution, legal_hold, deletion_jobs, youth, capture_studio, kiosks, other_sports, new_nav.

---

## 2. Required request/response fields (fictional contracts)

### Quick Share / SV-0

| Step | Request fields | Success | Deny |
|---|---|---|---|
| `beginQuickShare` | `intentId`, `actorId`, `mediaRefId`, `squadIds[]` (len=1) | intent `previewing` | `multi_recipient`, `not_found` |
| `confirmShare` / `confirmQuickShare` | intent + optional `recheck{actor,memberships,assets,nowIso,sessionUnlocked}` | `confirmed` (+ post link) | `not_member`, `session_locked`, `expired`, `media_deleted`, `needs_confirm` |
| `PendingStore.prepare` | `pendingId`, `actorId`, `kind`, `squadId`, `contentHash`, `mediaRefId?`, `readbackText`, `ttlMs` (default 20000) | `prepared` | multi rejected at call site |
| `claimPendingConfirmation` | `pendingId`, `actorId`, `channel: voice\|tap`, `sessionUnlocked?` | `confirmed` once | `already_handled`, `expired`, `session_locked`, `wrong_actor` |
| Voice phrases | Yes, approve / Yes, confirm / Sesh, approve it · Cancel / No, cancel | CAS claim | idle → no action |
| Character | Ready/Listening · Working · **Done only on delivered** | — | — |

### Trip Drop / Pass / Viewer

| API | Key fields | Deny reasons (GuardReason) |
|---|---|---|
| `canJoinAsRider` | stomperId, trip, passes, atIso | `pass_inactive`, `trip_not_active` |
| `hasRiderAccessAt` | membership, trip, passes, atIso | false after participationEndsAt / no pass+grace |
| `canDownloadViewer` | viewer.downloadUntilIso, revokedAtIso, atIso | `viewer_download_denied` |
| `approveExtension` | actor host/cohost, revisedEndAt, clock | host/pass/finalized guards |
| `applyPassLapseToMembership` | freezes `graceUntilAt = scheduledEndAt` | — |

### Day Sesh

| API | Notes |
|---|---|
| `joinDaySesh` | Pass required; source `squad` \| `temporary_friend` |
| `closeDaySesh` | `campfireEffects: []` always |
| Media deadline | `{ flag: "DEADLINE_UNSPECIFIED", deadlineAt: null }` |

### Campfire safety / retention

| API | Notes |
|---|---|
| Text | 12 months from `createdAt` |
| Standalone media | 90 days from upload |
| Trip media | ≤45d via MediaRef / trip-shim; **never extends** |
| Soft hide | lazy read-time; `assertNoDeletionJob().enabled === false` |
| Block | blocker-only collapse + reveal; invite → `silently_denied` |
| Report | `state: queued`, `route: stomp_moderation`; does not pause retention |
| Delete | author-only |

---

## 3. Permission + error states (summary)

| Domain | Allow when | Deny when |
|---|---|---|
| Campfire access | active Squad membership + non-youth/erased | `not_member`, `youth_disabled`, `account_erased` |
| Quick Share | exactly one Squad + member + unlocked + live media | multi / not_member / locked / expired media / dup confirm |
| Trip rider | active Pass or grace on **existing** membership | new join without Pass; after grace; inactive trip |
| Viewer download | finalized deadline ≥ now; not revoked | projected-only; past deadline; revoked |
| Day Sesh | active Pass; not closed | Trip grace alone; closed/expired |
| A7 age band | SPEC map grom→youth | Must **not** enable Campfire |

---

## 4. Missing integrations (vs GB shell)

| Gap | Label |
|---|---|
| Wire CF-2/SV-0 into gb-phone UI | HELD |
| Rider Hub / social.ts / social-store | **GB source verified** — landed selective on throwaway; DEMO ONLY; server authz still missing |
| Server authz for all table rows above | NOT IMPLEMENTED |
| Youth enrollment | HELD (A7 SPEC) |
| Deletion jobs / live moderation | HELD |
| Capture Studio / other sports / kiosks / Arcade | OUT OF SCOPE |

---

## 5. Exact frontend handoff instructions

1. **Do not** replace Home or five-tab nav (`HOME | MAP | MUSIC | STATS | CREW`).  
2. **Do not** remove Crew Invite (`greet.tsx` / CrewLink / post-ID invite).  
3. Consume batch1 via existing woz-bridge patterns; prefer namespaced `campfireCf2` + `shared` + `trips` + `daysesh`.  
4. Quick Share UI must call **one** Squad + explicit confirm; voice uses shared `pendingId` CAS.  
5. Map DenyReason → user copy; never treat client-only checks as security.  
6. Media expiry labels: show Trip ≤45d / standalone 90d / text 12mo; Day Sesh unspecified — do not invent dates.  
7. Branding: orange; no Hands-Free tagline revival; Core Sesh artwork.  
8. After Ted transfers Rider files: **compare-don’t-rebuild** against this map; reuse UI that matches; adapt mismatches; do not fork parallel authz.

### t1163u verified compare (done on throwaway)

| GB file | Action taken | Residual |
|---|---|---|
| `social.ts` / `social-store.ts` / `social.test.ts` | **ADDED** at gb-phone paths | Client demo ≠ server authz |
| `rider-hub.tsx` | **ADDED**; mount via Screen `"hub"` | Not a Home replacement |
| store / session-voice / session-mic / app / stompers / package.json | **CHERRY-PICK** surgical hunks | No wholesale replace |
| bag.tsx / mountain-home.tsx | **ADAPT** → bag-of-tricks / home | One note + one Rider control |
| greet.tsx / og.jpg | **SKIP** | Untouched |

Full matrix: `docs/rider-source-compare-t1163u/FILE-DIFF-MATRIX.md`.

---

## 6. MOCK/FICTIONAL vs IMPLEMENTED PRODUCTION

| Capability | Label |
|---|---|
| Trip/Day Sesh/Campfire/SV-0 policy engines in batch1 | **IMPLEMENTED (fictional)** |
| AF-XINT / AF-RC / AF-SV tests | **IMPLEMENTED (fictional)** |
| gb-phone five-tab Home + Crew Invite + Avatar QR | **IMPLEMENTED (preview)** |
| woz-bridge Campfire local dump | **MOCK/FICTIONAL** |
| native OS share sheet | **IMPLEMENTED (preview)** ≠ Squad Quick Share |
| GB Rider Hub demo (phone) | **IMPLEMENTED (preview)** on throwaway tip · DEMO ONLY · source verified t1163u |
| Server Pass/Viewer/Squad/share authz | **NOT IMPLEMENTED** |
| Payments / live accounts / Pages prod publish | **NOT IMPLEMENTED / FORBIDDEN here** |
| A7 youth | **MOCK/FICTIONAL SPEC-only** |

---

## Copy-ready bridge blurb (HELD)

```
GROK BUILD INTERFACE BRIDGE — Release-blocker closure (t1159u/t1160u) + Rider fold (t1163u/t1164u)
Branch: cursor/release-blocker-closure-t1159u
STATUS: HELD paste for contract methods; Rider ZIP verified; selective fold on throwaway only. NO merge/deploy.

1. Exports: trips + daysesh + campfireCf2 (+ SV-0) + shared (A1–A6; A7 SPEC).
2. CONFLICT-1/2 closed fictionally; AF-RC-01..10 success+deny matrix green.
3. Preserve Home, five-tab nav, Crew Invite. Orange branding; Hands-Free retired.
4. GB Rider source VERIFIED (sha256 d8984922…afe4) — ADDED social.* + rider-hub; surgical MODIFIED; no wholesale.
5. Client Rider/Viewer limits are DEMO ONLY — server authz required for release.
6. Do NOT implement: youth enable, payments, deletion jobs, Capture Studio, deploy.
```
