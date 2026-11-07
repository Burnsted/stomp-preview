# Pass state machine summary — t1208u (D2)

**Constant:** `PASS_EXPORT_ONLY_MONTHS = 12` (`batch1/src/trips/retention.ts`).  
**Supersedes:** product meaning of `RIDER_ARCHIVE_MONTHS=6` / `pass_archive_6mo` (alias now equals 12; kind `pass_export_only_12mo`).  
**Unchanged:** G1 Day Sesh media ≤45d (`DAY_SESH_MEDIA_MAX_DAYS`).

```
Active → Expired/locked → Export-only (12mo) → Deletion lifecycle
```

| State | Full history | Join/host/post | Report Card / export | Deletion jobs |
|---|---|---|---|---|
| `active` | yes | yes | yes | OFF |
| `expired_locked` | no | no | yes (12mo window) | OFF |
| `export_only` | no | no | yes (same window) | OFF |
| `deletion_lifecycle` | no | no | no | OFF (warnings only) |

**Renewal:** restores Active going forward; does **not** silently restore purged history (`renewPassAccess` / `renewDemoPass` / `restartArchiveOnRenewal.silentRestoreOfPurgedHistory=false`).

**Welcome-back (D3):** ≥90d inactive from **actual saved** demo history; **Pass-expiry wins** — expired users do not unlock full history via welcome-back.

**Honesty:** All states are **FICTIONAL-ONLY**. Not real entitlements or payments.
