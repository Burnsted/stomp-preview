# TEST-RESULTS — t1170u RC tip

**Candidate:** `cursor/release-candidate-t1170u-8e36`  
**Fictional data only.** Client demo ≠ production authorization.

---

## Local runs (this batch)

### batch1 (vitest)

| Suite | Result |
|---|---|
| `af-auth-01-12` (incl. AF-AUTH-13..15) | **PASS** (15) |
| `af-rc-journey-t1170u` (RC-J01..J10) | **PASS** (10) |
| Full `npm test` | **PASS — 587 passed / 8 skipped (595)** |

### gb-phone (vitest woz)

| Suite | Result |
|---|---|
| `update02/rc-journey-t1170u` | **PASS** (5) |
| `update02/avatar-foundation` (incl. t1169u) | **PASS** (32) |
| Full `npm run test:woz` | **PASS — 891 passed (22 files)** |
| Stock `npm test` | **PASS — 66** |
| `npm run build` | **PASS** |

### Typecheck / build

| Check | Result |
|---|---|
| `batch1` `npm run typecheck` | **PASS** |
| `gb-phone` `npm run typecheck` + `typecheck:woz` | **PASS** |
| CI on DRAFT PR | Await both SUCCESS after push |

---

## Journey coverage map

| Journey | Test id | Result |
|---|---|---|
| First-time STOMPER → customize → user name → Home | RC-AV-01 | PASS |
| Returning STOMPER → Home (no re-onboard) | RC-AV-02 | PASS |
| Invite → Avatar → Preview → Explicit join | RC-J01 | PASS |
| Squad → Campfire → Confirmed share | RC-J02 | PASS |
| Day Sesh → Finish → Retention deadline | RC-J03 | PASS |
| Leave → Rejoin approval → Prospective history | RC-J04 | PASS |
| Ownership transfer + unresolved-owner safety | RC-J05 | PASS |
| Account deletion → logical revoke | RC-J06 | PASS |
| Rider Pass / Viewer entitlement expiration | RC-J07 | PASS |
| Sesh confirm / cancel / delivery outcomes | RC-J08 | PASS |
| Youth enrollment disabled | RC-J10 + RC-AV-03 | PASS |
| Looks ≠ names (no regression) | t1169u + RC-AV | PASS |
| SHARE_MS = 20s | AF-AUTH-11/15 · RC-J02 | PASS |
| Prior G1–G4 (AF-G14) | Not reopened; still on tip | Prior PASS |

---

## Android viewport assumptions

| Assumption | Value | Where |
|---|---|---|
| Phone CSS viewport used in GB smoke / design | **390 × 844** | `RC_ANDROID_VIEWPORT_CSS` · browser-smoke · design-ui |
| Unit / component tests | jsdom — **not** a device | woz vitest |
| Touch target / safe-area / notch | Not measured on hardware this batch | — |

---

## Missing actual-device acceptance (explicit)

The following are **NOT** claimed by this RC tip:

1. Physical Android phone render of onboard → Home → five tabs  
2. Real touch latency / scroll / keyboard for display-name entry  
3. WebP artwork composite performance on mid-tier Android GPU  
4. Networked share confirm within 20s on real radios  
5. Accessibility TalkBack / font-scale acceptance  
6. Production authz against staging credentials  
7. Media download revocation on real CDN tokens  

Track these as **owner-gated device acceptance** after Merge-order Go + artwork drop — not as fictional CI green.

---

## Failures

None on new RC suites at authoring time. If CI fails post-push, fix on candidate tip only — never rewrite #12–#16.
