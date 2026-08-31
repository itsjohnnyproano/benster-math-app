import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAdaptiveLayout } from "@/shared/responsiveLayout";

export const TAB_BAR_HEIGHT = 72;
export const IPAD_TAB_BAR_HEIGHT = 52;
export const IPAD_TAB_SCENE_OFFSET = IPAD_TAB_BAR_HEIGHT + 12;

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isIpad = Platform.OS === "ios" && getAdaptiveLayout(width, height) !== "phone";
  const bottom = Math.max(insets.bottom, 12);
  const top = Math.max(insets.top, 12);

  return {
    bottom,
    contentInset: isIpad ? bottom + 16 : TAB_BAR_HEIGHT + bottom + 16,
    isIpad,
    top,
  };
}
