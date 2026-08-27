import { describe, expect, it } from "vitest";

import { getGameplayLayout } from "./gameplayLayout";

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
        expect(layout.keyHeight).toBeGreaterThanOrEqual(44);
        expect(layout.keyHeight).toBeLessThanOrEqual(56);
        expect(layout.submitHeight).toBeGreaterThanOrEqual(44);
      });
    }
  }

  it("keeps the full card and tall keys when space permits", () => {
    const layout = getGameplayLayout(850, "typed");
    expect(layout.cardHeight).toBe(260);
    expect(layout.keyHeight).toBe(56);
  });

  it("recalculates when available height changes", () => {
    expect(getGameplayLayout(528, "typed").cardHeight)
      .toBeLessThan(getGameplayLayout(760, "typed").cardHeight);
    expect(getGameplayLayout(528, "typed").promptHeight).toBe(0);
  });
});
