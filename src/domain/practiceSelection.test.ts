import { describe, expect, it } from "vitest";

import {
  parseFactNumberLimit,
  parseFactTables,
  parsePracticeNumberRange,
  parsePracticeRange,
  sanitizeFactTables,
} from "./practiceSelection";

describe("practice selections", () => {
  it("normalizes saved table selections", () => {
    expect(sanitizeFactTables([9, 6, 9, 13, "7"])).toEqual([6, 9]);
  });

  it("accepts only valid table and range route values", () => {
    expect(parseFactTables("6,7,8")).toEqual([6, 7, 8]);
    expect(parseFactTables("6,20")).toBeUndefined();
    expect(parseFactTables("")).toBeUndefined();
    expect(parsePracticeRange("100")).toBe(100);
    expect(parsePracticeRange("25")).toBeUndefined();
    expect(parsePracticeNumberRange("25")).toBe(25);
    expect(parseFactNumberLimit("12")).toBe(12);
    expect(parseFactNumberLimit("13")).toBe(13);
    expect(parseFactNumberLimit("101")).toBeUndefined();
  });
});
