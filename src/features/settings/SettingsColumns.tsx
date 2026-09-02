import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SETTINGS_COLUMN_GAP } from "./settingsLayout";

export function SettingsColumns({ nickname, children, bottomInset }: {
  nickname: ReactNode; children: ReactNode; bottomInset: number;
}) {
  return (
    <View style={styles.columns}>
      <Column bottomInset={bottomInset}>{nickname}</Column>
      <Column bottomInset={bottomInset}>{children}</Column>
    </View>
  );
}

function Column({ children, bottomInset }: { children: ReactNode; bottomInset: number }) {
  return (
    <View style={styles.column}>
      <ScrollView
        style={styles.scroll}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(bottomInset, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flex: 1, flexDirection: "row", gap: SETTINGS_COLUMN_GAP },
  column: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  // A non-bouncing pane stays still when its content fits. If the keyboard
  // reduces its height, all content remains reachable without changing columns.
  // Matching margins/padding leave room for shadows without narrowing the cards.
  scroll: { flex: 1, marginHorizontal: -24 },
  content: { paddingHorizontal: 24 },
});
