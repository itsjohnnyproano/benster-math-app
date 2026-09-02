import { StyleSheet } from "react-native";

// Shared sizing for tablet preference controls; callers opt in explicitly.
export const tabletPreferenceStyles = StyleSheet.create({
  row: { minHeight: 96, paddingHorizontal: 24, paddingVertical: 18 },
  label: { fontSize: 22, lineHeight: 29 },
  detail: { fontSize: 17, lineHeight: 24 },
});
