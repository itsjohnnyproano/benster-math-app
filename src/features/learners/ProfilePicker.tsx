import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { learnerDisplayName, type Learner } from "@/domain/learner";
import { PROFILE_COLORS } from "@/theme/profileColors";
import { COLORS } from "@/theme/tokens";

type Props = {
  activeLearnerId: string;
  learners: readonly Learner[];
  visible: boolean;
  error: string | null;
  onChoose: (learnerId: string) => void;
  onManage: () => void;
};

export function ProfilePicker({ activeLearnerId, learners, visible, error, onChoose, onManage }: Props) {
  return (
    <Modal animationType="fade" presentationStyle="fullScreen" visible={visible} onRequestClose={() => undefined}>
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.screen}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Who’s practicing?
          </Text>
          <Text style={styles.subtitle}>Choose your profile to keep practice and progress just for you.</Text>
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </View>
        <ScrollView bounces={false} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {learners.map((learner) => (
              <Pressable
                key={learner.id}
                accessibilityRole="button"
                accessibilityState={{ selected: learner.id === activeLearnerId }}
                accessibilityLabel={`Choose ${learnerDisplayName(learner, learners)}`}
                onPress={() => onChoose(learner.id)}
                style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
              >
                <View style={[styles.avatar, { backgroundColor: PROFILE_COLORS[learner.colorId].background }, learner.id === activeLearnerId && styles.activeAvatar]}>
                  <Text style={[styles.avatarLetter, { color: PROFILE_COLORS[learner.colorId].foreground }]}>
                    {learnerDisplayName(learner, learners).slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.name}>
                  {learnerDisplayName(learner, learners)}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add or manage learner profiles"
              onPress={onManage}
              style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
            >
              <View style={styles.addAvatar}>
                <Text style={styles.addSymbol}>+</Text>
              </View>
              <Text style={styles.name}>Add</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  // Modal safe-area propagation is inconsistent on some iPhones. This extra
  // clearance keeps the title below the Dynamic Island even when it reports 0.
  header: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 14,
  },
  profileContent: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 28, paddingBottom: 40 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 34, lineHeight: 42, textAlign: "center" },
  subtitle: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    maxWidth: 440,
    alignSelf: "center",
    marginTop: 8,
  },
  error: { color: "#B42318", fontFamily: "NunitoSans_600SemiBold", fontSize: 14, marginTop: 8, textAlign: "center" },
  // Profiles fill left-to-right, so Add always occupies the next open slot.
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "5%", rowGap: 24, paddingTop: 30 },
  profile: { width: "30%", minHeight: 120, alignItems: "center", justifyContent: "flex-start" },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
  },
  activeAvatar: { borderWidth: 3, borderColor: COLORS.primary },
  avatarLetter: { fontFamily: "NunitoSans_700Bold", fontSize: 32 },
  name: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17, marginTop: 10, textAlign: "center" },
  addAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addSymbol: { color: COLORS.primary, fontFamily: "NunitoSans_600SemiBold", fontSize: 34, lineHeight: 38 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
