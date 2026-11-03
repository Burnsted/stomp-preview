# FILE-DIFF-MATRIX — t1163u / t1164u

**ZIP:** `STOMP-RIDER-SOURCE-HANDOFF` · sha256 `d89849228a1c6c257331782e018dd2c5c8c374362b115d04b3b7d4b0f4f4afe4`  
**Compare base tip:** #17 prior tip `b51691d9614a18e5c48122c7712b81df06fac534` (`cursor/release-blocker-closure-t1159u`)  
**Protected tips consulted (unchanged):** #12 `78dc9f9…` · #13 `1e40eab…` · #14 `ec870fe5…` · #15 `16b61211…` · #16 `e737b380…`

Legend: **KEEP-EXISTING** · **CHERRY-PICK** · **ADAPT** · **CONFLICT** · **SKIP** · **ADDED**

---

## ADDED (4)

| ZIP path | Landing path | Class | Tip SHAs compared | Notes |
|---|---|---|---|---|
| `src/lib/stomp/social.ts` | `gb-phone/src/lib/stomp/social.ts` | **ADDED** | missing on #12–#17 tips | Landed verbatim. Demo-only; `SHARE_MS=20_000`. |
| `src/lib/stomp/social-store.ts` | `gb-phone/src/lib/stomp/social-store.ts` | **ADDED** | missing | Landed verbatim. Zustand wrapper. |
| `src/lib/stomp/social.test.ts` | `gb-phone/src/lib/stomp/social.test.ts` | **ADDED** | missing | Landed verbatim. node:test. |
| `src/components/stomp/rider-hub.tsx` | `gb-phone/src/components/stomp/rider-hub.tsx` | **ADDED** | missing | Landed verbatim. Not a Home replacement. |

## MODIFIED (8) — cherry-pick only

| ZIP path | On-box counterpart | Class | Tip SHAs | Decision |
|---|---|---|---|---|
| `src/lib/stomp/store.ts` | `gb-phone/src/lib/stomp/store.ts` | **CHERRY-PICK** | #17 tip vs ZIP | Add `"hub"` to `Screen` only. KEEP Woz alpine screens (`woz`, avatar*, `favorites`, etc.). SKIP GB powder/conditions/favs rewrite. |
| `src/lib/stomp/session-voice.ts` | same | **CHERRY-PICK** | #17 vs ZIP | Add `social`/`message` on `SessionAct`; social phrase routes; campfire→`hub`. KEEP `SESSION_CONFIRM`, music-sources Tesla path. SKIP GB audio-mix rewrite. |
| `src/components/stomp/session-mic.tsx` | same | **CHERRY-PICK** | #17 vs ZIP | `useSocial` in `apply()` only. KEEP hold-to-talk mic UI + music-sources. SKIP GB SessionEar wholesale. |
| `src/components/stomp/app.tsx` | same | **CHERRY-PICK** | #17 vs ZIP | Import + mount `<RiderHub />` when `screen==="hub"`. KEEP greet/Crew Invite/avatar screens. |
| `src/components/stomp/stompers.tsx` | same | **CHERRY-PICK** | #17 vs ZIP | Add “Open campfire” → `setScreen("hub")`. KEEP vibe/meetup/WozEntry. |
| `src/components/stomp/bag.tsx` | `bag-of-tricks.tsx` (no `bag.tsx`) | **ADAPT** | #17 vs ZIP | Note: self-reported vs confirmed → `HubMyBag`. SKIP wholesale bag.tsx. |
| `src/components/stomp/mountain-home.tsx` | `home.tsx` (+ `home-mountain.ts` lib) | **ADAPT** | #17 vs ZIP | One “Rider” text control → `hub`. KEEP Home composition / five-tab. SKIP GB mountain-home layout. |
| `package.json` | `gb-phone/package.json` | **CHERRY-PICK** | #17 vs ZIP | Append `social.test.ts` to `test` script. KEEP woz vitest scripts / Pages scripts. SKIP GB dep pruning. |

## Extra ADAPT (nav chrome)

| Path | Class | Notes |
|---|---|---|
| `alpine-chrome.tsx` `tabForScreen` | **ADAPT** | Map `hub` → crew tab highlight so five-tab nav stays coherent. Not in ZIP. |

## DO NOT TOUCH

| Path | Class | Evidence |
|---|---|---|
| `greet.tsx` / Crew Invite | **KEEP-EXISTING / SKIP** | Not in ZIP. sha256 `12c006f0…859` unchanged. |
| `public/og.jpg` / root `og.jpg` | **SKIP** | Not in ZIP. Branding lane. |
| Woz tips #12–#16 | **SKIP** | Protected; reconfirmed byte-identical. |
| Wholesale replace of any of the 8 MODIFIED | **CONFLICT** if attempted | Trees diverge (alpine vs GB powder). |

## Classification counts

| Class | Count |
|---|---|
| ADDED landed | 4 |
| CHERRY-PICK applied | 6 (store, voice, mic, app, stompers, package.json) |
| ADAPT applied | 3 (bag→bag-of-tricks, mountain-home→home, alpine hub tab) |
| CONFLICT resolved by not wholesale-replacing | 8 MODIFIED trees |
| SKIP / KEEP | greet, og.jpg, #12–#16 tips, GB-only powder/conditions |
