# TEST-MATRIX snippet — t1169u avatar identity

Suite: `gb-phone/tests/woz/update02/avatar-foundation.test.tsx`  
Command: `npm run test:woz -- tests/woz/update02/avatar-foundation.test.tsx` (from `gb-phone/`)

| ID | Case | Expected | Result |
|---|---|---|---|
| ID-01 | Empty displayName → `commitOnboarding` | returns `null`; no config; not complete | covered |
| ID-02 | Whitespace-only displayName → commit | returns `null` | covered |
| ID-03 | Enter name, change starter look | `displayName` unchanged; `starterId` updates | covered |
| ID-04 | Commit then locker equip / style switch | saved `displayName` persists | covered |
| ID-05 | Returning rider re-selects look | keeps saved name; not re-labeled to starter `.label` | covered |
| ID-06 | `configFromStarter` without displayName | `displayName === ""` (not Nova/…) | covered |
| ID-07 | Selector UI ordinals | Shows `Look N of M`; no Nova/Kai captions | covered (happy-path + labels) |
| ID-08 | Full adult onboard with chosen name | Completes as `NovaRide` (user-typed) | covered (existing + extended) |

Regression: Bag / five-tab nav / CrewLink / Grom flag-off remain in same suite (Update02 regression block).
