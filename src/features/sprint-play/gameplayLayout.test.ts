import { describe, expect, it } from "vitest";

import { getGameplayLayout, resolveQuestionCardLayout } from "./gameplayLayout";

describe("question card layout preference", () => {
  it("preserves a selected concrete layout", () => {
    expect(resolveQuestionCardLayout("horizontal", 2)).toBe("horizontal");
    expect(resolveQuestionCardLayout("vertical", 1)).toBe("vertical");
  });

  it("alternates layouts when both is selected", () => {
    expect(resolveQuestionCardLayout("both", 1)).toBe("horizontal");
    expect(resolveQuestionCardLayout("both", 2)).toBe("vertical");
    expect(resolveQuestionCardLayout("both", 3)).toBe("horizontal");
  });
});

describe("portrait gameplay layout", () => {
  const phones = [
    { name: "small phone", height: 568, top: 20, bottom: 20 },
    { name: "SE-size phone", height: 667, top: 20, bottom: 0 },
    { name: "mini-size phone", height: 812, top: 50, bottom: 34 },
    { name: "standard phone", height: 844, top: 59, bottom: 34 },
    { name: "large phone", height: 932, top: 59, bottom: 34 },
    { name: "compact Android", height: 640, top: 24, bottom: 48 },
  ];

  for (const phone of phones) {
    for (const input of ["typed", "multiple-choice"] as const) {
      it(`fits ${input} in the safe area of a ${phone.name}`, () => {
        const safeHeight = phone.height - phone.top - phone.bottom;
        const layout = getGameplayLayout(safeHeight, input);
        const usedHeight = layout.fixedHeight + layout.answerHeight
          + layout.cardHeight + layout.promptHeight + layout.gap * 2;

        expect(usedHeight).toBeLessThanOrEqual(safeHeight);
        // Both equation orientations use this same card budget.
        expect(layout.cardHeight).toBeGreaterThanOrEqual(90);
        expect(layout.keyHeight).toBeGreaterThanOrEqual(50);
        expect(layout.keyHeight).toBeLessThanOrEqual(62);
      });
    }
  }

  it("keeps the full card and tall keys when space permits", () => {
    const layout = getGameplayLayout(850, "typed");
    expect(layout.cardHeight).toBe(260);
    expect(layout.keyHeight).toBe(62);
  });

  it("recalculates when available height changes", () => {
    expect(getGameplayLayout(528, "typed").cardHeight)
      .toBeLessThan(getGameplayLayout(760, "typed").cardHeight);
    expect(getGameplayLayout(528, "typed").promptHeight).toBe(0);
  });
});

describe("iPad gameplay layout", () => {
  const iPads = [
    { name: "portrait", height: 980, layout: "tablet-portrait" as const },
    { name: "landscape", height: 720, layout: "tablet-landscape" as const },
  ];

  for (const iPad of iPads) {
    for (const input of ["typed", "multiple-choice"] as const) {
      it(`fits ${input} without scrolling in ${iPad.name}`, () => {
        const layout = getGameplayLayout(iPad.height, input, iPad.layout);
        const usedHeight = layout.fixedHeight + layout.answerHeight
          + layout.cardHeight + layout.promptHeight + layout.gap * 2;

        expect(usedHeight).toBeLessThanOrEqual(iPad.height);
        expect(layout.cardHeight).toBeGreaterThanOrEqual(90);
        expect(layout.choiceHeight).toBe(112);
        expect(layout.feedbackHeight).toBe(20);
        expect(layout.feedbackFontSize).toBe(14);
      });
    }
  }

  it("uses taller keys in both iPad orientations", () => {
    expect(getGameplayLayout(980, "typed", "tablet-portrait").keyHeight).toBe(74);
    expect(getGameplayLayout(720, "typed", "tablet-landscape").keyHeight).toBe(74);
  });

  it("keeps the phone multiple-choice height unchanged", () => {
    expect(getGameplayLayout(760, "multiple-choice", "phone").choiceHeight).toBe(60);
  });

  it("enlarges only the portrait tablet question card", () => {
    const portrait = getGameplayLayout(980, "typed", "tablet-portrait");
    const landscape = getGameplayLayout(720, "typed", "tablet-landscape");
    const phone = getGameplayLayout(760, "typed", "phone");

    expect(portrait.cardHeight).toBe(396);
    expect(portrait.cardMaxWidth).toBe(560);
    expect(portrait.questionFontMaxSize).toBe(84);
    expect(portrait.questionLineWidth).toBe(160);
    expect(landscape.cardMaxWidth).toBe(340);
    expect(landscape.questionFontMaxSize).toBe(60);
    expect(landscape.questionLineWidth).toBe(112);
    expect(phone.cardMaxWidth).toBe(340);
    expect(phone.questionFontMaxSize).toBe(60);
    expect(phone.questionLineWidth).toBe(112);
  });
});
