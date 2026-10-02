import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  stateIndex: 0,
  states: [] as unknown[],
}));
const gate = vi.hoisted(() => ({
  action: null as (() => void) | null,
  onResolved: vi.fn(),
  request: vi.fn(),
  visible: true,
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
  Platform: { select: (values: { default?: unknown }) => values.default },
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
    addLearner: vi.fn(),
    removeLearner: vi.fn(),
    retryRemovedLearnerPreferencesCleanup: vi.fn(),
    updateLearnerColor: vi.fn(),
  }),
}));
vi.mock("./ParentalGate", () => ({ ParentalGate: "ParentalGate" }));
vi.mock("./useParentalGate", () => ({ useParentalGate: () => gate }));

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
  gate.action = null;
  gate.visible = true;
  gate.request.mockReset();
  gate.onResolved.mockReset();
  gate.request.mockImplementation((action) => { gate.action = action; });
  gate.onResolved.mockImplementation((approved: boolean) => {
    const action = gate.action;
    gate.action = null;
    if (approved) action?.();
  });
  vi.mocked(Alert.alert).mockReset();
});

describe("Manage learners parental gate", () => {
  it("renders its parental gate within the full-screen manager modal", () => {
    const { tree } = render();
    const manager = find(tree, "Modal").find((modal) => modal.props.presentationStyle === "fullScreen");

    expect(manager).toBeDefined();
    expect(find(manager, "ParentalGate")).toHaveLength(1);
  });

  it("requests parental approval before showing the destructive deletion confirmation", () => {
    const { tree } = render();
    const deleteButton = find(tree, "Pressable").find(
      (pressable) => pressable.props.accessibilityLabel === "Delete Jake"
    );

    deleteButton?.props.onPress?.();
    expect(gate.request).toHaveBeenCalledOnce();
    expect(Alert.alert).not.toHaveBeenCalled();

    gate.onResolved(true);
    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete learner?",
      expect.stringContaining("Jake"),
      expect.any(Array)
    );
  });

  it("keeps Add closed when the parent check is cancelled", () => {
    const onClose = vi.fn();
    const { tree } = render(onClose);
    const addButton = find(tree, "Pressable").find(
      (pressable) => pressable.props.accessibilityLabel === undefined
        && find(pressable, "Text").some((text) => text.props.children === "+ Add a learner")
    );

    addButton?.props.onPress?.();
    gate.onResolved(false);
    const { tree: cancelledTree } = render(onClose);
    expect(onClose).not.toHaveBeenCalled();
    expect(find(cancelledTree, "Modal").find((modal) => modal.props.transparent)?.props.visible).toBe(false);
  });

  it("opens Add only after parent approval and the manager dismissal", () => {
    const onClose = vi.fn();
    let { tree } = render(onClose);
    const addButton = find(tree, "Pressable").find(
      (pressable) => pressable.props.accessibilityLabel === undefined
        && find(pressable, "Text").some((text) => text.props.children === "+ Add a learner")
    );

    addButton?.props.onPress?.();
    expect(gate.request).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    ({ tree } = render(onClose));
    expect(find(tree, "Modal").find((modal) => modal.props.transparent)?.props.visible).toBe(false);

    gate.onResolved(true);
    expect(onClose).toHaveBeenCalledOnce();

    ({ tree } = render(onClose));
    const manager = find(tree, "Modal").find((modal) => modal.props.presentationStyle === "fullScreen");
    manager?.props.onDismiss?.();
    ({ tree } = render(onClose));
    expect(find(tree, "Modal").find((modal) => modal.props.transparent)?.props.visible).toBe(true);
  });
});
