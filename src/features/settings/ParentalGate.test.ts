import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const hooks = vi.hoisted(() => ({ states: [] as unknown[], refs: [] as { current: unknown }[], stateIndex: 0, refIndex: 0 }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const i = hooks.stateIndex++;
    if (!(i in hooks.states)) hooks.states[i] = typeof initial === "function" ? initial() : initial;
    return [hooks.states[i], (value: unknown) => { hooks.states[i] = value; }];
  },
  useRef: (initial: unknown) => hooks.refs[hooks.refIndex++] ??= { current: initial },
  useEffect: () => {},
  useCallback: (callback: unknown) => callback,
}));
vi.mock("react-native", () => ({
  AccessibilityInfo: { announceForAccessibility: vi.fn() },
  Animated: { View: "AnimatedView" },
  Keyboard: { dismiss: vi.fn() }, KeyboardAvoidingView: "KeyboardAvoidingView",
  Modal: "Modal", Platform: { OS: "ios", select: (options: { ios: unknown }) => options.ios }, Pressable: "Pressable", ScrollView: "ScrollView",
  StyleSheet: { create: (value: unknown) => value }, Text: "Text", TextInput: "TextInput", View: "View",
  useAnimatedValue: () => ({ stopAnimation: vi.fn(), setValue: vi.fn() }),
}));
vi.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
import { ParentalGate } from "./ParentalGate";

type Props = { children?: ReactNode; value?: string; onChangeText?: (value: string) => void; onPress?: () => void };
function find(node: ReactNode, type: string): ReactElement<Props>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<Props>(child)) return [];
    return [...(child.type === type ? [child] : []), ...find(child.props.children, type)];
  });
}
function render(onResolved: (approved: boolean) => void) {
  hooks.stateIndex = 0; hooks.refIndex = 0;
  return ParentalGate({ onResolved });
}
beforeEach(() => { hooks.states = []; hooks.refs = []; vi.restoreAllMocks(); vi.spyOn(Math, "random").mockReturnValue(0); });

describe("native parental gate", () => {
  it("waits for iOS dismissal before delivering approval and ignores repeated Submit", () => {
    const done = vi.fn();
    let tree = render(done);
    find(tree, "TextInput")[0].props.onChangeText!("36");
    tree = render(done);
    find(tree, "Pressable")[1].props.onPress!();
    find(tree, "Pressable")[1].props.onPress!();
    tree = render(done);
    expect(tree.props.visible).toBe(false);
    expect(done).not.toHaveBeenCalled();
    tree.props.onDismiss!(); tree.props.onDismiss!();
    expect(done).toHaveBeenCalledExactlyOnceWith(true);
  });
  it("clears incorrect input and changes the challenge without authorizing", () => {
    const done = vi.fn();
    let tree = render(done);
    find(tree, "TextInput")[0].props.onChangeText!("35");
    tree = render(done);
    find(tree, "Pressable")[1].props.onPress!();
    tree = render(done);
    expect(find(tree, "TextInput")[0].props.value).toBe("");
    expect(tree.props.visible).toBe(true);
    expect(done).not.toHaveBeenCalled();
    // Constant randomness still produces a new answer: 6×7 instead of 6×6.
    find(tree, "TextInput")[0].props.onChangeText!("42");
    tree = render(done);
    find(tree, "Pressable")[1].props.onPress!();
    render(done).props.onDismiss!();
    expect(done).toHaveBeenCalledExactlyOnceWith(true);
  });
  it("Cancel dismisses without approval", () => {
    const done = vi.fn();
    const tree = render(done);
    find(tree, "Pressable")[0].props.onPress!();
    render(done).props.onDismiss!();
    expect(done).toHaveBeenCalledExactlyOnceWith(false);
  });
});
