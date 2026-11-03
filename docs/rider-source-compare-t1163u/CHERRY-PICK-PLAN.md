# CHERRY-PICK-PLAN — exact hunks for 8 MODIFIED (+ alpine ADAPT)

Throwaway branch only. No wholesale file replace.

---

## 1. `store.ts` — Screen += `"hub"`

**KEEP-EXISTING:** full Woz Screen union (greet, home, favorites, offline, woz, avatar-*, trip-hub, grom-onboard, …).  
**CHERRY-PICK:**

```ts
| "bag"
| "hub"   // ← added
| "woz"
```

**SKIP:** GB `powder` / `favs` / `pindrop` / conditions types / Landing.trick.

---

## 2. `session-voice.ts` — social phrases; campfire→hub

**KEEP-EXISTING:** `SESSION_CONFIRM`, `musicSource` Tesla path, favorites/offline/bag routes.  
**CHERRY-PICK:**

1. Extend `SessionAct`:
   ```ts
   social?: "catchup" | "share" | "confirm" | "cancel" | "sessions" | "message";
   message?: string;
   ```
2. Before favorites/offline handlers, insert:
   - `^confirm( share| send)?$` → `{ social: "confirm", screen: "hub" }`
   - `^cancel share$` → `{ social: "cancel", screen: "hub" }`
   - `catch up|recent messages` → `{ social: "catchup", screen: "hub" }`
   - `upcoming|active session|what's coming|whats coming` → `{ social: "sessions", screen: "hub" }`
   - `message|tell north crew|the squad …` → `{ social: "message", message, screen: "hub" }`
   - `share (the|my)?(clip|photo|video|air)` → `{ social: "share", screen: "hub" }`
3. Change campfire/apres/après from `screen: "stompers"` to `screen: "hub"` (say: `"Campfire."`).

**SKIP:** GB audio-mix / sourceId / caught / SessionEar voice stack.

---

## 3. `session-mic.tsx` — useSocial in apply()

**KEEP-EXISTING:** hold-to-talk `SessionMic`, `useMusicSources`, quiet mode.  
**CHERRY-PICK:**

```ts
import { useSocial } from "@/lib/stomp/social-store";
// inside apply(), after routeSession:
// catchup / share / message / confirm / cancel / sessions → useSocial.getState()
// return { ...act, say }
```

**SKIP:** replace with GB `SessionEar` / `useSessionMix` / `useSources`.

---

## 4. `app.tsx` — RiderHub when hub

**KEEP-EXISTING:** Greet, CrewLink, Avatar*, five-tab chrome, WozLab.  
**CHERRY-PICK:**

```ts
import { RiderHub } from "@/components/stomp/rider-hub";
// …
{screen === "hub" ? <RiderHub /> : null}
```

---

## 5. `stompers.tsx` — Open campfire→hub

**KEEP-EXISTING:** Campfire tab vibe/meetup/tomorrow/WozEntry.  
**CHERRY-PICK:** button before “Drop today’s clips”:

```tsx
<button type="button" data-testid="open-campfire-hub" onClick={() => setScreen("hub")}>
  Open campfire
</button>
```

---

## 6. `bag.tsx` → ADAPT `bag-of-tricks.tsx`

**KEEP-EXISTING:** full Bag of Tricks alpine hub.  
**ADAPT:** append under `HubMyBag` recent section:

```tsx
<p data-testid="bag-self-reported-note">
  Marks here are self-reported on this phone. Confirmed clips stay on Rider history.
</p>
```

**SKIP:** land ZIP `bag.tsx` as new file.

---

## 7. `mountain-home.tsx` → ADAPT `home.tsx`

**KEEP-EXISTING:** Home hero, Start a run, 2×2 tiles, Crew tools.  
**ADAPT:** one text control after the grid:

```tsx
<button type="button" data-testid="home-rider-hub" onClick={() => setScreen("hub")}>
  Rider
</button>
```

**SKIP:** ZIP mountain-home layout / powder tiles.

---

## 8. `package.json` — test script

**KEEP-EXISTING:** Pages scripts, `test:woz`, vitest/jsdom deps.  
**CHERRY-PICK:** append `src/lib/stomp/social.test.ts` to the `node --experimental-strip-types --test …` list.  
**SKIP:** remove testing-library / vitest / `release-cycle.test.ts` (not present on box).

---

## Bonus ADAPT — `alpine-chrome.tsx`

Map `screen === "hub"` into crew tab highlight (`tabForScreen`) so BottomNav stays consistent. Not listed in ZIP; required for Screen union completeness without breaking five-tab.

---

## Explicit non-goals

- No greet.tsx overwrite  
- No og.jpg redesign  
- No SV-0 scope expansion  
- No server authz invention  
- No merge / Pages / payments / youth
