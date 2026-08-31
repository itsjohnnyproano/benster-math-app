# Benster project instructions

## Product

Benster is a child-focused, offline-first math-practice app operated by JP4 LABS LLC. It provides timed addition, subtraction, multiplication, division, and mixed sprints; local history, personal bests, and practice streaks; and optional local nickname personalization.

Preserve the established visual language and user flow unless the user explicitly requests a design change. iPhone is portrait-only. The planned iPad experience supports portrait and landscape with constrained, responsive layouts.

## Technology

- Expo SDK 57, React Native 0.86, React 19, TypeScript in strict mode, and Expo Router.
- Before writing or modifying any application code, consult the relevant pages in the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/). Do not rely on memory or substitute documentation for another SDK version. Pay particular attention when changing Expo APIs, dependencies, app configuration, native behavior, routing, builds, or supported-device behavior.
- Vitest provides unit and repository tests. SQLite stores completed sprint records; `expo-sqlite/kv-store` stores preferences.
- NativeWind is installed but the current UI primarily uses React Native `StyleSheet`. Do not migrate styling systems unless explicitly requested.

## Architecture boundaries

- Keep route files in `src/app` thin; they should compose or re-export feature screens.
- Keep pure calculations, validation, and product rules in `src/domain`. Domain code must not depend on React or persistence.
- Keep SQLite and key-value storage access in `src/data`. Validate data read from persistence before it reaches features.
- Keep screen state and presentation in `src/features`; reusable cross-feature UI belongs in `src/components`.
- Keep shared formatters and platform-neutral helpers in `src/shared`, centralized product metadata in `src/config`, and design tokens in `src/theme`.
- Prefer an existing abstraction when it represents the same concept. Do not create abstractions solely to reduce line count or combine code that only looks similar.
- See [docs/architecture.md](docs/architecture.md) for the current data flow and ownership model.

## Privacy and security

- Treat nickname, preferences, sprint history, answers, timing, and streak data as local device data. Do not add accounts, remote storage, analytics, advertising, tracking, or transmission of child data without explicit user authorization and a privacy review.
- Do not place secrets, credentials, private keys, tokens, or personal contact information in source control.
- SQLite is not application-level encrypted secret storage. Do not store passwords, authentication tokens, financial data, or other sensitive secrets in the existing repositories.
- Validate external, route, and persisted values at their boundaries. Use parameterized SQLite queries; never construct SQL with untrusted string interpolation.
- Avoid claiming that code is “secure” in absolute terms. Report the scope checked, findings, remaining risks, and device-only verification separately.

## Required checks

For code changes, run checks proportional to the change. Before declaring a normal feature complete, run:

```sh
npm run lint
npx tsc --noEmit
npm test
git diff --check
```

Run focused tests while iterating. For release/configuration/native changes, also perform the relevant production build or export and physical-device checks. Never describe a simulator, web preview, static inspection, or passing unit suite as physical-device verification.

## Git safety

- Inspect branch and worktree state before editing.
- Preserve user changes and avoid modifying unrelated files.
- Do not create or switch branches, commit, push, pull, merge, rebase, reset, or discard changes unless the user asks.
- Never use destructive Git commands to solve an ordinary implementation issue.
- Generated `ios` and `android` directories are ignored. Make durable native configuration changes through Expo configuration/plugins unless the user explicitly chooses to maintain native projects.

## Definition of complete

A requested implementation is complete when:

- The requested behavior works without unauthorized product or design changes.
- Loading, empty, error, async lifecycle, rapid-tap, and relevant small-screen states have been considered.
- New product rules and regressions have focused automated coverage where practical.
- Required checks pass, or any unavailable/failed checks are reported precisely.
- Persistence compatibility is preserved or an intentional migration is implemented and tested.
- The final handoff identifies what changed, where, why, verification performed, and any remaining manual/device checks.

## Process and release references

- [Development process](docs/development-process.md)
- [TestFlight checklist](docs/testflight-checklist.md)
- Phase-specific decisions are recorded in the remaining files under `docs/`.

For a dedicated pre-commit correctness, maintainability, security, and redundancy audit, use the project skill `$benster-code-review`.
