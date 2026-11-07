# VALIDATION-GAPS — t1169u

Explicit inventory of **existing** naming rules found in-repo vs what this patch enforces.  
**Do not invent new product rules** (owner instruction). Gaps below are reported for product follow-up.

## Enforced by this patch (existing intent made hard)

| Rule | Where | Notes |
|---|---|---|
| Non-empty after trim required to complete onboarding | `isValidStomperDisplayName` → `commitOnboarding` + reveal/finish UI | Previously empty names silently became starter `.label` |

## Adjacent existing rules (not avatar-store native)

| Rule | Where | Notes |
|---|---|---|
| Strip `\|` / newlines; max 24 chars; empty → `"Rider"` | `useStomp.setRiderName` | Applied when onboarding success syncs rider name to stomp store — **after** avatar commit |
| Crewmate name sanitize + 24-char cap | `useStomp` crew invite paths | Not applied to avatar draft while typing |

## Gaps / missing product validation (discovered; not invented here)

1. **No max length on `AvatarConfig.displayName` itself** — avatar store accepts any length; only `setRiderName` truncates the parallel rider-name field to 24.
2. **No charset / profanity / reserved-name policy** documented or implemented for STOMPER display names in Avatar Foundation.
3. **No uniqueness check** (local or server) for display names.
4. **No explicit blocklist** of starter template labels (Nova, Mira, Kai, …) — a rider may still *choose* those strings; the fix only stops *silent* assignment. Product may later decide whether template labels are reserved.
5. **Whitespace-only** is blocked at commit; leading/trailing whitespace is trimmed on commit, but mid-string spaces / emoji / unicode are unrestricted.
6. **Grom nickname** uses the same non-empty gate only; Grom flow remains feature-flagged off — no additional youth naming policy found in Avatar Foundation.
7. **Server authz** — client demo identity is not server authorization (unchanged; out of scope).

## Recommendation for owner

Confirm whether to add: (a) 24-char cap on avatar draft/commit to match `setRiderName`, (b) reserved starter-label blocklist, (c) any youth-specific nickname rules when Grom is reviewed.
