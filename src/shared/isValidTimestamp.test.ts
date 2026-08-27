import { expect, it } from "vitest";
import { isValidTimestamp } from "./isValidTimestamp";

it("accepts integer timestamps within Date's range, including epoch and future dates", () => {
  for (const value of [0, Date.now(), 8640000000000000]) expect(isValidTimestamp(value)).toBe(true);
});

it("rejects wrong types, fractions, negatives, and out-of-range dates", () => {
  for (const value of [null, undefined, "123", {}, NaN, Infinity, -1, 1.5, 8640000000000001]) {
    expect(isValidTimestamp(value)).toBe(false);
  }
});
