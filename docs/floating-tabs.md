# Persistent tabs

- Home, History, and Settings live inside `src/app/(tabs)`. Their public URLs stay `/`, `/history`, and `/settings`.
- On iOS, `MainTabs` uses Expo Router SDK 57's `expo-router/unstable-native-tabs`. The system owns the tab presentation, Liquid Glass behavior, iPad adaptation, and scroll-view inset adjustment.
- On Android and web, `MainTabs` uses Expo Router's `expo-router/js-tabs` navigator with Benster's custom floating capsule. It hides while the keyboard is shown.
- `tabBarLayout.ts` supplies manual bottom clearance only for the JavaScript bar. iOS relies on `NativeTabs` automatic content insets so the system can account for its actual layout.
- Sprint Setup, Play/Results, and Practice Streak remain outside the tab group.
- JavaScript-tab presses use navigator events, including long press and prevent-default behavior. Repeated presses on the selected tab do not push duplicate screens.
- The old per-screen `BottomNavigation` and tab-screen `Stack.Screen` declarations remain removed.

Verification: TypeScript, test suite, and web export pass. Confirm iOS safe-area positioning, iPad adaptation, keyboard behavior, and tab switching after a full reload on devices. Browser checks cover the JavaScript tab implementation; iOS native tabs require iOS simulator or device verification.
