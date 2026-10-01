import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }));
vi.mock("expo-sqlite/kv-store", () => ({ default: storage }));

import { loadLearnerRegistry, sanitizeLearnerRegistry } from "./learnersRepository";

beforeEach(() => {
  storage.getItem.mockReset().mockResolvedValue(null);
  storage.setItem.mockReset().mockResolvedValue(undefined);
  storage.removeItem.mockReset().mockResolvedValue(undefined);
});

describe("learner registry", () => {
  it("creates one legacy learner for an existing device and preserves its nickname", async () => {
    await expect(loadLearnerRegistry("Jo")).resolves.toEqual({
      activeLearnerId: "legacy-learner",
      learners: [{ id: "legacy-learner", nickname: "Jo", createdAtMs: 0 }],
    });
  });

  it("rejects a corrupt or oversized registry rather than trusting it", () => {
    expect(sanitizeLearnerRegistry({ learners: [], activeLearnerId: "missing" }, "Jo").learners).toHaveLength(1);
    expect(sanitizeLearnerRegistry({
      activeLearnerId: "learner-one",
      learners: Array.from({ length: 9 }, (_, index) => ({ id: `learner-${index}a`, nickname: "", createdAtMs: index })),
    }, "Jo").learners).toHaveLength(1);
  });

  it("surfaces malformed stored JSON for explicit recovery", async () => {
    storage.getItem.mockResolvedValue("not json");
    await expect(loadLearnerRegistry()).rejects.toThrow("could not be read");
  });
});
