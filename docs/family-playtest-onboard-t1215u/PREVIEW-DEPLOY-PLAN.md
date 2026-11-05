# Preview update plan — t1215u (**PLAN ONLY — DO NOT DEPLOY**)

Live family playtest (leave until Ted asks): https://burnsted.github.io/stomp-family-playtest/  
Production arcade (**NEVER touch**): https://burnsted.github.io/stomp-preview/

## What would be needed later (owner-gated)

1. Keep this PR **draft / NO MERGE** until an explicit OWNER GO for playtest publish.
2. Confirm CI green on the draft tip.
3. Publish **only** the family playtest Pages host from this tip (or a fast-forward of the playtest branch onto this tip) — do **not** publish production arcade.
4. Typical Pages path in this repo: `gb-phone` `build:pages` + existing `deploy-pages.yml` / playtest workflow, scoped to the `stomp-family-playtest` site — exact workflow name to be confirmed by owner at publish time.
5. After publish: smoke first-visit welcome → Create STOMPER → ID → Meet Sesh → trip choice → Home; Reset Demo → welcome again.
6. Share Reset Demo tip with Cameron / Justin; leave production arcade untouched.

## Not in this PR

- No automatic GitHub Pages deploy.
- No merge to `main`.
- No overwrite of the live playtest URL above unless Ted later asks.
