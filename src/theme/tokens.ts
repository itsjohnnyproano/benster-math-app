import { Platform } from "react-native";

export const COLORS = {
  background: "#F6F3FF",
  card: "#FFFFFF",
  primary: "#6D45E8",
  primarySoft: "#EEE9FF",
  orange: "#FF8617",
  orangeSoft: "#FFF0DE",
  blue: "#2F8DF4",
  green: "#31C66A",
  greenSoft: "#EAF9F0",
  teal: "#00A6A6",
  ink: "#101827",
  border: "#E7E2F0",
  red: "#FF5C5C",
  redSoft: "#FFF0F0",
  secondary: "#6D7485",
  navInactive: "#747A89",
} as const;

export const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#372B67",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  android: { elevation: 5 },
  default: { boxShadow: "0 6px 18px rgba(55, 43, 103, 0.12)" },
});
