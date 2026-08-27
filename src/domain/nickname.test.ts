import { describe, expect, it } from "vitest";
import { normalizeNickname } from "./nickname";

describe("nickname", () => {
  it("allows blank values and collapses whitespace", () => {
    expect(normalizeNickname(null)).toBe("");
    expect(normalizeNickname("   ")).toBe("");
    expect(normalizeNickname("  Jo   Jo  ")).toBe("Jo Jo");
  });
  it("normalizes accents and removes control and direction overrides", () => {
    expect(normalizeNickname("Jose\u0301\u202e\u0000")).toBe("José");
  });
  it("limits length without splitting surrogate pairs", () => {
    expect(normalizeNickname("a".repeat(30))).toHaveLength(20);
    expect(Array.from(normalizeNickname("🐧".repeat(21)))).toHaveLength(20);
  });
});
