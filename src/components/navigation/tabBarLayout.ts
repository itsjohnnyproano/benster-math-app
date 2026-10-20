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
  // iOS NativeTabs reserves the bar height itself. Its direct scroll views only
  // need a small visual gap; nested scroll views need the remaining safe-area
  // space as well. Other platforms render our floating bar over content.
  const usesNativeTabs = Platform.OS === "ios";
  const tabBarClearance = TAB_BAR_HEIGHT + bottom;
  const floatingTabBarClearance = tabBarClearance + 20;

  return {
    bottom,
    contentInset: usesNativeTabs ? 20 : floatingTabBarClearance,
    // Use this only for a scroll view that remains covered by the tab bar
    // instead of receiving the system's automatic iOS inset adjustment.
    // NativeTabs already contributes the bar height for this scroll view.
    // Add only a modest safe-area gap so the last tile finishes near, not under, it.
    coveredTabBarInset: bottom + 24,
    isIpad,
    overlayContentInset: usesNativeTabs ? bottom + 20 : floatingTabBarClearance,
    top,
  };
}
