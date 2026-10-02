import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  stateIndex: 0,
  refIndex: 0,
  effect: undefined as undefined | (() => () => void),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.stateIndex++;
    if (!(index in hooks.states)) hooks.states[index] = initial;
    return [hooks.states[index], (value: unknown) => {
      hooks.states[index] = typeof value === "function" ? value(hooks.states[index]) : value;
    }];
  },
  useRef: (initial: unknown) => {
    const index = hooks.refIndex++;
    return hooks.refs[index] ??= { current: initial };
  },
  useEffect: (effect: () => () => void) => { hooks.effect = effect; },
  useMemo: (factory: () => unknown) => factory(),
}));

const storage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  getAllKeys: vi.fn(),
  multiRemove: vi.fn(),
}));
vi.mock("expo-sqlite/kv-store", () => ({ default: storage }));

import { DEFAULT_PREFERENCES } from "@/data/preferences/preferenceDefaults";
import { defaultProfileColorId, LEGACY_LEARNER_ID } from "@/domain/learner";
import { PreferencesProvider } from "./PreferencesProvider";

function render() {
  hooks.stateIndex = 0;
  hooks.refIndex = 0;
  return PreferencesProvider({ children: null }).props.value;
}
async function mount() {
  render();
  const cleanup = hooks.effect!();
  // Profile startup validates legacy preferences, then its learner registry,
  // then the active learner's scoped preferences.
  for (let index = 0; index < 20; index++) await Promise.resolve();
  return { value: render(), cleanup };
}

beforeEach(() => {
  hooks.states = [];
  hooks.refs = [];
  vi.clearAllMocks();
  storage.getItem.mockReset().mockResolvedValue(null);
  storage.setItem.mockReset().mockResolvedValue(undefined);
  storage.removeItem.mockReset().mockResolvedValue(undefined);
  storage.getAllKeys.mockReset().mockResolvedValue([]);
  storage.multiRemove.mockReset().mockResolvedValue(undefined);
});

