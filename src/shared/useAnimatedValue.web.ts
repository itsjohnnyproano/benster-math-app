import { useState } from "react";
import { Animated } from "react-native";

// React Native Web 0.21 does not export the native useAnimatedValue hook.
export function useAnimatedValue(initialValue: number) {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
