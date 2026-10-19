import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  stateIndex: 0,
  states: [] as unknown[],
}));
const dependencies = vi.hoisted(() => ({ addLearner: vi.fn() }));
const platform = vi.hoisted(() => ({
  OS: "ios",
  select: (values: { default?: unknown }) => values.default,
}));

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: <T,>(initial: T) => {
    const index = hooks.stateIndex++;
    if (!(index in hooks.states)) hooks.states[index] = initial;
    return [hooks.states[index] as T, (value: T | ((current: T) => T)) => {
      hooks.states[index] = typeof value === "function"
        ? (value as (current: T) => T)(hooks.states[index] as T)
        : value;
    }] as const;
  },
}));

vi.mock("react-native", () => ({
  Alert: { alert: vi.fn() },
  Modal: "Modal",
  Platform: platform,
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: "Text",
  TextInput: "TextInput",
  View: "View",
}));
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: "SafeAreaProvider",
  SafeAreaView: "SafeAreaView",
}));
vi.mock("expo-symbols", () => ({ SymbolView: "SymbolView" }));
vi.mock("@/data/results/resultsRepository", () => ({ resultsRepository: { clearAll: vi.fn() } }));
vi.mock("@/providers/PreferencesProvider", () => ({
  usePreferences: () => ({
    learners: [
      {
        id: "jake",
        nickname: "Jake",
        defaultName: "Learner 1",
        colorId: "sky",
        createdAtMs: 1,
      },
      {
        id: "mike",
        nickname: "Mike",
        defaultName: "Learner 2",
        colorId: "violet",
        createdAtMs: 2,
      },
    ],
    activeLearner: {
      id: "jake",
      nickname: "Jake",
      defaultName: "Learner 1",
      colorId: "sky",
      createdAtMs: 1,
    },
    switchLearner: vi.fn(),
    addLearner: dependencies.addLearner,
    removeLearner: vi.fn(),
    retryRemovedLearnerPreferencesCleanup: vi.fn(),
    updateLearnerColor: vi.fn(),
  }),
}));

import { Alert } from "react-native";
import { ManageLearnersModal } from "./ManageLearnersModal";

type ElementProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  onPress?: () => void;
  presentationStyle?: string;
  transparent?: boolean;
  visible?: boolean;
  onDismiss?: () => void;
  disabled?: boolean;
  accessibilityState?: { disabled?: boolean };
};

function find(node: ReactNode, type: string): ReactElement<ElementProps>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<ElementProps>(child)) return [];
    return [...(child.type === type ? [child] : []), ...find(child.props.children, type)];
  });
}

function render(onClose = vi.fn(), onOpen = vi.fn()) {
  hooks.stateIndex = 0;
  return {
    onClose,
    onOpen,
    tree: ManageLearnersModal({ visible: true, tablet: false, onClose, onOpen }),
  };
}

beforeEach(() => {
  hooks.stateIndex = 0;
  hooks.states = [];
  platform.OS = "ios";
  dependencies.addLearner.mockReset();
  dependencies.addLearner.mockResolvedValue(undefined);
  vi.mocked(Alert.alert).mockReset();
});

describe("Manage learners", () => {
  it("shows the destructive deletion confirmation immediately", () => {
    const { tree } = render();
    const deleteButton = find(tree, "Pressable").find(
      (pressable) => pressable.props.accessibilityLabel === "Delete Jake"
    );

    deleteButton?.props.onPress?.();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete learner?",
      expect.stringContaining("Jake"),
      expect.any(Array)
    );
  });

  it("opens Add after the manager dismissal on iOS", () => {
    const onClose = vi.fn();
    let { tree } = render(onClose);
    const addButton = find(tree, "Pressable").find(
      (pressable) => pressable.props.accessibilityLabel === undefined
        && find(pressable, "Text").some((text) => text.props.children === "+ Add a learner")
    );

    addButton?.props.onPress?.();
    expect(onClose).toHaveBeenCalledOnce();
    ({ tree } = render(onClose));
    expect(find(tree, "Modal").find((modal) => modal.props.transparent)?.props.visible).toBe(false);

    ({ tree } = render(onClose));
    const manager = find(tree, "Modal").find((modal) => modal.props.presentationStyle === "fullScreen");
    manager?.props.onDismiss?.();
    ({ tree } = render(onClose));
    expect(find(tree, "Modal").find((modal) => modal.props.transparent)?.props.visible).toBe(true);
  });

  it("opens Add immediately on Android", () => {
    platform.OS = "android";
    const onClose = vi.fn();
    let { tree } = render(onClose);
    const addButton = find(tree, "Pressable").find(
      (pressable) => find(pressable, "Text").some((text) => text.props.children === "+ Add a learner")
    );

    addButton?.props.onPress?.();
    ({ tree } = render(onClose));
    expect(onClose).toHaveBeenCalledOnce();
    expect(find(tree, "Modal").find((modal) => modal.props.transparent)?.props.visible).toBe(true);
  });

  it("does not allow the Add dialog to be cancelled while its save is pending", () => {
    let resolveAdd: (() => void) | undefined;
    dependencies.addLearner.mockImplementation(() => new Promise<void>((resolve) => { resolveAdd = resolve; }));
    const onClose = vi.fn();
    let { tree } = render(onClose);
    const addProfileButton = find(tree, "Pressable").find(
      (pressable) => find(pressable, "Text").some((text) => text.props.children === "+ Add a learner")
    );

    addProfileButton?.props.onPress?.();
    ({ tree } = render(onClose));
    find(tree, "Modal").find((modal) => modal.props.presentationStyle === "fullScreen")?.props.onDismiss?.();
    ({ tree } = render(onClose));
    const submit = find(tree, "Pressable").find(
      (pressable) => find(pressable, "Text").some((text) => text.props.children === "Add learner")
    );

    submit?.props.onPress?.();
    ({ tree } = render(onClose));
    const cancel = find(tree, "Pressable").find(
      (pressable) => find(pressable, "Text").some((text) => text.props.children === "Cancel")
    );
    expect(cancel?.props.disabled).toBe(true);
    expect(cancel?.props.accessibilityState).toEqual({ disabled: true });
    resolveAdd?.();
  });
});
