import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { TAB_BAR_HEIGHT, useTabBarLayout } from "./tabBarLayout";

export default function MainTabs() {
  if (Platform.OS === "ios") return <IOSNativeTabs />;

  return <JavascriptTabs />;
}

function IOSNativeTabs() {
  return (
    <NativeTabs
      backBehavior="initialRoute"
      iconColor={{ default: COLORS.navInactive, selected: COLORS.primary }}
      labelStyle={{ fontFamily: "NunitoSans_700Bold", fontSize: 11 }}
      tintColor={COLORS.primary}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home" }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon
          sf={{ default: "clock.arrow.circlepath", selected: "clock.arrow.circlepath" }}
          md={{ default: "history", selected: "history" }}
        />
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md={{ default: "settings", selected: "settings" }}
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function JavascriptTabs() {
  const reduceMotionEnabled = useReduceMotionEnabled();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} reduceMotionEnabled={reduceMotionEnabled} />}
      backBehavior="initialRoute"
      detachInactiveScreens={false}
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        animation: reduceMotionEnabled ? "none" : "fade",
        transitionSpec: reduceMotionEnabled
          ? undefined
          : { animation: "timing", config: { duration: 220 } },
        sceneStyleInterpolator: reduceMotionEnabled
          ? undefined
          : ({ current }) => ({
              sceneStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0.96, 1, 0.96],
                }),
                transform: [{
                  scale: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0.99, 1, 0.99],
                  }),
                }],
              },
            }),
        sceneStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <SymbolView name={{ ios: "house.fill", android: "home", web: "home" }} size={size} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "clock.arrow.circlepath", android: "history", web: "history" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: "gearshape.fill", android: "settings", web: "settings" }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function useReduceMotionEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setEnabled(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

function FloatingTabBar({
  descriptors,
  navigation,
  reduceMotionEnabled,
  state,
}: BottomTabBarProps & { reduceMotionEnabled: boolean }) {
  const { bottom } = useTabBarLayout();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.barFrame, { bottom }]}>
      <View accessibilityRole="tablist" style={[styles.bar, CARD_SHADOW]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const color = focused ? COLORS.primary : COLORS.navInactive;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options.title ?? route.name}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <SelectionBackground focused={focused} reduceMotionEnabled={reduceMotionEnabled} />
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              <Text
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.15}
                numberOfLines={1}
                style={[styles.label, { color }]}
              >
                {options.title ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SelectionBackground({
  focused,
  reduceMotionEnabled,
}: {
  focused: boolean;
  reduceMotionEnabled: boolean;
}) {
  const [opacity] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    if (reduceMotionEnabled) {
      opacity.setValue(focused ? 1 : 0);
      return;
    }
    const animation = Animated.timing(opacity, {
      toValue: focused ? 1 : 0,
      duration: 140,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, opacity, reduceMotionEnabled]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.selectionBackground,
        { opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  barFrame: { position: "absolute", left: 20, right: 20, alignItems: "center" },
  bar: {
    width: "100%",
    maxWidth: 720,
    minHeight: TAB_BAR_HEIGHT,
    padding: 6,
    flexDirection: "row",
    gap: 6,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  item: {
    flex: 1,
    minHeight: TAB_BAR_HEIGHT - 14,
    borderRadius: 28,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  selectionBackground: { borderRadius: 28, backgroundColor: COLORS.primarySoft },
  pressed: { opacity: 0.7 },
  label: { fontFamily: "NunitoSans_700Bold", fontSize: 12, marginTop: 2 },
});
