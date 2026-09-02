import type { CardLayout, ConcreteCardLayout, InputStyle } from "@/domain/sprint";
import type { AdaptiveLayout } from "@/shared/responsiveLayout";

export function resolveQuestionCardLayout(preference: CardLayout, questionId: number): ConcreteCardLayout {
  if (preference !== "both") return preference;
  return questionId % 2 === 1 ? "horizontal" : "vertical";
}

// Heights are measured inside SafeAreaView, never from a device/model name.
export function getGameplayLayout(height: number, inputStyle: InputStyle, adaptiveLayout: AdaptiveLayout = "phone") {
  const isTablet = adaptiveLayout !== "phone";
  const isLandscapeTablet = adaptiveLayout === "tablet-landscape";
  const isPortraitTablet = adaptiveLayout === "tablet-portrait";
  const density = Math.max(0, Math.min(1, (height - 540) / 280));
  const gap = isTablet ? (isLandscapeTablet ? 8 : 12) : Math.round(4 + density * 8);
  const keyHeight = isTablet ? 74 : Math.round(50 + density * 12);
  const keyGap = isTablet ? 8 : Math.round(4 + density * 2);
  const fieldHeight = isTablet ? (isLandscapeTablet ? 64 : 68) : Math.round(48 + density * 12);
  const choiceHeight = isTablet ? 112 : 60;
  const choiceGap = isTablet ? 16 : 13;
  const feedbackHeight = 20;
  const feedbackFontSize = isTablet ? 14 : 13;
  const promptHeight = height >= 680 || isTablet ? 24 : 0;
  const answerHeight =
    inputStyle === "typed"
      ? fieldHeight + gap + keyHeight * 4 + keyGap * 3 + 12 + feedbackHeight + 2
      : choiceHeight * 2 + choiceGap;
  // 16 outer padding + 50 header + 12 progress + 24 level label.
  const fixedHeight = 102;
  const cardMaxHeight = isPortraitTablet ? 400 : isTablet ? 280 : 260;
  const cardMaxWidth = isPortraitTablet ? 560 : 340;
  const questionFontMaxSize = isPortraitTablet ? 84 : 60;
  const questionLineWidth = isPortraitTablet ? 160 : 112;
  const cardHeight = Math.max(0, Math.min(cardMaxHeight, height - fixedHeight - answerHeight - gap * 2 - promptHeight));

  return {
    gap,
    keyHeight,
    keyGap,
    fieldHeight,
    choiceHeight,
    choiceGap,
    feedbackHeight,
    feedbackFontSize,
    promptHeight,
    answerHeight,
    cardHeight,
    cardMaxWidth,
    questionFontMaxSize,
    questionLineWidth,
    fixedHeight,
  };
}

export type GameplayLayout = ReturnType<typeof getGameplayLayout>;
