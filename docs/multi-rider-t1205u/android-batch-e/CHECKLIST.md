# Android Batch E — checklist only (NOT RUN)

**Status:** `NOT_RUN`. Do **not** claim device PASS from this document or from browser screenshots.

## Scope

Physical Samsung (or target Android) proof for registered modular prototypes:

- Man 1 (`m-samir`)
- Woman 2 (`f-hana`) — Look2 preserved
- Woman 3 (`f-priya`)
- Man 2 (`m-devon`) — framework only until owner visual review

## Preconditions (all must be true before device run)

- [ ] Owner visual review recorded for the rider under test
- [ ] A/B/C browser proofs green for that rider
- [ ] Separated production slots still known ABSENT (fail-closed honesty)
- [ ] Draft PR tip SHA pinned; CI both jobs green
- [ ] No Pages/deploy/prod auth/payments/youth activation in the test build

## Device checklist (when owner authorizes)

1. Install draft APK / WebView build from pinned tip (not production).
2. Cold start → character selector shows Look N of M labels (not personal names).
3. Select rider → Locker shows `data-acceptance-eligible=false`, `REGISTERED_VISUAL_PROTOTYPE_ONLY`.
4. A: jacket OFF — underbody visible; no holes claimed as PASS without notes.
5. B: default outfit — registration zero-shift vs locked head.
6. C: TEST alt — jacket+pants itemIds swap together; still TEST-ONLY.
7. Multi-rider isolation: change Man 1 outfit, switch to Woman 3, return — Man 1 unchanged.
8. Confirm missing slots fail closed (no invented hair/helmet/goggles/board/backpack).
9. Capture device screenshots + build fingerprint; attach to receipt.
10. Record `androidQa: PASS|FAIL` only after steps 1–9; never from emulator CSS alone.

## Explicit non-claims

- Browser phone-viewport (~390×844) ≠ Android PASS
- File presence / sha256 ≠ Android PASS
- Man 2 plates on disk ≠ owner visual approval
