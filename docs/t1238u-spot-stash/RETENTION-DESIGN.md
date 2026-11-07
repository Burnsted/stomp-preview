# t1238u — STOMP clip retention & purge design (issue #87)

**DRAFT / FICTIONAL PROTOTYPE ONLY · NO live deletion job · NO deploy**

Issue #87 supersedes #88 for Spot/Stash media: **every STOMP-hosted clip expires no later than seven days after initial server receipt/upload**, independently of Trip Drop length, session, Rider Pass, Viewer access, or Spot/Stash association.

## Binding TTL

| Field | Rule |
| --- | --- |
| `receivedAt` | Instant STOMP first receives / stages the clip |
| `expiresAt` | `receivedAt + 7 calendar days` (UTC) |
| Extensions | **None.** Trip/session/pass/viewer/Spot association must not mutate `expiresAt` |
| 20-day trip example | Day-1 clip expires day 8; day-2 clip expires day 9 — independent clocks |

Implementation: pure module `batch1/src/spot-stash/retention.ts` with injectable `Clock` (`fixedClock`). No `Date.now()` authority in tests.

## Access revoke vs physical purge

At `expiresAt` (lazy read-time in this prototype):

1. **Immediate product revoke** — `deliveryUrl = null`, `delivery = "expired"`, playback/feeds/replays/thumbnails/derived copies refuse serve (`assertPlayback` → denied). Spot Replay uses `spotReplayClips` (unexpired only).
2. **Physical purge (design only)** — controlled storage/CDN object deletion targeted within a **bounded SLA of ≤72 hours** after expiry. **Not enabled** in this preview (`liveDeletionJobEnabled: false`).
3. **Immutable backups** — may retain ciphertext until natural rotation. Policy **discloses** this lag and **never** represents backups as playable or as a recycle bin.
4. **No silent extension** — no grace that re-serves media; no recycle bin; exports must **finish before** `expiresAt` (`beginExport` / `finishExport`).

```ts
// Documented constant — not a running worker
CLIP_PURGE_DESIGN = {
  accessRevokeAtExpiry: true,
  physicalPurgeSlaHours: 72,
  immutableBackupLagDisclosed: true,
  silentExtension: false,
  recycleBin: false,
  liveDeletionJobEnabled: false,
}
```

## What may persist

- Spot/Stash **pins** and minimal non-media metadata (nickname, founder, keeper, ACL, status, lat/long for authorized viewers) may remain until Keeper archives/removes.
- Private Stash coordinates and ACL metadata must never leak via public profiles, reactions, counts, thumbnails, achievements, notifications, or exports.

## Explicit non-goals (this batch)

- No real CDN / object-store delete scheduler
- No production GPS upload of coordinates
- No microphone always-on capture
- No automatic publication of Stashes
- No merge to `main` / Pages / family playtest deploy

## Test coverage

See `batch1/tests/spot-stash-t1238u.test.ts` (day-7 boundary, 20-day trip independence, export-before, playback deny, no live job) and `gb-phone/tests/woz/spot-stash-t1238u.test.tsx` (UI countdown + day-8 deny).

## Related (t1250u)

Expanded purge-worker / CDN / backup design (still design-only): `docs/t1250u-gb-integration/DELETION-ARCHITECTURE.md`. Signed-URL-style access guard: `batch1/src/spot-stash/media-access.ts`.
