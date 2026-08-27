# Phase 4: Results and local persistence

## Implementation

- Results lives in `src/features/sprint-results`; it replaces the temporary completion component inside the existing Play route.
- `averageResponseMs` averages every submitted answer, including incorrect answers. Zero attempts produces `null`, displayed as an em dash.
- The engine receives the next question's presentation time after feedback, so the preceding feedback interval is excluded. The sprint countdown timer still runs during feedback.
- Answers accepted before expiry count even when their feedback finishes after expiry. No final unanswered question is recorded.
- A per-sprint clock captures calendar time once and advances using `performance.now()`. Clock edits cannot change response times or deadlines; stored timestamps remain integer epoch milliseconds anchored to the original start. No storage migration is needed.
- The clock is not reset on background/resume. When callbacks resume, they use elapsed time rather than counting missed ticks. Native-device suspension behavior still needs the device check below.
- Duration labels live in `src/shared/formatSprintDuration.ts`, shared by Home, Setup, and Results.
- Results saves automatically on mount. Done is available after saving. A failed save offers Retry and an explicit Leave without saving confirmation.

## Storage and personal bests

- Existing preference storage is unchanged.
- `math-sprint-results.db` uses schema version 1, a sprint table, and a personal-best table.
- Result JSON contains the frozen configuration, timestamps, counts, accuracy, average time, streak, level, and answered questions. Incorrect answers are derived rather than duplicated.
- A private, serialized connection uses bound SQL parameters and transactions. The result and personal-best update commit together.
- A stable per-sprint local ID makes retries idempotent. Retrying returns the original best-change receipt, even if another sprint has since beaten it.
- Best scores compare correct counts for the same mode and duration. Input style, card layout, and Level Up do not create separate categories.
- A first answered sprint establishes a best, even with zero correct answers. Zero attempts never establishes or changes a best.
- Home reloads bests on focus and when the preferred duration changes. Name and day streak remain mock data.
- Local-only data is not a cloud backup. A process terminated before a save commits may lose that result; in-progress sprint recovery is not part of this phase.

## Mascot rules

- Fewer than five attempts: neutral encouragement with the existing thumbs-up mascot.
- At least five attempts and unrounded accuracy below 60%: encouragement mascot, never a “below expected” label.
- Otherwise: existing thumbs-up mascot.
- Thresholds are centralized in `src/domain/results.ts`.
- The domain returns a semantic outcome; `src/features/sprint-results/resultPresentation.ts` owns the unchanged wording, mascot selection, and response-time formatting.

## Verification

- Run `npm test` and `npx tsc --noEmit`.
- Database tests use Node's built-in SQLite (Node 22.13+; verified with Node 24), not a fake SQL parser.
- Tests cover feedback timing, deadline handling, zero attempts, mascot boundaries, first/new/tied/lower bests, duration/mode separation, duplicate saves, failed writes/rollback/retry, reopening, and corrupt results.
- Browser verified: completed sprint → saved Results → answer review → Done → Home updated best → reload retains best.
- Still check on iOS/Android: safe-area layout, font rendering, hardware Back/save-failure behavior, and app background/resume behavior.
- Full History browsing, real day streaks, onboarding/name entry, and cloud synchronization remain separate phases.
