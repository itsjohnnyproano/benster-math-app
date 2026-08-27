import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { TAB_BAR_HEIGHT, useTabBarLayout } from "./tabBarLayout";

export default function MainTabs() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} backBehavior="initialRoute" initialRouteName="index" screenOptions={{
      headerShown: false,
      animation: "none",
      sceneStyle: { backgroundColor: COLORS.background },
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "house.fill", android: "home", web: "home" }} size={24} tintColor={color} /> }} />
      <Tabs.Screen name="history" options={{ title: "History", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "clock.arrow.circlepath", android: "history", web: "history" }} size={24} tintColor={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color }) => <SymbolView name={{ ios: "gearshape.fill", android: "settings", web: "settings" }} size={24} tintColor={color} /> }} />
    </Tabs>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useTabBarLayout();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;
  return (
    <View accessibilityRole="tablist" style={[styles.bar, CARD_SHADOW, { bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const color = focused ? COLORS.primary : COLORS.navInactive;
        return (
          <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={options.title ?? route.name}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            style={({ pressed }) => [styles.item, focused && styles.selected, pressed && styles.pressed]}>
            {options.tabBarIcon?.({ focused, color, size: 24 })}
            <Text maxFontSizeMultiplier={1.15} numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color }]}>{options.title ?? route.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: "absolute", left: 20, right: 20, minHeight: TAB_BAR_HEIGHT, padding: 6, flexDirection: "row", gap: 6, borderRadius: 36, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  item: { flex: 1, minHeight: TAB_BAR_HEIGHT - 14, borderRadius: 28, paddingVertical: 6, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: COLORS.primarySoft },
  pressed: { opacity: 0.7 },
  label: { fontFamily: "NunitoSans_700Bold", fontSize: 12, marginTop: 2 },
});
