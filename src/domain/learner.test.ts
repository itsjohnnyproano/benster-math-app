import { describe, expect, it } from "vitest";

import {
  createLearnerId,
  defaultProfileColorId,
  isDuplicateLearnerDisplayName,
  nextAvailableProfileColorId,
  sanitizeLearner,
  MAX_LOCAL_LEARNERS,
} from "./learner";

describe("local learner identity", () => {
  it("creates a local-only stable identifier without using a nickname as identity", () => {
    expect(createLearnerId(1000, () => 0.5)).toBe("learner-rs-zik0zk");
  });

  it("validates persisted learner records and normalizes nicknames", () => {
    expect(sanitizeLearner({ id: "learner-one", nickname: "  Jo\n", createdAtMs: 10 }))
      .toEqual({ id: "learner-one", nickname: "Jo", colorId: defaultProfileColorId("learner-one"), createdAtMs: 10 });
    expect(sanitizeLearner({ id: "bad/id", nickname: "Jo", createdAtMs: 10 })).toBeNull();
    expect(MAX_LOCAL_LEARNERS).toBe(8);
  });

  it("assigns a stable fallback color and chooses an unused color for a new learner", () => {
    expect(defaultProfileColorId("learner-one")).toBe(defaultProfileColorId("learner-one"));
    expect(nextAvailableProfileColorId([{ id: "learner-one", nickname: "Jo", colorId: "violet", createdAtMs: 1 }])).toBe("sky");
  });

  it("does not allow explicit names that duplicate a blank learner's displayed label", () => {
    const learners = [
      { id: "learner-one", nickname: "", colorId: "violet" as const, createdAtMs: 1 },
    ];

    expect(isDuplicateLearnerDisplayName("Learner 1", learners)).toBe(true);
    expect(isDuplicateLearnerDisplayName("Learner 2", learners)).toBe(false);
  });

  it("does not create a blank learner whose fallback label duplicates an existing nickname", () => {
    const learners = [
      { id: "learner-one", nickname: "Learner 2", colorId: "violet" as const, createdAtMs: 1 },
    ];

    expect(isDuplicateLearnerDisplayName("", learners)).toBe(true);
  });
});
