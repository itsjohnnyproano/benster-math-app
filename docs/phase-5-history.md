# Phase 5: History

- `src/app/history.tsx` routes to the History feature through the bottom navigation. The redundant Home History card and its component were removed; Home returns without piling up duplicate routes. Settings remains a disabled placeholder.
- History reads existing saved results; it never saves a result again or changes personal bests. No database migration or native dependency is needed.
- Pages contain up to 20 records, ordered by completion time and ID descending. Bound SQL parameters filter by mode before pagination. The timestamp/ID cursor handles ties and newer insertions without shifting page offsets.
- A virtualized section list groups records by the device's current local calendar day. Today/Yesterday use calendar arithmetic, including daylight-saving boundaries. Reopening or foregrounding History refreshes the query and day labels; pull-to-refresh is also available.
- All, Addition, Subtraction, Multiplication, and Mixed filters reset pagination. Request generations ignore stale responses after filter changes, blur, or refresh; a synchronous guard prevents overlapping load-more requests.
- Cards show mode, shared duration label, correct/attempted, accuracy, average response time, completion time, and level only when Level Up was enabled. Zero attempts shows 0/0, 0%, and an em dash for average time.
- The original reading-book penguin appears small beside the populated header, or larger in the empty state, never twice. Existing color tokens, Nunito Sans fonts, card shadows, and safe-area navigation are reused.
- Loading, filtered/global empty states, initial read failure, and pagination failure have distinct handling. Failed pagination preserves the already loaded records and offers Retry. Load more is explicit rather than automatic infinite loading.
- Record-detail navigation, real daily streaks, and onboarding remain future work.

## Checks

- Run `npm test`, `npx tsc --noEmit`, and `git diff --check`.
- Repository tests cover filtered pagination, timestamp ties, insertion between pages, reopening persisted records, and retry after read failure.
- Date grouping tests cover midnight, year changes, and daylight-saving boundaries; also run under New York and Tokyo timezones.
- Native iOS/Android safe-area rendering, large accessibility text, and pull-to-refresh should still be checked on devices.
- Browser verified at 390×844 and 320×568 before removing the redundant Home card: empty/filtered states, completed sprint → saved History card, navigation, and app reload retaining the record. No browser errors were reported. Web export, TypeScript, and 64 tests pass.
