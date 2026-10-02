import { describe, expect, it } from "vitest";

import {
  createLearnerId,
  defaultProfileColorId,
  isDuplicateLearnerDisplayName,
  learnerDisplayName,
  nextAvailableLearnerDefaultName,
  nextAvailableProfileColorId,
  sanitizeLearner,
  MAX_LOCAL_LEARNERS,
} from "./learner";

describe("local learner identity", () => {
  it("creates a local-only stable identifier without using a nickname as identity", () => {
    expect(createLearnerId(1000, () => 0.5)).toBe("learner-rs-zik0zk");
  });

  it("validates persisted learner records and normalizes nicknames", () => {
    expect(sanitizeLearner({ id: "learner-one", nickname: "  Jo\n", defaultName: "Learner 1", createdAtMs: 10 }))
      .toEqual({ id: "learner-one", nickname: "Jo", defaultName: "Learner 1", colorId: defaultProfileColorId("learner-one"), createdAtMs: 10 });
    expect(sanitizeLearner({ id: "bad/id", nickname: "Jo", createdAtMs: 10 })).toBeNull();
    expect(MAX_LOCAL_LEARNERS).toBe(8);
  });

  it("assigns a stable fallback color and chooses an unused color for a new learner", () => {
    expect(defaultProfileColorId("learner-one")).toBe(defaultProfileColorId("learner-one"));
    expect(nextAvailableProfileColorId([{ id: "learner-one", nickname: "Jo", defaultName: "Learner 1", colorId: "violet", createdAtMs: 1 }])).toBe("sky");
  });

  it("does not allow explicit names that duplicate a blank learner's displayed label", () => {
    const learners = [
      { id: "learner-one", nickname: "", defaultName: "Learner 1", colorId: "violet" as const, createdAtMs: 1 },
    ];

    expect(isDuplicateLearnerDisplayName("Learner 1", learners)).toBe(true);
    expect(isDuplicateLearnerDisplayName("Learner 2", learners, undefined, "Learner 2")).toBe(false);
  });

  it("does not create a blank learner whose fallback label duplicates an existing nickname", () => {
    const learners = [
      { id: "learner-one", nickname: "Learner 2", defaultName: "Learner 1", colorId: "violet" as const, createdAtMs: 1 },
    ];

    expect(isDuplicateLearnerDisplayName("", learners, undefined, "Learner 2")).toBe(true);
  });

  it("reserves a nicknamed learner's hidden fallback name for future profiles", () => {
    const learners = [
      { id: "learner-one", nickname: "Jo", defaultName: "Learner 1", colorId: "violet" as const, createdAtMs: 1 },
    ];

    expect(nextAvailableLearnerDefaultName(learners)).toBe("Learner 2");
  });

  it("allows a nickname to be cleared when another learner has the same hidden fallback", () => {
    const learners = [
      { id: "learner-one", nickname: "Jo", defaultName: "Learner 1", colorId: "violet" as const, createdAtMs: 1 },
      { id: "learner-two", nickname: "Ari", defaultName: "Learner 1", colorId: "sky" as const, createdAtMs: 2 },
    ];

    expect(isDuplicateLearnerDisplayName("", learners, "learner-one")).toBe(false);
  });

  it("does not allow a new nickname to take another learner's hidden fallback", () => {
    const learners = [
      { id: "learner-one", nickname: "Jo", defaultName: "Learner 1", colorId: "violet" as const, createdAtMs: 1 },
      { id: "learner-two", nickname: "Ari", defaultName: "Learner 2", colorId: "sky" as const, createdAtMs: 2 },
    ];

    expect(isDuplicateLearnerDisplayName("Learner 2", learners, "learner-one")).toBe(true);
  });

  it("keeps an unnamed learner's fallback name stable after an earlier learner is removed", () => {
    const learners = [
      { id: "learner-one", nickname: "", defaultName: "Learner 1", colorId: "violet" as const, createdAtMs: 1 },
      { id: "learner-two", nickname: "", defaultName: "Learner 2", colorId: "sky" as const, createdAtMs: 2 },
    ];
    const remaining = learners.slice(1);

    expect(learnerDisplayName(remaining[0], remaining)).toBe("Learner 2");
    expect(nextAvailableLearnerDefaultName(remaining)).toBe("Learner 1");
  });
});
