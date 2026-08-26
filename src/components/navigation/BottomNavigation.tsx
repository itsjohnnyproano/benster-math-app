import { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/theme/tokens";

type NavItemProps = {
  label: string;
  icon: ComponentProps<typeof SymbolView>["name"];
  active?: boolean;
  onPress?: () => void;
};

function NavItem({ label, icon, active = false, onPress }: NavItemProps) {
  const color = active ? COLORS.primary : COLORS.navInactive;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.navItem, pressed && styles.navPressed]}
    >
      {active && <View style={styles.activeIndicator} />}
      <SymbolView name={icon} size={25} tintColor={color} />
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function BottomNavigation() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <NavItem
        active
        icon={{ ios: "house.fill", android: "home", web: "home" }}
        label="Home"
      />
      <NavItem
        icon={{
          ios: "clock.arrow.circlepath",
          android: "history",
          web: "history",
        }}
        label="History"
      />
      <NavItem
        icon={{ ios: "gearshape.fill", android: "settings", web: "settings" }}
        label="Settings"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    minHeight: 76,
    paddingHorizontal: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(17, 24, 39, 0.08)",
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  navItem: {
    width: 82,
    paddingTop: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    marginTop: 1,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  navPressed: { opacity: 0.6 },
});
