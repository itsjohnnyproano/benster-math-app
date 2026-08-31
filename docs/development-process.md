# Benster development process

## Before implementation

1. Confirm the requested outcome and whether design changes are authorized.
2. Inspect the current branch, worktree, relevant tests, and nearby architecture.
3. Check the exact Expo SDK 57 documentation when the task touches Expo, native configuration, routing, builds, or supported devices.
4. Identify persistence compatibility, privacy implications, and device-only behavior before editing.

## During implementation

- Make the smallest coherent change that satisfies the request.
- Preserve unrelated work and existing visual behavior.
- Put logic in its owning layer rather than the most convenient screen.
- Reuse established concepts, tokens, formatters, and components. Do not force abstractions between code with different responsibilities.
- Add or update focused tests for product rules, regressions, validation, migrations, and fragile lifecycle behavior.

## Review and verification

Run focused tests while working, then the standard checks in `AGENTS.md`. Review the final diff for:

- Incorrect behavior and missed requirements.
- Async races, stale updates, timer/listener cleanup, repeated submissions, and rapid taps.
- Invalid route or persistence input and error/loading/empty states.
- Unnecessary duplication, dead code, misleading names, and abstractions that add complexity.
- Privacy/security changes and accidental secrets.
- Accessibility, safe areas, responsive layout, and supported device/orientation behavior.

Passing checks do not replace an appropriate manual flow or physical-device test.

## Independent Codex review

Use an independent review after the implementation task has completed its own checks. The reviewer reports findings only; it must not modify files. A separate review context helps reduce confirmation bias, but it does not replace tests, device QA, or specialist legal/security review.

For an independent review, manually open a separate Codex task in the Benster project, type `/review`, and choose the appropriate review scope. No Codex setting is required. If a future Codex version shows a **Settings → General → Code review → Detached** option, you may enable it to open review tasks automatically, but the manual separate-task workflow remains valid.

### Before committing a meaningful change

Choose **Review uncommitted changes** for a completed feature, bug fix, refactor, persistence change, navigation change, native/configuration change, or other non-trivial diff. A separate review is optional for documentation-only edits, copy changes, and isolated low-risk visual adjustments when the normal checks and local review are sufficient.

Use this custom review instruction:

> Review these uncommitted changes as a senior React Native, Expo, and application-security engineer. Do not modify any files. Focus on correctness, regressions, state management, async lifecycle, data loss, privacy, security, accessibility, iPhone and iPad layouts, Expo SDK 57 compatibility, and missing tests. Rank findings by severity and include exact file and line references. Ignore minor style preferences unless they create a genuine maintenance risk. Distinguish verified defects from speculative risks.

Review uncommitted changes only after the implementation diff is coherent and its focused tests pass; otherwise the reviewer spends time reporting known unfinished work.

### Before merging or producing a release build

Choose **Review against a base branch** and select `main`. Use this after the feature has been committed to its branch and before merging a substantial feature, creating a release candidate, or uploading a TestFlight build:

> Review this branch against `main` as a release-blocking pull request. Do not modify files. Report only actionable bugs, regressions, privacy or security risks, data-loss risks, accessibility problems, Expo SDK 57 incompatibilities, and important missing tests. Rank findings by severity and include exact file and line references. Distinguish verified defects from speculative risks.

### Handling findings

1. Read every finding and inspect its evidence before changing code.
2. Return to the implementation task to make the smallest valid fix.
3. Record why a rejected finding does not apply.
4. Run focused tests plus TypeScript, lint, the full test suite, and `git diff --check` again.
5. Repeat the independent review only when fixes materially changed behavior, persistence, lifecycle handling, navigation, or the reviewed architecture.

Use a separate security-focused audit before the first external TestFlight release and whenever Benster adds authentication, accounts, cloud storage, analytics, advertising, payments/subscriptions, remote APIs, or new handling of child data. An ordinary `/review` is a defensive code review, not a guarantee of security or a penetration test.

## Handoff and commit

Summarize what changed, where, why, and what was verified. State remaining manual checks explicitly. Commit only after the user has reviewed the result or requested the commit; push, pull, merge, and release actions require separate user direction.
