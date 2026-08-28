import { Children, isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  StyleSheet: { create: (styles: unknown) => styles },
  Platform: { select: (options: { ios?: unknown }) => options.ios },
}));

import { getGameplayLayout } from "../gameplayLayout";
import type { AnswerFeedback } from "../types";
import { NumberPad } from "./NumberPad";

type ElementProps = {
  children?: ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress?: () => void;
};

// Inspect the component's actual button props/callbacks without native modules.
// This does not verify native rendering or touch delivery.
function buttons(node: ReactNode): ElementProps[] {
  return Children.toArray(node).flatMap((child): ElementProps[] => {
    if (!isValidElement<ElementProps>(child)) return [];
    if (typeof child.type === "function") {
      return buttons((child.type as (props: ElementProps) => ReactNode)(child.props));
    }
    if ((child.type as unknown) === "Pressable") return [child.props];
    return buttons(child.props.children);
  });
}

function setup(value: string, feedback: AnswerFeedback | null = null) {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const keys = buttons(NumberPad({
    layout: getGameplayLayout(700, "typed"), value, feedback, onChange, onSubmit,
  }));
  const key = (label: string) => {
    const found = keys.find((button) => button.accessibilityLabel === label);
    if (!found) throw new Error(`Missing key: ${label}`);
    return found;
  };
  return { keys, key, onChange, onSubmit };
}

describe("typed answer keypad", () => {
  it("places Clear, 0, Check after 1–9 with no separate submit or backspace button", () => {
    expect(setup("").keys.map((key) => key.accessibilityLabel)).toEqual([
      ...Array.from({ length: 9 }, (_, index) => `Number ${index + 1}`),
      "Clear answer", "Number 0", "Check answer",
    ]);
  });

  it("clears the entire answer without submitting it", () => {
    const pad = setup("123");
    pad.key("Clear answer").onPress!();
    expect(pad.onChange).toHaveBeenCalledWith("");
    expect(pad.onSubmit).not.toHaveBeenCalled();
  });

  it("disables Clear and Check for empty input, but accepts zero", () => {
    for (const label of ["Clear answer", "Check answer"]) {
      expect(setup("").key(label).disabled).toBe(true);
      expect(setup("0").key(label).disabled).toBe(false);
    }
    const pad = setup("0");
    pad.key("Check answer").onPress!();
    expect(pad.onSubmit).toHaveBeenCalledOnce();
  });

  it.each([true, false])("locks every key during feedback (correct: %s)", (isCorrect) => {
    expect(setup("12", { submittedAnswer: 12, correctAnswer: 12, isCorrect })
      .keys.every((key) => key.disabled)).toBe(true);
  });

  it("preserves digit entry, leading-zero replacement, and the three-digit limit", () => {
    for (const [value, expected] of [["", "4"], ["0", "4"], ["12", "124"]]) {
      const pad = setup(value);
      pad.key("Number 4").onPress!();
      expect(pad.onChange).toHaveBeenCalledWith(expected);
    }
    const pad = setup("123");
    pad.key("Number 4").onPress!();
    expect(pad.onChange).not.toHaveBeenCalled();
  });
});
