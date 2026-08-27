# Practice streak — V1

## Behavior

- A saved, completed sprint marks its local completion date as practiced, regardless of mode, duration, accuracy, or attempted count. Cancelled sessions are not saved and do not count.
- Multiple completions on a date count once. Today anchors the streak when practiced; otherwise yesterday can anchor it. A missed full day breaks the current streak, but not the longest-streak record.
- Calendar dates use the device's current local timezone, matching History. Travel/timezone changes may reinterpret older dates. Future timestamps are ignored until the clock reaches them; invalid timestamps produce an error, not a fake zero.
- Home opens `/streak`. Practice now returns Home to choose a mode. No new bottom tab.
- The screen shows current streak, Monday–Sunday practice markers, longest streak, total practice days, and supportive mascot copy. It can scroll on smaller screens.

## Implementation

- `src/domain/practiceStreak.ts`: pure calculation from timestamps; calendar arithmetic handles daylight-saving and month/year boundaries.
- `src/shared/localCalendar.ts`: shared local-date helpers, also used by History.
- `src/shared/isValidTimestamp.ts`: one timestamp validator reused at the repository and calculator boundaries.
- `listCompletionTimes()` on the existing results repository reads only completion timestamps across all records. No history-page limit, new database, migration, or separately persisted counter.
- `src/features/streak/usePracticeStreak.ts`: shared Home/screen data hook; refreshes on focus, foregrounding, and local midnight. Ignores stale async responses and clears listeners/timers on blur.
- `src/features/streak/StreakScreen.tsx`: existing theme, cheering mascot, safe area, loading/error/retry states. Copy is separate from the calculator.
- Removed Home's remaining mock streak data. Unavailable counts display “View streak,” not zero.

## Verification

- Unit coverage: empty state, duplicates, unordered completions, today/yesterday anchors, gaps, longest run, long history, local midnight, leap days, year boundaries, DST, future/invalid timestamps, and encouragement states.
- Real SQLite repository test verifies completion queries are not limited to the first History page and include different modes and zero-attempt completed sprints.
- Lifecycle callback tests exercise the actual hook effect with mocked React/native bindings: focus, foregrounding, midnight, overlapping successes/failures, pending requests after blur, timer/listener cleanup, and retry. These are callback tests, not React-renderer or physical-device tests.
- Web build, TypeScript, and whitespace checks pass. Browser preview inspected at 390×844 and 320×568; Home → Streak → Practice now navigation verified.
- Preview preferences failed to load, blocking an end-to-end completed sprint in that browser session. Verify a completed sprint updates both Home and Streak on iOS before release. Native safe-area/font rendering and foreground/midnight refresh still need device checks.
- A paired iPhone 16 Pro Max and a booted iPhone 16 simulator were detected. Physical-device UI verification is still pending; detecting a device does not verify the app flow.

### Physical-device checklist

1. Run the current development version on the phone. Note the Home streak and Streak screen's total practice days.
2. Complete a 30-second sprint. Wait for Results to say “Saved on this device,” then tap Done.
3. Confirm Home and Streak agree, and today is marked practiced. If today was already practiced, counts should not increase; otherwise total practice days increases by one.
4. Complete another sprint today: total practice days and current streak must stay unchanged.
5. Force-close and reopen the app: the same saved streak should appear. Background and foreground it as well.
6. Start and cancel a sprint: it must not add a practice day. Verify this on an unpracticed day if needed; cancelling on an already-practiced day cannot demonstrate the distinction.

Do not alter the phone clock or delete existing history just to test these cases; synthetic date cases are covered by unit tests.

Achievements, freezes, reminders, cloud sync, and anti-clock-tampering enforcement are outside this phase.
