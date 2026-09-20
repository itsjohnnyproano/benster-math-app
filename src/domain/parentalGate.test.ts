import { describe, expect, it } from "vitest";
import { createParentalChallenge, isParentalAnswerCorrect } from "./parentalGate";

describe("parental challenge", () => {
  it("covers all adult-level operand pairs", () => {
    const pairs = new Set<string>();
    for (let index = 0; index < 49; index++) {
      const challenge = createParentalChallenge(undefined, () => (index + 0.5) / 49);
      expect(challenge.left).toBeGreaterThanOrEqual(13);
      expect(challenge.left).toBeLessThanOrEqual(19);
      expect(challenge.right).toBeGreaterThanOrEqual(17);
      expect(challenge.right).toBeLessThanOrEqual(23);
      pairs.add(`${challenge.left},${challenge.right}`);
    }
    expect(pairs.size).toBe(49);
  });
  it("always changes the problem and answer on retry without a random retry loop", () => {
    for (let left = 13; left <= 19; left++) {
      for (let right = 17; right <= 23; right++) {
        for (let i = 0; i < 49; i++) {
          const next = createParentalChallenge({ left, right }, () => i / 49);
          expect(next.left * next.right).not.toBe(left * right);
        }
      }
    }
  });
  it("accepts only a complete numeric answer", () => {
    const challenge = { left: 17, right: 19 };
    expect(isParentalAnswerCorrect(challenge, "323")).toBe(true);
    expect(isParentalAnswerCorrect(challenge, " 323 ")).toBe(true);
    for (const value of ["", " ", "322", "323abc", "323.0", "3.23e2", "+323", "0323"]) {
      expect(isParentalAnswerCorrect(challenge, value)).toBe(false);
    }
  });
});
