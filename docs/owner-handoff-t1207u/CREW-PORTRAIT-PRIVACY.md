# Crew portrait privacy vs D6 · t1207u

**Locked (D6):** Approved Riders and authorized Trip Viewers may see **first names** on Crew portrait. First names only; no surnames / private identity by default. Participant consent + age-aware permissions. Safe fallback when avatar/name cannot be shared. Do **not** expose portrait publicly merely because a Viewer can access it.

---

## Intended behavior (product direction)

| Actor | May see | Must not |
|---|---|---|
| Approved Trip / Squad **Rider** (adult, consented peer) | First name + permitted avatar portrait | Surname, private contact, unauthorized youth identity |
| Authorized **Trip Viewer** | First name + portrait **only if** participant consent + age rules allow for that trip context | Treat Viewer access as “public”; Squad Campfire identity; unrestricted share-out |
| Public / unauthenticated / unrelated STOMPER | Safe fallback only (silhouette / “STOMPER” / no name) | Portrait or first name |
| Youth / Grom participant | **Fail closed** while D7 gate disabled — fictional preview may mock guardian-gated labels; no live youth identity | Live child enrollment data |

### Safe fallback (when share denied)

- Neutral silhouette or gear-only plate  
- Label: `STOMPER` or slot look label (Woman/Man/Grom N in staff tools) — **never** invent a personal display name  
- No surname; no “guessed” first name from email/handle

### Consent + age-aware

- Adult: explicit portrait/first-name share preference (default conservative until set).  
- Youth: requires guardian permission path — **not activated** while `gromFlowEnabled=false` / `YOUTH_CAMPFIRE_ENABLED=false`.  
- Revocation: removing consent immediately stops new renders; cached Viewer clients must recheck (same spirit as SV-0 recheck / fictionalAuthz).

### Viewer ≠ public

Trip Viewer authorization is a **scoped** grant for that Trip Drop. Portrait visibility under D6 remains **participant-consent gated**. Export, screenshots, and native share must not widen to public CDN without a separate share action + confirm.

---

## Current implementation honesty

| Area | Status |
|---|---|
| Crew list / CrewLink Invite | **PRESENT** (local invite) — `greet.tsx` `CrewLink` locked; **do not edit** |
| Rider Hub social demo | **PARTIAL / DEMO** — `rider-hub.tsx` / `social.ts` use display names in fiction; not a finished consent-aware portrait product |
| Trip Crew portrait UI | **MISSING / PARTIAL** as a dedicated consent-safe portrait strip matching Grok Build Nov 4 Trip Drop direction |
| Server enforcement | **NOT activated** — `#22` security packet sibling |

This PR documents D6 only — no CrewLink / greet edits.
