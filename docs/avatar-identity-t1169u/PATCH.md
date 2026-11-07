# PATCH — Avatar identity correction (t1169u)

**Owner decision:** Ted Burns · starters are appearance templates, not named personalities.  
**Branch:** `cursor/avatar-identity-looks-t1169u` (from `cursor/release-blocker-closure-t1159u` tip).  
**Scope:** Avatar Foundation only. No payments / youth social activation / deletion jobs / SV-0 reopen.

## Product lock

Starter characters (Nova, Mira, Kai, Aria, …) are **look templates**. Their internal `.label` must never be silently assigned as a rider’s STOMPER `displayName`.

## Files changed

| File | Before | After |
|---|---|---|
| `gb-phone/src/lib/stomp/avatar/identity.ts` | *(new)* | `isValidStomperDisplayName`, `lookOrdinalLabel` |
| `gb-phone/src/lib/stomp/avatar/store.ts` | `selectStarter` set `displayName: draft \|\| s.label`; `commitOnboarding` used `trim() \|\| s.label` | Preserve entered name on look change; commit requires valid name (returns `null` if empty/whitespace) |
| `gb-phone/src/lib/stomp/avatar/starters.ts` | `configFromStarter` defaulted `displayName` to `s.label` | Defaults to `""`; callers must supply a rider name (or look ordinal for preview-only) |
| `gb-phone/src/components/stomp/avatar/avatar-onboard.tsx` | Starter cards showed personality labels (Nova/…); draft preview fell back to `s.label`; reveal always enabled | Cards show **Look N of M**; no starter-label fallback; reveal disabled until name valid |
| `gb-phone/src/components/stomp/avatar/grom-onboard.tsx` | Same label fallbacks + personality captions | Look ordinals + name required before finish |
| `gb-phone/tests/woz/update02/avatar-foundation.test.tsx` | Happy-path onboard only | + t1169u regression block |
| `docs/avatar-identity-t1169u/*` | — | PATCH / VALIDATION-GAPS / TEST-MATRIX |

## Behavior summary

1. **Selecting / changing a look** updates appearance (`starterId`, layers, style hint) only — never overwrites a user-entered `displayName`.
2. **Commit / reveal** requires a non-empty trimmed STOMPER display name. Empty or whitespace-only → blocked (`commitOnboarding` → `null`; UI button disabled).
3. **Selector UI** shows ordinal look copy (`Look 1 of 12` adults / `Look 1 of 6` grom), not Nova/Mira/Kai as the rider name.
4. **Starter IDs** (`f-nova`, `m-kai`, …) and appearance payloads remain stable for compatibility.
5. Protected preview surfaces (STOMPER-first entry, Home, five-tab nav, Crew Invite, Grom flag-off, greet / branding) untouched.

## Compatibility notes

- Internal `StarterDef.label` strings remain in data for distinctness / tooling; they are **not** rider identity.
- Preview `AvatarRenderer` configs may use look-ordinal strings for `aria-label` only — not persisted as committed identity unless the user typed that string.
