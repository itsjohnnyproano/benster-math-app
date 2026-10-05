export const FACT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const PRACTICE_RANGES = [10, 20, 50, 100, 1000] as const;
export const FACT_NUMBER_LIMIT_MAX = 100;
export const PRACTICE_NUMBER_RANGE_MAX = 1000;

export type FactTable = (typeof FACT_TABLES)[number];
export type PracticeRange = (typeof PRACTICE_RANGES)[number];
export type PracticeNumberRange = number;
export type FactNumberLimit = number;

export function isFactTable(value: unknown): value is FactTable {
  return typeof value === "number" && FACT_TABLES.includes(value as FactTable);
}

export function isPracticeRange(value: unknown): value is PracticeRange {
  return typeof value === "number" && PRACTICE_RANGES.includes(value as PracticeRange);
}

export function isPracticeNumberRange(value: unknown): value is PracticeNumberRange {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 1
    && value <= PRACTICE_NUMBER_RANGE_MAX;
}

export function isFactNumberLimit(value: unknown): value is FactNumberLimit {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 1
    && value <= FACT_NUMBER_LIMIT_MAX;
}

/** Returns a stable, validated table set while preserving a deliberate empty selection. */
export function sanitizeFactTables(value: unknown): FactTable[] | null {
  if (!Array.isArray(value)) return null;
  return Array.from(new Set(value.filter(isFactTable))).sort((left, right) => left - right) as FactTable[];
}

export function parseFactTables(value: unknown): FactTable[] | undefined {
  if (typeof value !== "string") return undefined;
  if (!value) return undefined;
  const parsed = value.split(",").map(Number);
  const tables = parsed.every(isFactTable) ? sanitizeFactTables(parsed) : null;
  return tables && tables.length > 0 ? tables : undefined;
}

export function parsePracticeRange(value: unknown): PracticeRange | undefined {
  const range = Number(value);
  return isPracticeRange(range) ? range : undefined;
}

export function parsePracticeNumberRange(value: unknown): PracticeNumberRange | undefined {
  const range = Number(value);
  return isPracticeNumberRange(range) ? range : undefined;
}

export function parseFactNumberLimit(value: unknown): FactNumberLimit | undefined {
  const limit = Number(value);
  return isFactNumberLimit(limit) ? limit : undefined;
}
