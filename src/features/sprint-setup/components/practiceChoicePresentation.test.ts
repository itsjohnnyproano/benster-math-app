import { describe, expect, it } from "vitest";

import { getRangeExamples } from "./practiceChoicePresentation";

describe("practice choice presentation", () => {
  it("keeps custom-range previews within the selected addition and subtraction limits", () => {
    expect(getRangeExamples("addition", 1)).toEqual(["0 + 1", "0 + 1", "1 + 0"]);
    expect(getRangeExamples("subtraction", 1)).toEqual(["1 − 0", "0 − 0", "1 − 0"]);
    expect(getRangeExamples("addition", 100)).toEqual(["50 + 50", "99 + 1", "100 + 0"]);
    expect(getRangeExamples("subtraction", 100)).toEqual(["100 − 50", "50 − 25", "50 − 0"]);
  });
});
