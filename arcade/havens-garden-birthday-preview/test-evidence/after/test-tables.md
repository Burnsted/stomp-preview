# Test results — save/migration fix

## BEFORE (baseline, no code changes)
| Suite | Result |
| --- | --- |
| 01–05 existing Playwright (17 tests) | **17 passed** |

See `test-evidence/before/baseline-17.txt`.

## AFTER (Fixes 1–2 + new integrity suite)
| Suite | Result |
| --- | --- |
| 01 save/shop/harvest/reset/migration (5) | passed |
| 02 gh pack hits (2) | passed |
| 03 offline/resume (3) | passed |
| 04 full cycle (1) | passed |
| 05 devices/load (6) | passed |
| 06 save/migration integrity (11) | passed |
| **Total** | **28 passed** |

New coverage in `tests/06-save-migration-integrity.spec.js`: buy, harvest/undo/reset+no-resurrection, restore backup, plant/water/Growing interrupt+reload, two-tab stale write, six-flower bed, full GH+outdoor, migrate×3 idempotent, forced failure recovery, flower-count invariant, reopen schema/revision.
