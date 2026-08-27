import type { InputStyle } from "@/domain/sprint";

// Heights are measured inside SafeAreaView, never from a device/model name.
export function getGameplayLayout(height: number, inputStyle: InputStyle) {
  const density = Math.max(0, Math.min(1, (height - 540) / 280));
  const gap = Math.round(4 + density * 8);
  const keyHeight = Math.round(44 + density * 12);
  const keyGap = Math.round(4 + density * 2);
  const fieldHeight = Math.round(48 + density * 12);
  const submitHeight = 46;
  const promptHeight = height >= 680 ? 24 : 0;
  const answerHeight = inputStyle === "typed"
    ? fieldHeight + gap * 2 + submitHeight + keyHeight * 4 + keyGap * 3 + 12 + 22
    : 133;
  // 16 outer padding + 50 header + 12 progress + 24 level label.
  const fixedHeight = 102;
  const cardHeight = Math.max(0, Math.min(260,
    height - fixedHeight - answerHeight - gap * 2 - promptHeight));

  return { gap, keyHeight, keyGap, fieldHeight, submitHeight, promptHeight,
    answerHeight, cardHeight, fixedHeight };
}

export type GameplayLayout = ReturnType<typeof getGameplayLayout>;
