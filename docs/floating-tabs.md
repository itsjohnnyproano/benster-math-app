# Persistent tabs

- Home, History, Achievements, and Settings live inside `src/app/(tabs)`. Their public URLs stay `/`, `/history`, `/achievements`, and `/settings`.
- On iOS, `MainTabs` uses Expo Router SDK 58's `expo-router/native-tabs` (`NativeTabs`). The system owns the tab presentation, Liquid Glass behavior, iPad adaptation, and scroll-view inset adjustment.
- On Android and web, `MainTabs` uses Expo Router's `expo-router/js-tabs` navigator with Benster's custom floating capsule. It hides while the keyboard is shown.
- `tabBarLayout.ts` supplies manual bottom clearance for the JavaScript bar. Most iOS screens use `NativeTabs` automatic content insets, while a covered scroll view can opt into `coveredTabBarInset` to keep its final content above the bar. The independently scrolling second pane in two-column Settings adds its own native bottom safe area because automatic adjustment applies to the first scroll container only.
- Sprint Setup, Play/Results, and Practice Streak remain outside the tab group.
- JavaScript-tab presses use navigator events, including long press and prevent-default behavior. Repeated presses on the selected tab do not push duplicate screens.
- The old per-screen `BottomNavigation` and tab-screen `Stack.Screen` declarations remain removed.

Verification: TypeScript, test suite, and web export pass. Confirm iOS safe-area positioning, iPad adaptation, keyboard behavior, and tab switching after a full reload on devices. Browser checks cover the JavaScript tab implementation; iOS native tabs require iOS simulator or device verification.
