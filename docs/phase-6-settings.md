# Phase 6: Settings (development scope)

- Settings contains an optional local nickname, the four practice defaults, reset-defaults confirmation, and app version from Expo configuration.
- `src/components/preferences` owns the shared practice controls, selection sheets, options, and save feedback. Setup and Settings render the same component and use the same PreferencesProvider.
- Nickname is optional, normalized, limited to 20 Unicode code points at the storage boundary, and saved with an explicit button. Home uses the saved nickname or “Hey there!” rather than a mock name. It is not sent to a server or included in sprint results. The practice streak remains mock data for the next phase.
- The existing preference key remains compatible: records without a nickname receive an empty string without losing their practice settings.
- Practice changes are immediately applied in memory and queued for persistence. Failed saves retain the current choice with an explicit Retry message; stale completions cannot mark a newer choice saved. Failed initial storage reads keep editing disabled until Retry succeeds.
- Reset restores only duration, input style, card layout, and Level Up in one save. It cannot delete results or personal bests, and preserves the nickname and appearance preference.
- No new dependencies, database migration, tracking, feedback transmission, dark-mode UI, Both-layout mode, or privacy-policy placeholder is introduced.

## Before external TestFlight distribution

Do not treat this development Settings screen as distribution approval. Apple's App Review Guideline 2.2 says TestFlight betas should comply with the App Review Guidelines; 5.1.1 requires an accessible privacy policy. Review the actual build's data behavior and prepare the policy/support information before distributing an external beta, not merely before public App Store release. Invite eligible adults; children under 13 (or the applicable local minimum age) cannot use TestFlight under its terms.

## Verification

- Run `npm test`, `npx tsc --noEmit`, and `git diff --check`.
- Test old preference compatibility, nickname reload/sanitization, reset preservation, read failures, queued write snapshots, and retry after failure.
- On-device checks: nickname keyboard and scrolling, selection sheets, reset cancellation/confirmation, app restart, and Settings → Setup consistency. Existing frozen sprint configuration remains independent of preference changes.
- Browser checked at 390×844: Settings layout, nickname save → Home → reload, duration/layout changes → Setup, and reset cancel/confirm preserving the nickname. No browser errors observed. All 73 tests, TypeScript, and web export passed.
