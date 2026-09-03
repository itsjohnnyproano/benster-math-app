import { Alert, Platform } from "react-native";

export function confirmDeleteSavedData(onDelete: () => void) {
  const title = "Are you sure?";
  const message = "This will permanently erase all local high scores and game progress. This cannot be undone.";
  // React Native Web's Alert is a no-op; use the browser's confirmation.
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) onDelete();
    return;
  }
  let confirmed = false;
  Alert.alert(
    title,
    message,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Everything", style: "destructive", onPress: () => {
        if (confirmed) return;
        confirmed = true;
        onDelete();
      } },
    ],
    { cancelable: true },
  );
}
