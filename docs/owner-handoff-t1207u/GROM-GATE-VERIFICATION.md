# Grom gate verification (D7) · t1207u

**Required:** Grom feature gate remains **DISABLED**. Fictional preview only. No live youth enrollment / real youth data / unrestricted Squad messaging / Campfire / production activation.

---

## Proof on tip `59344235…` (ancestry includes `#39` / `#17`)

| Flag / gate | Path | Value |
|---|---|---|
| `AVATAR_FLAGS.gromFlowEnabled` | `gb-phone/src/lib/stomp/avatar/flags.ts` | **`false`** |
| `isAvatarFlagOn("gromFlowEnabled")` | same + `store.ts` | returns false → grom starters empty for product flow; selectStarter blocks grom |
| `canUseGromFlow` | `gb-phone/src/lib/stomp/avatar/store.ts` | wired to flag — off |
| Grom onboard UI | `gb-phone/src/components/stomp/avatar/grom-onboard.tsx` | Exists for **local/fictional** use; early-return when flag off |
| `YOUTH_CAMPFIRE_ENABLED` | `batch1/src/campfire/policy.ts` | **`false`** |
| Youth authz | `batch1/src/shared/fictionalAuthz.ts` · `guards.ts` | Deny while youth disabled |
| Hardening assert | `gb-phone/src/lib/stomp/avatar/batch-d-hardening.ts` | Throws if `gromFlowEnabled !== false` |
| Tests | `gb-phone/tests/woz/update02/*` · `batch1` AF-RC / AF-AUTH | Assert flag false |

Snapshot excerpt: [evidence/GATE-AND-RETENTION-SNAPSHOT.md](./evidence/GATE-AND-RETENTION-SNAPSHOT.md).

---

## What fictional preview may show (still gated)

- Simplified avatar / roster masters for **Grom 1 / Grom 2** as **Look N of M** previews  
- Design notes for guardian permissions / family-linked identity / restricted sharing  

## What must stay off

- Live child enrollment  
- Real youth PII  
- Youth Campfire / unrestricted Squad messaging  
- Production activation without separate owner + legal/security Go  

**Android/iOS:** do **not** enable grom for device testing (`docs/multi-rider-t1205u/android-batch-e/CHECKLIST.md` precondition).
