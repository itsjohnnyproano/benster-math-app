# Benster TestFlight checklist

## Product identity and configuration

- Confirm the installed name is Benster and the legal operator is JP4 LABS LLC.
- Finalize bundle identifier, app icon, splash treatment, version, and build number before creating the App Store Connect record.
- Keep iPhone portrait-only. Verify the intended iPad portrait and landscape behavior after tablet support is implemented.
- Confirm App Store Connect privacy answers match the shipped binary and published privacy policy.

## Automated release checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `git diff --check`
- Run the applicable Expo production export/build validation.
- Review dependency and build output for unresolved warnings that affect release behavior.
- Run a detached `/review` against `main` using the release-blocking instructions in `docs/development-process.md`; resolve or document every actionable finding.
- Before the first external beta, complete a security-focused audit of the shipped dependency, persistence, privacy, and network surface.

## Fresh-install flow

- Launch branding and onboarding render correctly.
- Nickname can be entered or skipped and remains after relaunch.
- Home, History, Settings, and Streak navigation behaves consistently.
- Every math mode works with every supported duration, input style, card layout, and Level Up setting.
- Results save once; personal best, history detail, and streak update correctly.

## Lifecycle and persistence

- Background, foreground, lock, and unlock during countdown and gameplay.
- Attempt to leave a sprint and verify confirmation behavior.
- Force-close and reopen the app.
- Install a newer build over an older one and confirm saved local data remains usable.
- Reset practice defaults and delete all saved data independently.
- Verify failed persistence produces a truthful recoverable state rather than false success.

## Device and interaction coverage

- Test a small supported iPhone and a current large iPhone.
- Test physical iPhone safe areas, keyboard, number pad, tab bar, sheets, and rapid taps.
- Test supported iPads in portrait and landscape once enabled, including rotation, maximum widths, keyboards, sheets, tabs, and gameplay fit without unintended scrolling.
- Check accessibility labels, text scaling constraints, contrast, and minimum tap targets.
- Check reduced-motion behavior for nonessential animation.

## Beta information

- Support/feedback email and public privacy-policy URL.
- Beta description, “What to Test,” and Apple beta-review contact information.
- Invite parents or eligible adult testers and ask them to supervise child testing.
- Install and test the distributed build internally before submitting it for external TestFlight review.