describe("onboarding preference commit", () => {
  it("waits for storage before publishing completion and the normalized nickname", async () => {
    let resolve!: () => void;
    storage.setItem.mockReturnValueOnce(new Promise<void>((done) => { resolve = done; }));
    const { value, cleanup } = await mount();
    const pending = value.completeOnboarding("  Jo\n ");
    expect(render().preferences.onboardingCompleted).toBe(false);
    expect(render().saveStatus).toBe("saving");
    await Promise.resolve();
    resolve();
    await pending;
    expect(render().preferences).toEqual({ ...DEFAULT_PREFERENCES, nickname: "Jo", onboardingCompleted: true });
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it("leaves completion false on failure and allows retry", async () => {
    const { value, cleanup } = await mount();
    storage.setItem.mockRejectedValueOnce(new Error("Full"));
    await expect(value.completeOnboarding("Jo")).rejects.toThrow("Full");
    expect(render().preferences.onboardingCompleted).toBe(false);
    expect(render().saveStatus).toBe("error");
    await render().completeOnboarding("Jo");
    expect(render().preferences.onboardingCompleted).toBe(true);
    cleanup();
  });

  it("preserves existing practice choices and accepts a blank nickname", async () => {
    storage.getItem.mockResolvedValue(JSON.stringify({ ...DEFAULT_PREFERENCES, durationSeconds: 30, cardLayout: "both" }));
    const { value, cleanup } = await mount();
    await value.completeOnboarding("");
    expect(render().preferences).toMatchObject({ nickname: "", durationSeconds: 30, cardLayout: "both", onboardingCompleted: true });
    cleanup();
  });

  it("does not publish an in-flight completion after unmounting", async () => {
    let resolve!: () => void;
    storage.setItem.mockReturnValueOnce(new Promise<void>((done) => { resolve = done; }));
    const { value, cleanup } = await mount();
    const pending = value.completeOnboarding("Jo");
    cleanup();
    await Promise.resolve();
    resolve();
    await pending;
    expect(render().preferences.onboardingCompleted).toBe(false);
  });

  it("rejects completion before preferences load", async () => {
    await expect(render().completeOnboarding("Jo")).rejects.toThrow("not ready");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("clears completion with Delete all saved data", async () => {
    const { value, cleanup } = await mount();
    await value.completeOnboarding("Jo");
    await render().deleteAllPreferences();
    expect(render().preferences).toEqual(DEFAULT_PREFERENCES);
    expect(render().activeLearner.colorId).toBe(defaultProfileColorId(LEGACY_LEARNER_ID));
    expect(storage.removeItem).toHaveBeenCalledTimes(3);
    cleanup();
  });

  it("serializes rapid learner additions so both profiles remain in the registry", async () => {
    storage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({
        activeLearnerId: LEGACY_LEARNER_ID,
        learners: [{ id: LEGACY_LEARNER_ID, nickname: "Jo", colorId: "sky", createdAtMs: 0 }],
      }))
      .mockResolvedValueOnce(null);
    const { value, cleanup } = await mount();
    await Promise.all([value.addLearner("Ari"), value.addLearner("Bea")]);
    expect(render().learners.map((learner: { nickname: string }) => learner.nickname)).toEqual(["Jo", "Ari", "Bea"]);
    cleanup();
  });

  it("preserves a color change made alongside a new learner", async () => {
    storage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({
        activeLearnerId: LEGACY_LEARNER_ID,
        learners: [{ id: LEGACY_LEARNER_ID, nickname: "Jo", colorId: "sky", createdAtMs: 0 }],
      }))
      .mockResolvedValueOnce(null);
    const { value, cleanup } = await mount();

    await Promise.all([
      value.updateLearnerColor(LEGACY_LEARNER_ID, "coral"),
      value.addLearner("Ari"),
    ]);

    expect(render().learners).toMatchObject([
      { id: LEGACY_LEARNER_ID, colorId: "coral" },
      { nickname: "Ari" },
    ]);
    cleanup();
  });

  it("preserves a color change made alongside a learner rename", async () => {
    storage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({
        activeLearnerId: LEGACY_LEARNER_ID,
        learners: [{ id: LEGACY_LEARNER_ID, nickname: "Jo", colorId: "sky", createdAtMs: 0 }],
      }))
      .mockResolvedValueOnce(null);
    const { value, cleanup } = await mount();

    await Promise.all([
      value.updateLearnerColor(LEGACY_LEARNER_ID, "coral"),
      value.renameActiveLearner("Neo"),
    ]);

    expect(render().learners).toMatchObject([
      { id: LEGACY_LEARNER_ID, nickname: "Neo", colorId: "coral" },
    ]);
    cleanup();
  });

  it("preserves a color change made alongside switching learners", async () => {
    storage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({
        activeLearnerId: LEGACY_LEARNER_ID,
        learners: [
          { id: LEGACY_LEARNER_ID, nickname: "Jo", colorId: "sky", createdAtMs: 0 },
          { id: "ari", nickname: "Ari", colorId: "coral", createdAtMs: 1 },
        ],
      }))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const { value, cleanup } = await mount();

    await Promise.all([
      value.updateLearnerColor(LEGACY_LEARNER_ID, "violet"),
      value.switchLearner("ari"),
    ]);

    expect(render().activeLearner.id).toBe("ari");
    expect(render().learners.find((learner: { id: string }) => learner.id === LEGACY_LEARNER_ID)).toMatchObject({
      id: LEGACY_LEARNER_ID,
      colorId: "violet",
    });
    cleanup();
  });

  it("keeps the registry removal when its preference cleanup fails", async () => {
    storage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({
        activeLearnerId: LEGACY_LEARNER_ID,
        learners: [
          { id: LEGACY_LEARNER_ID, nickname: "Jo", colorId: "sky", createdAtMs: 0 },
          { id: "ari", nickname: "Ari", colorId: "coral", createdAtMs: 1 },
        ],
      }))
      .mockResolvedValueOnce(null);
    const { value, cleanup } = await mount();
    storage.removeItem.mockRejectedValueOnce(new Error("Full"));

    await expect(value.removeLearner("ari")).resolves.toEqual({ localPreferencesCleared: false });

    expect(render().learners.map((learner: { id: string }) => learner.id)).toEqual([LEGACY_LEARNER_ID]);
    await expect(value.retryRemovedLearnerPreferencesCleanup("ari")).resolves.toBe(true);
    cleanup();
  });

  it("does not persist a learner switch when the selected learner preferences cannot load", async () => {
    storage.getItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({
        activeLearnerId: LEGACY_LEARNER_ID,
        learners: [
          { id: LEGACY_LEARNER_ID, nickname: "Jo", colorId: "sky", createdAtMs: 0 },
          { id: "ari", nickname: "Ari", colorId: "coral", createdAtMs: 1 },
        ],
      }))
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("Unreadable"));
    const { value, cleanup } = await mount();

    await expect(value.switchLearner("ari")).rejects.toThrow("Unreadable");

    expect(render().activeLearner.id).toBe(LEGACY_LEARNER_ID);
    expect(storage.setItem).not.toHaveBeenCalled();
    cleanup();
  });

  it("keeps both a nickname and a practice-setting change made at the same time", async () => {
    const { value, cleanup } = await mount();

    const rename = value.renameActiveLearner("Neo");
    value.updatePreference("durationSeconds", 30);
    await rename;
    for (let index = 0; index < 10; index++) await Promise.resolve();

    expect(render().preferences).toMatchObject({ nickname: "Neo", durationSeconds: 30 });
    const learnerPreferenceWrites = storage.setItem.mock.calls
      .filter(([key]) => typeof key === "string" && key.startsWith("benster:learner-preferences:"));
    expect(JSON.parse(learnerPreferenceWrites.at(-1)![1])).toMatchObject({ nickname: "Neo", durationSeconds: 30 });
    cleanup();
  });

  it("offers an explicit preference reset when saved preferences cannot be read", async () => {
    storage.getItem.mockResolvedValue("not json");
    storage.getAllKeys.mockResolvedValue([
      "benster:learner-preferences:v1:ari",
      "unrelated-key",
    ]);
    const { value, cleanup } = await mount();
    expect(render().loadError).toBe(true);
    expect(render().isReady).toBe(false);
    await value.resetUnreadablePreferences();
    expect(storage.removeItem).toHaveBeenCalledTimes(2);
    expect(storage.multiRemove).toHaveBeenCalledWith(["benster:learner-preferences:v1:ari"]);
    cleanup();
  });
});
