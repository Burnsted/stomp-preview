# Stability — t1210u

## Crash paths hardened

1. **`ScreenErrorBoundary`** wraps active screens in `StompApp`. A single screen throw shows recovery UI with **Back to Home** and **Reset Demo** — chrome/nav survive.
2. **`AppErrorComponent`** (router default) adds Reload + Back to Home + Reset Demo tip.
3. **Persist merge allowlist** — unknown/stale `screen` ids fall back to `greet`; non-array landings/clips/stashes/crew/studied fall back to defaults.
4. **`createSafeJSONStorage`** — localStorage probe + memory fallback; get/set never throw into the render path.
5. **Avatar rider slice writes** — quota/private-mode caught; memory fallback.
6. **Corrupt JSON** — `safeParseJson` returns fallback (feedback + storage helpers).

## Five-tab nav

Verified unchanged: Home · Map · Music · Stats · Crew (`PRIMARY_TABS`).  
Explore Demo + Feedback highlight Home. Bag stays a feature surface (no tab highlight).

## Key screens (open paths)

| Screen | How |
|---|---|
| Avatar Creation | Home **Create STOMPER** or Explore → Create |
| Profile / Boards / Squad / Trip | Explore → Profile/Trip/Squad/Boards → RiderHub panels |
| Bag of Tricks | Explore → Bag or Home bag tiles |
| Trip Hub | STOMPER ID → Trip Hub |
| Sesh demo | Explore → Sesh / Home SESSION |
| Crew tab | Bottom nav Crew |

## Reset Demo

- Home: **Reset Demo** button (confirm).
- Explore Demo card.
- RiderHub footer control.
- Clears known `stomp-*` keys + playtest prefixes, reseeds family social, resets avatar, returns Home.

## Simulated labels

Small uppercase badges (`Simulated`, `Local only`, `Family playtest`, `Demo`) — honest, not cluttered cards.
