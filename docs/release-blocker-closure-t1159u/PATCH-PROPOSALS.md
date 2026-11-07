# PATCH-PROPOSALS — t1159u / t1160u

Exact proposals for fixes that were **not** applied on this throwaway branch because they would change product policy, touch protected #12–#16 tips, enable youth/payments/deletion jobs, alter Home/preview branding, or require unavailable GB Rider source.

Authorized isolated fixes that **were** applied on this branch are listed under “Applied (this tip)” for audit — not proposals.

---

## Applied (this tip — independently authorized)

| ID | Change | Why allowed |
|---|---|---|
| A5-SV0 | `batch1/src/shared/guardResult.ts` — add `DENY_TO_GUARD` entries for SV-0 `session_locked` → `confirmation_required`, `media_deleted` → `after_deadline`, `already_handled` → `invalid_publish` | Adapter mismatch on THIS branch after SV-0 cherry-pick; restores typecheck; does not change product policy |
| XINT-11/12 | Convert `it.fails` → real `it` using SV-0 APIs | CONFLICT closed; asserts not weakened |
| AF-RC-01..10 | New fictional success+deny tests | Batch B scope |
| Docs | REPORT / BLOCKERS / CONTRACT-MAP / this file | Batch D/E + t1160u |

---

## Proposal P1 — Server authz envelope (NOT implemented)

**Why blocked:** production security / live auth — hard boundary.

```
For each fictional guard already asserted (Pass, Viewer download, Squad membership,
Quick Share recheck, retention soft-hide), add server-side enforcement:

  POST /v1/share/confirm { pendingId, actorId, channel }
    → recheck membership + media + session unlock + CAS
    → 403 { code: not_member | session_locked | expired | already_handled | multi_recipient }

  GET /v1/trips/:id/viewer-download
    → 403 after downloadUntilIso or revokedAtIso
    → never accept client-extended MediaRef deadlines

Do NOT trust gb-phone / Rider Hub client flags as authority.
```

**Owner approval required:** yes (architecture + infra).

---

## Proposal P2 — GB Rider compare-don’t-rebuild (BLOCKED on source)

**Why blocked:** Ted phone/desktop offline; claimed files not on box.

When Ted transfers `social.ts` / `social-store.ts` / `social.test.ts` / `rider-hub.tsx` (+ wiring):

```
1. Place under gb-phone/src/ mirroring claimed paths (feature branch only).
2. Diff against GROK-BUILD-CONTRACT-MAP.md §2–§5.
3. Reuse: nav chrome, Crew Invite, local store patterns that match contracts.
4. Adapt mismatches: single-Squad confirm, Pass/Viewer fields, pendingId CAS.
5. Delete duplicate authz that contradicts batch1 guards — call shared adapters.
6. Keep Home / five-tab / Crew Invite byte-behavior stable.
7. Do not mark demo tests as AF-RC acceptance.
```

**Owner approval required:** transfer method + review of UI diff (no merge of this throwaway).

---

## Proposal P3 — Wire CF-2/SV-0 into preview (NOT implemented)

**Why blocked:** GB shell product edit / Home-nav risk; HELD bridge.

```
Additive-only gb-phone module (e.g. lib/stomp/woz-bridge/cf2-share.ts):
  import { campfireCf2, shared } from batch1 namespaces
  expose prepare/confirm/cancel + character state
  NO changes to alpine-chrome tabs, greet.tsx Crew Invite, or preview branding tokens
```

**Owner approval required:** Ted Go to unfreeze GB bridge.

---

## Proposal P4 — Youth Campfire / A7 activation (NOT implemented)

**Why blocked:** product policy; A7 SPEC-only; youth enrollment.

```
Do NOT flip YOUTH_CAMPFIRE_ENABLED.
Future: only after real age verification + guardian consent + server gate.
ageBandToAccountStatus('grom')='youth' remains planning stub.
```

**Owner approval required:** explicit youth Go.

---

## Proposal P5 — Deletion jobs / legal hold (NOT implemented)

**Why blocked:** enables deletion infrastructure; G1–G4 gated.

```
Keep assertNoDeletionJob().enabled === false.
Day Sesh media stays DEADLINE_UNSPECIFIED until owner sets policy (G1).
Account erasure authored-text in others' threads → legal counsel (G4).
```

**Owner approval required:** policy + legal.

---

## Proposal P6 — Protected tip repairs (NOT implemented)

**Why blocked:** must not push to #12–#16 heads.

If CI ever regresses on a protected tip, repair **only** via new tip commits on those PR branches under separate owner Go — never from this throwaway branch rewriting their SHAs.

---

## Non-proposals (explicitly out of scope)

- Payments / Arcade / Capture Studio / other sports / kiosks  
- Pages deploy / production publish  
- Merge of #12–#16 or this PR  
- Restart/extend SV-0 product scope without regression evidence  
