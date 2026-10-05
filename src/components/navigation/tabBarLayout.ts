import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAdaptiveLayout } from "@/shared/responsiveLayout";

export const TAB_BAR_HEIGHT = 64;

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isIpad = Platform.OS === "ios" && getAdaptiveLayout(width, height) !== "phone";
  const bottom = Math.max(insets.bottom, 12);
  const top = Math.max(insets.top, 12);

  return {
    bottom,
    // NativeTabs adjusts the first scroll container for the system tab layout on iOS.
    // Android and web use the JavaScript floating bar, so they still need its clearance.
    contentInset: Platform.OS === "ios" ? 0 : TAB_BAR_HEIGHT + bottom + 16,
    isIpad,
    top,
  };
}
