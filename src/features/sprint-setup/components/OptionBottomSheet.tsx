import { SymbolView } from "expo-symbols";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/theme/tokens";

import type { SetupOption } from "../sprintSetupOptions";

type OptionValue = string | number;

type OptionBottomSheetProps = {
  visible: boolean;
  title: string;
  selectedValue: OptionValue;
  options: readonly SetupOption[];
  onClose: () => void;
  onSelect: (value: OptionValue) => void;
};

function LayoutPreview({ layout }: { layout: "horizontal" | "vertical" }) {
  if (layout === "horizontal") {
    return (
      <View style={styles.previewCard}>
        <Text style={styles.horizontalProblem}>9 × 6</Text>
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
  const hasPreviews = options.some((option) => option.preview);

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Close options"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => event.stopPropagation()}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <View style={[styles.optionList, hasPreviews && styles.previewList]}>
            {options.map((option) => {
              const isSelected = selectedValue === option.value;

              return (
                <Pressable
                  accessibilityLabel={`${option.label}${isSelected ? ", selected" : ""}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  key={option.value}
                  onPress={() => onSelect(option.value)}
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
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
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
  optionList: { gap: 9 },
  previewList: { flexDirection: "row" },
  option: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#E7E2F0",
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
