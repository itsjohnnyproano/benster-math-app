import { SymbolView } from "expo-symbols";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/theme/tokens";
import type { CardLayout } from "@/domain/sprint";
import { getAdaptiveLayout } from "@/shared/responsiveLayout";
import { useAnimatedValue } from "@/shared/useAnimatedValue";

import type { PreferenceOption } from "./practiceOptions";

type OptionValue = string | number;

const SHEET_HIDDEN_OFFSET = 520;
const OPEN_DURATION_MS = 220;
const CLOSE_DURATION_MS = 160;
const IPAD_SELECTION_CLOSE_DURATION_MS = 90;

type OptionBottomSheetProps = {
  visible: boolean;
  title: string;
  selectedValue: OptionValue;
  options: readonly PreferenceOption[];
  onClose: () => void;
  onSelect: (value: OptionValue) => void;
};

function LayoutPreview({ layout }: { layout: CardLayout }) {
  if (layout === "horizontal") {
    return (
      <View style={styles.previewCard}>
        <Text style={styles.horizontalProblem}>9 × 6</Text>
      </View>
    );
  }

  if (layout === "both") {
    return (
      <View style={styles.previewCard}>
        <View style={styles.combinedPreviewContent}>
          <Text style={styles.combinedHorizontalProblem}>9 × 6</Text>
          <View style={styles.combinedDivider} />
          <View style={styles.combinedVerticalProblem}>
            <Text style={styles.combinedVerticalNumber}>9</Text>
            <Text style={styles.combinedVerticalNumber}>× 6</Text>
            <View style={styles.combinedAnswerLine} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.previewCard}>
      <View style={styles.verticalProblem}>
        <Text style={styles.verticalNumber}>9</Text>
        <Text style={styles.verticalNumber}>× 6</Text>
        <View style={styles.answerLine} />
      </View>
    </View>
  );
}

export function OptionBottomSheet({
  visible,
  title,
  selectedValue,
  options,
  onClose,
  onSelect,
}: OptionBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isIpad = Platform.OS === "ios" && getAdaptiveLayout(width, height) !== "phone";
  const hasPreviews = options.some((option) => option.preview);
  const [isClosing, setIsClosing] = useState(false);
  const backdropOpacity = useAnimatedValue(0);
  const sheetTranslateY = useAnimatedValue(SHEET_HIDDEN_OFFSET);

  const animateIn = () => {
    setIsClosing(false);
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(isIpad ? 14 : SHEET_HIDDEN_OFFSET);
    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: OPEN_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration: OPEN_DURATION_MS,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
  };

  const animateOut = (complete: () => void, duration = CLOSE_DURATION_MS) => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration,
        easing: Easing.in(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration,
        easing: Easing.in(Easing.cubic),
        toValue: isIpad ? 14 : SHEET_HIDDEN_OFFSET,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      setIsClosing(false);
      if (finished) complete();
    });
  };

  const requestClose = () => animateOut(onClose);

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      onRequestClose={requestClose}
      onShow={animateIn}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Close options"
        accessibilityRole="button"
        onPress={requestClose}
        style={[styles.backdrop, isIpad && styles.ipadBackdrop]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.backdropTint, { opacity: backdropOpacity }]}
        />
        <Animated.View
          style={[
            isIpad && styles.ipadFrame,
            {
              opacity: isIpad ? backdropOpacity : 1,
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <Pressable
            accessibilityViewIsModal
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.sheet,
              isIpad && styles.ipadSheet,
              { paddingBottom: isIpad ? 24 : Math.max(insets.bottom, 18) },
            ]}
          >
            {!isIpad && <View style={styles.handle} />}
            <View style={isIpad && styles.ipadTitleRow}>
              <Text style={[styles.title, isIpad && styles.ipadTitle]}>{title}</Text>
              {isIpad && (
                <Pressable
                  accessibilityLabel="Close options"
                  accessibilityRole="button"
                  disabled={isClosing}
                  hitSlop={8}
                  onPress={requestClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressedOption]}
                >
                  <SymbolView
                    name={{ ios: "xmark", android: "close", web: "close" }}
                    size={18}
                    tintColor={COLORS.secondary}
                  />
                </Pressable>
              )}
            </View>

            <View style={[styles.optionList, hasPreviews && styles.previewList]}>
              {options.map((option) => {
                const isSelected = selectedValue === option.value;

                return (
                  <Pressable
                    accessibilityLabel={`${option.label}${isSelected ? ", selected" : ""}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    key={option.value}
                    disabled={isClosing}
                    onPress={() =>
                      animateOut(
                        () => onSelect(option.value),
                        isIpad ? IPAD_SELECTION_CLOSE_DURATION_MS : CLOSE_DURATION_MS
                      )
                    }
                    style={({ pressed }) => [
                      styles.option,
                      hasPreviews && styles.previewOption,
                      isSelected && styles.selectedOption,
                      pressed && styles.pressedOption,
                    ]}
                  >
                    {option.preview && <LayoutPreview layout={option.preview} />}
                    <View
                      style={[
                        styles.optionCopy,
                        hasPreviews && styles.previewOptionCopy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.selectedLabel,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text style={styles.optionDescription}>
                          {option.description}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.selectionCircle,
                        isSelected && styles.selectedCircle,
                      ]}
                    >
                      {isSelected && (
                        <SymbolView
                          name={{ ios: "checkmark", android: "check", web: "check" }}
                          size={15}
                          tintColor={COLORS.card}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  ipadBackdrop: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  backdropTint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(16, 24, 39, 0.42)",
  },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 22,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.card,
    shadowColor: "#101827",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 20,
  },
  ipadFrame: { width: "100%", maxWidth: 560 },
  ipadSheet: {
    paddingTop: 22,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 12 },
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9D4E4",
  },
  title: {
    marginTop: 18,
    marginBottom: 15,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 23,
    lineHeight: 29,
    textAlign: "center",
  },
  ipadTitleRow: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  ipadTitle: { marginTop: 0, marginBottom: 16, paddingHorizontal: 54 },
  closeButton: {
    position: "absolute",
    top: -3,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  optionList: { gap: 9 },
  previewList: { flexDirection: "row" },
  combinedPreviewContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  combinedHorizontalProblem: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 13 },
  combinedDivider: { width: 1, height: 38, backgroundColor: COLORS.border },
  combinedVerticalProblem: { alignItems: "flex-end" },
  combinedVerticalNumber: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 10, lineHeight: 11 },
  combinedAnswerLine: { width: 21, height: 1.5, marginTop: 2, backgroundColor: COLORS.ink },
  option: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: "#FCFBFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  previewOption: {
    flex: 1,
    minHeight: 190,
    paddingHorizontal: 10,
    paddingVertical: 14,
    flexDirection: "column",
    justifyContent: "center",
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  pressedOption: { opacity: 0.72 },
  optionCopy: { flex: 1 },
  previewOptionCopy: { flex: 0 },
  optionLabel: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 17,
    lineHeight: 22,
  },
  selectedLabel: { color: COLORS.primary },
  optionDescription: {
    marginTop: 1,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  selectionCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#D5CFDF",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  previewCard: {
    width: "100%",
    height: 78,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalProblem: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 24,
  },
  verticalProblem: { alignItems: "flex-end" },
  verticalNumber: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 18,
    lineHeight: 20,
  },
  answerLine: {
    width: 35,
    height: 2,
    marginTop: 3,
    borderRadius: 1,
    backgroundColor: COLORS.ink,
  },
});
