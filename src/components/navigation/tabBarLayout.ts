import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 72;

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);
  return { bottom, contentInset: TAB_BAR_HEIGHT + bottom + 16 };
}
