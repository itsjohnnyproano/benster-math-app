import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ value: undefined as unknown }));
vi.mock("react", () => ({
  useState: (initialize: () => unknown) => {
    state.value ??= initialize();
    return [state.value];
  },
}));
// Deliberately omit useAnimatedValue: React Native Web does not export it.
vi.mock("react-native", () => ({
  Animated: { Value: class { constructor(public initialValue: number) {} } },
}));

import { useAnimatedValue } from "./useAnimatedValue.web";

beforeEach(() => { state.value = undefined; });

describe("web animation value", () => {
  it("creates an animation without the native-only hook", () => {
    expect(useAnimatedValue(520)).toMatchObject({ initialValue: 520 });
  });

  it("preserves the value between renders instead of restarting the animation", () => {
    const first = useAnimatedValue(0);
    expect(useAnimatedValue(100)).toBe(first);
  });
});
