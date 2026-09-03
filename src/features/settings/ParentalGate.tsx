import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAnimatedValue } from "@/shared/useAnimatedValue";
import { SafeAreaView } from "react-native-safe-area-context";
import { createParentalChallenge, isParentalAnswerCorrect } from "@/domain/parentalGate";
import { COLORS } from "@/theme/tokens";

export function ParentalGate({ onResolved }: { onResolved: (approved: boolean) => void }) {
  const [challenge, setChallenge] = useState(() => createParentalChallenge());
  const challengeRef = useRef(challenge);
  const [answer, setAnswer] = useState("");
  const answerRef = useRef("");
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(true);
  const closing = useRef(false);
  const approved = useRef(false);
  const delivered = useRef(false);
  const input = useRef<TextInput>(null);
  const shake = useAnimatedValue(0);
  const reduceMotion = useRef(true);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) reduceMotion.current = enabled;
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => { reduceMotion.current = enabled; });
    return () => { active = false; subscription.remove(); shake.stopAnimation(); };
  }, [shake]);

  const resolve = useCallback(() => {
    if (!closing.current || delivered.current) return;
    delivered.current = true;
    onResolved(approved.current);
  }, [onResolved]);
  // Native onDismiss is iOS-only. Android removes its dialog on visible=false.
  useEffect(() => {
    if (!visible && Platform.OS !== "ios") resolve();
  }, [visible, resolve]);

  const close = (success: boolean) => {
    if (closing.current) return;
    closing.current = true;
    approved.current = success;
    Keyboard.dismiss();
    setVisible(false);
  };
  const submit = () => {
    if (closing.current || !answerRef.current.trim()) return;
    if (isParentalAnswerCorrect(challengeRef.current, answerRef.current)) {
      close(true);
      return;
    }
    const next = createParentalChallenge(challengeRef.current);
    challengeRef.current = next;
    answerRef.current = "";
    setChallenge(next);
    setAnswer("");
    setError(true);
    AccessibilityInfo.announceForAccessibility(`Incorrect answer. Please try ${next.left} times ${next.right}.`);
    shake.stopAnimation();
    shake.setValue(0);
    if (!reduceMotion.current) {
      Animated.sequence([-10, 10, -7, 7, 0].map((toValue) => Animated.timing(shake, {
        toValue, duration: 60, useNativeDriver: true,
      }))).start();
    }
    input.current?.focus();
  };

  return (
    <Modal transparent visible={visible} animationType="none" supportedOrientations={["portrait", "landscape"]}
      onShow={() => input.current?.focus()} onRequestClose={() => close(false)} onDismiss={resolve}>
      <SafeAreaView style={styles.backdrop}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Animated.View accessibilityViewIsModal onAccessibilityEscape={() => close(false)} style={[styles.dialog, { transform: [{ translateX: shake }] }]}>
              <Text accessibilityRole="header" style={styles.title}>Parents Only: Please solve this problem to continue.</Text>
              <Text accessibilityLabel={`${challenge.left} times ${challenge.right}`} style={styles.problem}>{challenge.left} × {challenge.right}</Text>
              <TextInput ref={input} accessibilityLabel="Answer to parental check" keyboardType="number-pad" returnKeyType="done"
                autoCorrect={false} maxLength={3} value={answer} editable={visible}
                onChangeText={(value) => { answerRef.current = value; setAnswer(value); }} onSubmitEditing={submit} style={styles.input} />
              {error && <Text style={styles.error}>Incorrect answer. Please try the new problem.</Text>}
              <View style={styles.buttons}>
                <Pressable accessibilityRole="button" onPress={() => close(false)} style={styles.button}><Text style={styles.cancel}>Cancel</Text></Pressable>
                <Pressable accessibilityRole="button" disabled={!answer.trim() || !visible} accessibilityState={{ disabled: !answer.trim() || !visible }} onPress={submit}
                  style={[styles.button, styles.submit, !answer.trim() && styles.disabled]}><Text style={styles.submitText}>Submit</Text></Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,39,0.4)" },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: COLORS.card, borderRadius: 24, padding: 24, gap: 16 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 22, textAlign: "center" },
  problem: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 36, textAlign: "center" },
  input: { minHeight: 56, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 24, textAlign: "center", padding: 12 },
  error: { color: COLORS.red, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, textAlign: "center" },
  buttons: { flexDirection: "row", gap: 12 },
  button: { flex: 1, minHeight: 48, padding: 12, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  submit: { backgroundColor: COLORS.primary },
  submitText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  cancel: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  disabled: { opacity: 0.45 },
});
