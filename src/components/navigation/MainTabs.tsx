import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { Tabs, type BottomTabBarProps } from "expo-router/js-tabs";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { IPAD_TAB_BAR_HEIGHT, IPAD_TAB_SCENE_OFFSET, TAB_BAR_HEIGHT, useTabBarLayout } from "./tabBarLayout";

export default function MainTabs() {
  const { isIpad } = useTabBarLayout();
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
                transform: [
                  {
                    scale: current.progress.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [0.99, 1, 0.99],
                    }),
                  },
                ],
              },
            }),
        sceneStyle: { backgroundColor: COLORS.background, paddingTop: isIpad ? IPAD_TAB_SCENE_OFFSET : 0 },
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

function FloatingTabBar({ state, descriptors, navigation, reduceMotionEnabled }: BottomTabBarProps & { reduceMotionEnabled: boolean }) {
  const { bottom, isIpad, top } = useTabBarLayout();
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
    <View pointerEvents="box-none" style={[styles.barFrame, isIpad ? { top } : { bottom }]}>
      <View accessibilityRole="tablist" style={[styles.bar, isIpad && styles.ipadBar, CARD_SHADOW]}>
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
              style={({ pressed }) => [styles.item, isIpad && styles.ipadItem, pressed && styles.pressed]}
            >
              <SelectionBackground focused={focused} isIpad={isIpad} reduceMotionEnabled={reduceMotionEnabled} />
              {options.tabBarIcon?.({ focused, color, size: isIpad ? 20 : 24 })}
              <Text
                maxFontSizeMultiplier={1.15}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.label, isIpad && styles.ipadLabel, { color }]}
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

function SelectionBackground({ focused, isIpad, reduceMotionEnabled }: { focused: boolean; isIpad: boolean; reduceMotionEnabled: boolean }) {
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
        isIpad && styles.ipadSelectionBackground,
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
  ipadBar: { maxWidth: 420, minHeight: IPAD_TAB_BAR_HEIGHT, padding: 4, borderRadius: 28 },
  item: {
    flex: 1,
    minHeight: TAB_BAR_HEIGHT - 14,
    borderRadius: 28,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ipadItem: {
    minHeight: IPAD_TAB_BAR_HEIGHT - 8,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  selectionBackground: { borderRadius: 28, backgroundColor: COLORS.primarySoft },
  ipadSelectionBackground: { borderRadius: 22 },
  pressed: { opacity: 0.7 },
  label: { fontFamily: "NunitoSans_700Bold", fontSize: 12, marginTop: 2 },
  ipadLabel: { marginTop: 0, fontSize: 13 },
});
