import { describe, expect, it } from "vitest";

import { createLearnerId, sanitizeLearner, MAX_LOCAL_LEARNERS } from "./learner";

describe("local learner identity", () => {
  it("creates a local-only stable identifier without using a nickname as identity", () => {
    expect(createLearnerId(1000, () => 0.5)).toBe("learner-rs-zik0zk");
  });

  it("validates persisted learner records and normalizes nicknames", () => {
    expect(sanitizeLearner({ id: "learner-one", nickname: "  Jo\n", createdAtMs: 10 }))
      .toEqual({ id: "learner-one", nickname: "Jo", createdAtMs: 10 });
    expect(sanitizeLearner({ id: "bad/id", nickname: "Jo", createdAtMs: 10 })).toBeNull();
    expect(MAX_LOCAL_LEARNERS).toBe(8);
  });
});
