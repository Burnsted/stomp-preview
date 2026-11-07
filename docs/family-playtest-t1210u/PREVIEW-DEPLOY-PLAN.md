# Preview deploy plan — t1210u (**PLAN ONLY — DO NOT DEPLOY**)

**LIVE (OWNER GO t1211u):** https://burnsted.github.io/stomp-family-playtest/ — SHA `332321c1cbe797a56281ede0836f84fe0f18985b`.

Original note for t1210u: this document began as a plan. Production arcade Pages remain untouched.

## Proposed preview URL (candidate)

Once owner-approved:

1. **Preferred:** GitHub Pages preview from this draft branch via existing `deploy-pages.yml` **only after** explicit OWNER GO for a **temporary playtest publish** (not this PR’s scope).
2. **Alternate:** Vercel/Grok preview linked from the draft PR Checks / deployment bot if already enabled for `gb-phone`.
3. **Local host for Ted:** `gb-phone` `npm run dev` on `0.0.0.0:8080` (dev only; not for Cameron phones unless tunneled by owner).

**Do not invent a live URL.** When a host is chosen, paste it into the PR body and CAMERON-JUSTIN-INSTRUCTIONS.

## Suggested steps (owner-gated)

1. Keep PR draft / NO MERGE.
2. Confirm CI green on `cursor/family-playtest-t1210u-af0f`.
3. Owner picks host (Pages vs preview bot).
4. Publish **once** for playtest; label the site “FAMILY PLAYTEST · SIMULATED”.
5. Share link + Reset Demo tip with Cameron / Justin.
6. After playtest window: unpublish or leave draft — still no main merge until a later OWNER GO.

## Arcade links

Leave main/#40/#42 arcade / Terrain Park release paths untouched. Do not redirect them through this draft.
