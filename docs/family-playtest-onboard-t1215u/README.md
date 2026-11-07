# Family playtest onboarding correction — t1215u

**OWNER GO** — isolated draft from PR #52 tip `a038ff9148ab607999d413f5a1d6e739d48c10e1`.

## Intent

First-time fictional visitors begin on a Form #7 branded STOMP welcome with **Create Your STOMPER** (primary) and **Explore Demo** (secondary), then flow through the existing five-step adult `AvatarOnboard` → STOMPER ID → Meet Sesh → Trip Drop choice → Home.

## Non-goals / locks

- Do **not** replace `greet.tsx` (file kept; Home still mounts `Greet`).
- Do **not** change CrewLink.
- Five-tab nav intact.
- Grom enrollment, payments, live Squad sharing stay **OFF**.
- FICTIONAL / DEMO ONLY — no real auth / PII / deletion jobs.
- **NO MERGE** to main. **NO DEPLOY** to Pages / `stomp-family-playtest` / production arcade.

## Live hosts (do not overwrite unless Ted asks)

- Family playtest: https://burnsted.github.io/stomp-family-playtest/
- Production arcade: https://burnsted.github.io/stomp-preview/
