import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  effect: undefined as undefined | (() => void | (() => void)),
  change: undefined as undefined | ((state: string) => void),
  remove: vi.fn(),
}));
vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => { harness.effect = effect; },
}));
vi.mock("react-native", () => ({
  AppState: {
    currentState: "active",
    addEventListener: (_event: string, callback: (state: string) => void) => {
      harness.change = callback;
      return { remove: harness.remove };
    },
  },
}));

import { INTRO_DURATION_MS, useIntroAdvance } from "./useIntroAdvance";

let cleanup: void | (() => void);
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  vi.useRealTimers();
});
function start(ready = true) {
  const complete = vi.fn();
  useIntroAdvance(ready, complete);
  cleanup = harness.effect!();
  return complete;
}

describe("Benster intro timing", () => {
  it("does not start before the image is ready", () => {
    const complete = start(false);
    vi.advanceTimersByTime(5000);
    expect(complete).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("advances once after the brief image hold", () => {
    const complete = start();
    vi.advanceTimersByTime(INTRO_DURATION_MS - 1);
    expect(complete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(complete).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(5000);
    expect(complete).toHaveBeenCalledOnce();
  });

  it("waits while backgrounded and restarts on return", () => {
    const complete = start();
    vi.advanceTimersByTime(500);
    harness.change!("background");
    vi.advanceTimersByTime(5000);
    expect(complete).not.toHaveBeenCalled();
    harness.change!("active");
    vi.advanceTimersByTime(INTRO_DURATION_MS);
    expect(complete).toHaveBeenCalledOnce();
  });

  it("cancels the timer and listener on unmount", () => {
    const complete = start();
    cleanup?.();
    cleanup = undefined;
    vi.advanceTimersByTime(5000);
    expect(complete).not.toHaveBeenCalled();
    expect(harness.remove).toHaveBeenCalledOnce();
  });
});
