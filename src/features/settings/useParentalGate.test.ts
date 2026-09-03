import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  state: null as unknown,
  ref: { current: null as unknown },
  focus: undefined as undefined | (() => () => void),
}));
vi.mock("react", () => ({
  useState: () => [hooks.state, (value: unknown) => { hooks.state = value; }],
  useRef: () => hooks.ref,
  useCallback: (callback: unknown) => callback,
}));
vi.mock("expo-router", () => ({ useFocusEffect: (effect: () => () => void) => { hooks.focus = effect; } }));
import { useParentalGate } from "./useParentalGate";

beforeEach(() => { hooks.state = null; hooks.ref.current = null; });

describe("protected settings action lifecycle", () => {
  it("does not execute until approval, then executes exactly once", () => {
    const action = vi.fn();
    useParentalGate().request(action);
    const gate = useParentalGate();
    expect(gate.visible).toBe(true);
    expect(action).not.toHaveBeenCalled();
    gate.onResolved(true);
    gate.onResolved(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(useParentalGate().visible).toBe(false);
  });
  it("ignores rapid competing requests instead of changing the intended action", () => {
    const first = vi.fn();
    const second = vi.fn();
    const gate = useParentalGate();
    gate.request(first);
    gate.request(second);
    useParentalGate().onResolved(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
  it("cancels without running anything and requires approval again next time", () => {
    const action = vi.fn();
    useParentalGate().request(action);
    const cancelled = useParentalGate();
    cancelled.onResolved(false);
    useParentalGate().request(action);
    cancelled.onResolved(true);
    expect(action).not.toHaveBeenCalled();
    expect(useParentalGate().visible).toBe(true);
    useParentalGate().onResolved(true);
    expect(action).toHaveBeenCalledTimes(1);
  });
  it("discards pending approval on blur/unmount", () => {
    const action = vi.fn();
    useParentalGate().request(action);
    const gate = useParentalGate();
    hooks.focus!()();
    gate.onResolved(true);
    expect(action).not.toHaveBeenCalled();
    expect(useParentalGate().visible).toBe(false);
  });
});
