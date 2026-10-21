import { describe, expect, it } from "vitest";

import { formatResponseTime } from "@/shared/formatResponseTime";
import { makeResult } from "@/test/resultFixture";
import { getResultPresentation } from "./resultPresentation";

describe("result presentation", () => {
  it("keeps early perfect practice encouraging without presenting it as an earned perfect sprint", () => {
    expect(getResultPresentation(makeResult(3, 3))).toMatchObject({
      mascot: "thumbs-up",
      title: "Perfect Start!",
      message: "3 for 3 correct! Get at least 10 answers correct with no mistakes in your next sprint to earn a Perfect Sprint.",
    });
    expect(getResultPresentation(makeResult(5, 5))).toMatchObject({
      mascot: "thumbs-up",
      title: "Perfect Start!",
      message: "5 for 5 correct! Get at least 10 answers correct with no mistakes in your next sprint to earn a Perfect Sprint.",
    });
  });

  it("uses a distinct high-tier presentation only after a meaningful number of answers", () => {
    expect(getResultPresentation(makeResult(3, 5))).toMatchObject({
      mascot: "fallen",
      title: "Keep Growing!",
    });
    expect(getResultPresentation(makeResult(4, 5))).toMatchObject({
      mascot: "thumbs-up",
      title: "Nice Work!",
    });
    expect(getResultPresentation(makeResult(9, 10))).toMatchObject({
      mascot: "celebrate",
      title: "Amazing Focus!",
    });
    expect(getResultPresentation(makeResult(10, 10))).toMatchObject({
      mascot: "perfect",
      title: "Perfect Sprint!",
    });
    expect(getResultPresentation(makeResult(20, 20))).toMatchObject({
      mascot: "perfect",
      title: "Math Superstar!",
    });
  });

  it("formats response times without changing the empty state", () => {
    expect(formatResponseTime(2800 / 3)).toBe("0.9 sec");
    expect(formatResponseTime(0)).toBe("0.0 sec");
    expect(formatResponseTime(null)).toBe("—");
  });
});
