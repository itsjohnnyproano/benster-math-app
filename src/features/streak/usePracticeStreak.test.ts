import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the hook's actual focus/foreground callbacks without loading native
// modules. React rendering and device event delivery still need native checks.
const harness = vi.hoisted(() => ({
  focus: undefined as undefined | (() => () => void),
  appState: undefined as undefined | ((state: string) => void),
  publish: vi.fn(),
  retry: vi.fn(),
  remove: vi.fn(),
  load: vi.fn<() => Promise<number[]>>(),
  stateIndex: 0,
}));
vi.mock("react", () => ({
  useCallback: (callback: unknown) => callback,
  useState: (initial: unknown) => [initial, harness.stateIndex++ === 0 ? harness.publish : harness.retry],
}));
vi.mock("expo-router", () => ({ useFocusEffect: (effect: () => () => void) => { harness.focus = effect; } }));
vi.mock("react-native", () => ({ AppState: { addEventListener: (_: string, callback: (state: string) => void) => {
  harness.appState = callback;
  return { remove: harness.remove };
} } }));
vi.mock("@/data/results/resultsRepository", () => ({ resultsRepository: { listCompletionTimes: harness.load } }));

import { usePracticeStreak } from "./usePracticeStreak";

let cleanup: (() => void) | undefined;
function focus() {
  harness.stateIndex = 0;
  const hook = usePracticeStreak();
  cleanup = harness.focus!();
  return hook;
}
function deferred() {
  let resolve!: (value: number[]) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<number[]>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 27, 12));
  vi.clearAllMocks();
  harness.load.mockReset().mockResolvedValue([]);
});
afterEach(() => { cleanup?.(); cleanup = undefined; vi.useRealTimers(); });

describe("streak lifecycle callbacks", () => {
  it("loads on focus and refreshes only when returning active", async () => {
    focus();
    await flush();
    expect(harness.load).toHaveBeenCalledTimes(1);
    harness.appState!("background");
    expect(harness.load).toHaveBeenCalledTimes(1);
    harness.load.mockResolvedValue([Date.now()]);
    harness.appState!("active");
    await flush();
    expect(harness.publish).toHaveBeenLastCalledWith(expect.objectContaining({ status: "ready", data: expect.objectContaining({ currentStreak: 1 }) }));
    expect(vi.getTimerCount()).toBe(1);
  });

  it("refreshes at local midnight and keeps yesterday's streak active", async () => {
    vi.setSystemTime(new Date(2026, 7, 27, 23, 59, 59));
    harness.load.mockResolvedValue([Date.now()]);
    focus();
    await flush();
    await vi.advanceTimersByTimeAsync(1050);
    expect(harness.load).toHaveBeenCalledTimes(2);
    expect(harness.publish).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ currentStreak: 1, practicedToday: false }) }));
  });

  it("ignores an older success after a newer request completes", async () => {
    const old = deferred();
    harness.load.mockReturnValueOnce(old.promise).mockResolvedValue([Date.now()]);
    focus();
    harness.appState!("active");
    await flush();
    const updates = harness.publish.mock.calls.length;
    old.resolve([]);
    await flush();
    expect(harness.publish).toHaveBeenCalledTimes(updates);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("ignores an older failure after a newer request succeeds", async () => {
    const old = deferred();
    harness.load.mockReturnValueOnce(old.promise);
    focus();
    harness.appState!("active");
    await flush();
    old.reject(new Error("Old failure"));
    await flush();
    expect(harness.publish).toHaveBeenLastCalledWith(expect.objectContaining({ status: "ready" }));
  });

  it("cleans listeners/timers on blur and ignores pending completion", async () => {
    const pending = deferred();
    harness.load.mockReturnValueOnce(pending.promise);
    focus();
    cleanup!();
    cleanup = undefined;
    const updates = harness.publish.mock.calls.length;
    pending.resolve([Date.now()]);
    await flush();
    expect(harness.publish).toHaveBeenCalledTimes(updates);
    expect(harness.remove).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears a scheduled midnight refresh when leaving the screen", async () => {
    focus();
    await flush();
    cleanup!();
    cleanup = undefined;
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(86400000);
    expect(harness.load).toHaveBeenCalledTimes(1);
  });

  it("surfaces failure and can load again on the retry focus effect", async () => {
    harness.load.mockRejectedValueOnce(new Error("Unavailable"));
    const hook = focus();
    await flush();
    expect(harness.publish).toHaveBeenLastCalledWith({ status: "error" });
    hook.retry();
    expect(harness.retry.mock.calls[0][0](0)).toBe(1);
    cleanup!();
    focus();
    await flush();
    expect(harness.publish).toHaveBeenLastCalledWith(expect.objectContaining({ status: "ready" }));
  });
});
