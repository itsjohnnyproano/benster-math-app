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

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }));
vi.mock("expo-sqlite/kv-store", () => ({ default: storage }));

import { DEFAULT_PREFERENCES } from "@/data/preferences/preferenceDefaults";
import { PreferencesProvider } from "./PreferencesProvider";

function render() {
  hooks.stateIndex = 0;
  hooks.refIndex = 0;
  return PreferencesProvider({ children: null }).props.value;
}
async function mount() {
  render();
  const cleanup = hooks.effect!();
  await Promise.resolve();
  await Promise.resolve();
  return { value: render(), cleanup };
}

beforeEach(() => {
  hooks.states = [];
  hooks.refs = [];
  vi.clearAllMocks();
  storage.getItem.mockReset().mockResolvedValue(null);
  storage.setItem.mockReset().mockResolvedValue(undefined);
  storage.removeItem.mockReset().mockResolvedValue(undefined);
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
    expect(storage.setItem).toHaveBeenCalledOnce();
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
    expect(storage.removeItem).toHaveBeenCalledOnce();
    cleanup();
  });
});
