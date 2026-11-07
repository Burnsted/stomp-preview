# t1250u — Clip deletion architecture (DESIGN ONLY)

**NO live purge worker · NO CDN invalidation job · NO backup eraser · NO deploy**

Issue [#87](https://github.com/Burnsted/stomp-preview/issues/87) binding rule: every STOMP-hosted clip expires ≤7 days after initial server receipt. At expiry, delivery must stop immediately; physical deletion follows a bounded SLA. Immutable backups may lag and must be disclosed — never presented as a recycle bin.

This document extends `docs/t1238u-spot-stash/RETENTION-DESIGN.md` with an explicit worker / CDN / backup design. **Nothing here is enabled in the preview** (`liveDeletionJobEnabled: false`).

## Stages

```
upload → live delivery (signed URL)
      → expiresAt (receipt + 7d)
      → ACCESS REVOKE (immediate; product)
      → PURGE QUEUE (≤72h SLA target)
      → storage delete + CDN invalidate
      → backup rotation (natural lag; disclosed)
```

## 1. Access revoke (product — implemented in preview logic)

At `expiresAt` (lazy read-time in prototype; would be event-driven in production):

- `delivery = expired`, `deliveryUrl = null`
- `accessClipMedia` / `resolveSignedMediaUrl` return `expired_unreachable`
- Feeds, Spot Replay, thumbnails, derived copies refuse serve
- UI may also disable play/export — **insufficient alone**; the media access function is authoritative

Prototype modules: `batch1/src/spot-stash/retention.ts`, `media-access.ts`, `repository.ts`.

## 2. Purge worker (design only — NOT running)

| Field | Design |
| --- | --- |
| Trigger | Row enters `purge_queue` when access revoked |
| Cadence | Periodic scanner + expiry-event enqueue |
| SLA | Physical object delete targeted ≤ **72 hours** after `expiresAt` |
| Idempotency | Delete-by-object-key; safe to retry |
| Scope | Original object + derived renditions + thumbnail keys |
| Failure | Dead-letter + alert; never silent TTL extension |
| Preview flag | `CLIP_PURGE_DESIGN.liveDeletionJobEnabled = false` |

Pseudocode (not shipped):

```
for clip in purge_queue where expiresAt <= now:
  assert delivery revoked
  storage.delete(objectKey)
  cdn.invalidate(paths…)
  mark purged_at
  enqueue backup_tombstone(clipId)  # policy disclosure only
```

## 3. Storage / CDN invalidation (design only)

- Primary object store: delete object key(s) for the clip
- CDN: invalidate cached URL paths / surrogate keys for that clip id
- Signed URL minting after revoke must fail even if a CDN edge still holds bytes until invalidation propagates
- Preview uses deterministic `preview://…` tokens — no real CDN

## 4. Backups (design only — disclose lag)

- Immutable / WORM backups may retain ciphertext until natural rotation
- Policy **discloses** this lag to riders and ops
- Backups are **not** a recycle bin, grace period, or restore path for expired clips
- `CLIP_PURGE_DESIGN.immutableBackupLagDisclosed = true`

## 5. Explicit non-goals (this prototype)

- No production scheduler, queue, or cron
- No real object-store credentials
- No promise of instantaneous global erasure
- No silent extension past seven days

## Tests

- `batch1/tests/spot-stash-t1238u.test.ts` — TTL / export / playback deny / no live job
- `batch1/tests/spot-stash-t1250u.test.ts` — media access unreachable after expiry; purge design flags remain off

**Owner approval required** before enabling any live deletion job, CDN invalidation, or backup eraser.
