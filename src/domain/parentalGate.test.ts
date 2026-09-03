import { describe, expect, it } from "vitest";
import { createParentalChallenge, isParentalAnswerCorrect } from "./parentalGate";

describe("parental challenge", () => {
  it("covers all operand pairs between 6 and 12", () => {
    const pairs = new Set<string>();
    for (let index = 0; index < 49; index++) {
      const challenge = createParentalChallenge(undefined, () => (index + 0.5) / 49);
      expect(challenge.left).toBeGreaterThanOrEqual(6);
      expect(challenge.left).toBeLessThanOrEqual(12);
      expect(challenge.right).toBeGreaterThanOrEqual(6);
      expect(challenge.right).toBeLessThanOrEqual(12);
      pairs.add(`${challenge.left},${challenge.right}`);
    }
    expect(pairs.size).toBe(49);
  });
  it("always changes the problem and answer on retry without a random retry loop", () => {
    for (let left = 6; left <= 12; left++) {
      for (let right = 6; right <= 12; right++) {
        for (let i = 0; i < 49; i++) {
          const next = createParentalChallenge({ left, right }, () => i / 49);
          expect(next.left * next.right).not.toBe(left * right);
        }
      }
    }
  });
  it("accepts only a complete numeric answer", () => {
    const challenge = { left: 7, right: 8 };
    expect(isParentalAnswerCorrect(challenge, "56")).toBe(true);
    expect(isParentalAnswerCorrect(challenge, " 56 ")).toBe(true);
    for (const value of ["", " ", "55", "56abc", "56.0", "5.6e1", "+56", "0056"]) {
      expect(isParentalAnswerCorrect(challenge, value)).toBe(false);
    }
  });
});
