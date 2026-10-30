# Test output conventions (Batch 1)

## Tip reality

`Burnsted/stomp-preview` @ `702cf32` is a **Flutter web static** tip — no `pubspec.yaml` / Dart tests runnable here.  
Batch 1 automated tests live under `batch1/` (Vitest + TypeScript).

## Exact commands

From repo root:

```bash
cd batch1
npm ci          # or npm install on first setup
npm run typecheck
npm test
```

Optional local Unlink UI preview (does **not** replace tip `index.html`):

```bash
cd batch1
npm run preview:unlink
```

## Reporting

Record in status reports:

1. Working directory (`batch1/`)
2. Exact commands
3. Pass / fail / skip counts from Vitest summary
4. Node + npm versions (`node -v`, `npm -v`)
5. Commit SHA of the draft branch under test

JSON artifact (when tests run): `batch1/test-results/vitest-results.json` (gitignored).

## Flutter (when Origin source available)

If Ted provides Origin Flutter tree (`e65f394` or newer):

```bash
flutter test
```

Do not claim Flutter test results from this tip alone.
