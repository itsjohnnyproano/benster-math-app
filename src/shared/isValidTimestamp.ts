// Persisted completion times must be nonnegative integer milliseconds and
// representable by JavaScript Date. Future dates are valid but handled by callers.
export function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value)
    && value >= 0 && Number.isFinite(new Date(value).getTime());
}
