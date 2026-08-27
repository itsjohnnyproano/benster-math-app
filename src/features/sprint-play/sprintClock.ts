/**
 * Anchor calendar time once, then advance only by monotonic elapsed time.
 * This preserves epoch-millisecond storage without letting device-clock edits
 * change deadlines or response times. Integer milliseconds match the schema.
 * Keep the same clock on resume: suspended callbacks do not restart the sprint.
 */
export function createSprintClock(
  wallNow: () => number = Date.now,
  monotonicNow: () => number = () => performance.now(),
) {
  const startedAtMs = wallNow();
  const monotonicStartMs = monotonicNow();

  return {
    startedAtMs,
    now: () => startedAtMs + Math.floor(monotonicNow() - monotonicStartMs),
  };
}
