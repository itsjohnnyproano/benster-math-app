import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const gate = vi.hoisted(() => ({
  onResolved: vi.fn(),
  request: vi.fn(),
  visible: true,
}));

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: <T,>(initial: T) => [initial, vi.fn()] as const,
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
};

function find(node: ReactNode, type: string): ReactElement<ElementProps>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<ElementProps>(child)) return [];
    return [...(child.type === type ? [child] : []), ...find(child.props.children, type)];
  });
}

function render(onClose = vi.fn(), onOpen = vi.fn()) {
  return {
    onClose,
    onOpen,
    tree: ManageLearnersModal({ visible: true, tablet: false, onClose, onOpen }),
  };
}

beforeEach(() => {
  gate.visible = true;
  gate.request.mockReset();
  gate.onResolved.mockReset();
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

    const action = gate.request.mock.calls[0]?.[0] as (() => void) | undefined;
    action?.();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete learner?",
      expect.stringContaining("Jake"),
      expect.any(Array)
    );
  });

  it("keeps the manager open until parental approval is resolved for Add", () => {
    const { tree, onClose } = render();
    const addButton = find(tree, "Pressable").find(
      (pressable) => pressable.props.accessibilityLabel === undefined
        && find(pressable, "Text").some((text) => text.props.children === "+ Add a learner")
    );

    addButton?.props.onPress?.();
    expect(gate.request).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();

    const action = gate.request.mock.calls[0]?.[0] as (() => void) | undefined;
    action?.();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
