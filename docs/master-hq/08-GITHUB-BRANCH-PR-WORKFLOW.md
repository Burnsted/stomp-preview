# 08 GitHub Branch / PR Workflow (Rosie-style process, no Rosie features)
- Flutter work: Origin ted-burns/tmp-1bc65ad0541faa7b (still unpublished draft). Feature branches `woz/<feature>` or `gb/<feature>` from main tip; draft PRs only.
- No merge, publish, or deploy without explicit Ted OK.
- Burnsted/stomp-preview = web-only deploy target; update via draft PR after Ted approves; cloud agent does not deploy it (README).
- Each PR: scope, screenshots, `flutter test` result, files touched, owner (Woz/GB).
- One builder per feature; record claim in HQ before starting.
- No force-push/rewrite of main.
