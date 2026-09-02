import type { ReactElement, ReactNode } from "react";
import type { ScrollViewProps, ViewProps } from "react-native";
import { describe, expect, it, vi } from "vitest";
import { SettingsColumns } from "./SettingsColumns";

vi.mock("react-native", () => ({
  View: "View",
  ScrollView: "ScrollView",
  StyleSheet: { create: (styles: unknown) => styles },
}));

type ColumnProps = { children: ReactNode; bottomInset: number };

describe("Settings landscape columns", () => {
  it.each([0, 40])("keeps both panes equally sized and keyboard-scrollable (inset %i)", (bottomInset) => {
    const tree = SettingsColumns({ nickname: "Nickname editor", children: "Practice settings", bottomInset });
    expect(tree.props.style).toMatchObject({ flex: 1, flexDirection: "row", gap: 32 });
    const columns = tree.props.children as ReactElement<ColumnProps, (props: ColumnProps) => ReactElement<ViewProps>>[];
    expect(columns).toHaveLength(2);

    columns.forEach((column, index) => {
      const wrapper = column.type(column.props);
      expect(wrapper.props.style).toMatchObject({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 });
      const scroll = wrapper.props.children as ReactElement<ScrollViewProps>;
      expect(scroll.type).toBe("ScrollView");
      expect(scroll.props.scrollEnabled).not.toBe(false);
      expect(scroll.props.bounces).toBe(false);
      expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
      expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
      expect(scroll.props.style).toMatchObject({ flex: 1, marginHorizontal: -24 });
      expect(scroll.props.contentContainerStyle).toEqual([
        { paddingHorizontal: 24 }, { paddingBottom: Math.max(bottomInset, 24) },
      ]);
      expect(scroll.props.children).toBe(index === 0 ? "Nickname editor" : "Practice settings");
    });
  });
});
