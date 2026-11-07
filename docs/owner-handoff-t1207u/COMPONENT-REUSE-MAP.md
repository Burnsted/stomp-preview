# Component reuse map — Grok Build Nov 4 Rider Design → existing files · t1207u

**Tip inspected:** `#39` ancestry via `#43` base `59344235…` / `#39` `7ee43f46…`.  
Approved design structure preserved as product direction; map shows **reuse candidates**, not “already complete.”

Slot labels only: Woman 1/2/3, Man 1/2/3, Grom 1/2.

---

## Screen → existing components

| Grok Build Nov 4 screen | Reuse from | Reuse level | Gaps vs approved design |
|---|---|---|---|
| **STOMPER Profile** (card-focused; clips first; Squad second; Boards third; Bag badge by name; revocable QR STOMPER ID; no followers/@handles/blue checks) | `avatar-home-dock.tsx`, `stomper-id.tsx`, `avatar-locker.tsx`, `avatar-renderer.tsx`, `bag-of-tricks.tsx`, `home.tsx`, clips via local/woz stores | **Partial** | Clips-first Profile as primary identity surface incomplete; My Boards unclear; Bag badge placement polish open |
| **Squad Quick Share** (one unified sheet; Connections/Squad/Trip Drop separate permissions; photos/clips/music/updates; explicit recipients; native share ≠ delivery proof) | `gb-phone/src/lib/stomp/woz-bridge/cf2-share.ts`, `batch1/src/campfire/share.ts`, `sesh-pending.ts`, `native-share.ts`, playlist sheet patterns | **Demo-only / fictional** | Unified sheet UI not finished product; live transport absent; confirm/recheck contracts exist in tests |
| **Trip Drop** (countdown, Today's Drop, Replay, minimal community board; Rider/Viewer separate; consent-safe Crew portrait; no paid AI generation) | `avatar/trip-hub.tsx` + `lib/.../trip-hub.ts`, `batch1/src/trips/*`, `daysesh/*`, Rider Hub pass role | **Demo-only / fictional** (+ Partial UI) | Replay + personal Report Card missing as finished journey screens; D6 portrait not productized; `aiTripPhotoEnabled=false` |
| **Sesh** (keep name **Sesh**; voice+touch same permission checks; preview + affirmative confirm; offline / mic-denied / ambiguous-recipient / a11y) | `session.tsx`, `session-mic.tsx`, `batch1/.../sesh-voice.ts`, `sesh-pending.ts`, `sesh-recheck.ts`, `sesh-character.ts`, confirm-bar patterns | **Demo-only / fictional** | SV-0 folded into `#17`; 20s TTL; real-device UX proof NOT RUN |
| **Returning STOMPER** (90-day inactivity; Active-Pass-aware; correctable tricks; personal Report Card; secure export before deletion; no perpetual free profile) | Pass flags in `social.ts` / Rider Hub; Bag self-report marks; fictionalAuthz export denials; G1–G4 erasure docs | **Missing / Partial** | No dedicated welcome-back surface; D2 12mo export state model not coded (still 6mo archive constant); Report Card unfinished |

---

## Shared chrome (must preserve — D4)

| Piece | Path | Lock |
|---|---|---|
| Five-tab nav | `alpine-chrome.tsx` `PRIMARY_TABS` | Home · Map · Music · Stats · Crew — **no new CREW You link** |
| Profile / Home identity | `home.tsx` + avatar dock / onboard | Identity route stays Profile/Home |
| CrewLink Invite | `greet.tsx` → `CrewLink` | **Do not edit**; SHA pin `CREWLINK_SHA` |
| Grom gate | `avatar/flags.ts` | Stay **false** |

---

## Cross-ref

Journey honesty table: `../integration-readiness-t1206u/RIDER-JOURNEY-AUDIT.md` (extend; D2/D3 updates called out in this package’s readiness report).
