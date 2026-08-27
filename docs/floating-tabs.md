# Persistent floating tabs

- Home, History, and Settings now live inside `src/app/(tabs)`. Their public URLs stay `/`, `/history`, and `/settings`.
- `MainTabs` uses Expo Router's SDK 57 `expo-router/js-tabs` navigator. A custom tab bar belongs to that navigator rather than each screen. Switching tabs does not push a new root-stack screen or animate a second bar into view.
- The bar is an opaque white capsule with border, shadow, and a lavender selected pill. Liquid Glass is deferred.
- Shared bottom clearance in `tabBarLayout.ts` keeps scrollable content reachable above the bar and home indicator. The bar hides while the keyboard is shown.
- Sprint Setup, Play/Results, and Practice Streak remain outside the tab group.
- Tab presses use navigator events, including long press and prevent-default behavior. Repeated presses on the selected tab do not push duplicate screens.
- Removed the old per-screen `BottomNavigation` and tab-screen `Stack.Screen` declarations.

Verification: TypeScript, test suite, and web export pass. Browser checked Home → History → Settings → Home and Home → Setup (no tab bar in Setup). Native keyboard hiding, safe-area positioning, and switching/back behavior should be checked on the phone after a full reload, since route files moved. Browser persistence errors prevented a complete gameplay loop in the preview; no storage code changed in this adjustment.
