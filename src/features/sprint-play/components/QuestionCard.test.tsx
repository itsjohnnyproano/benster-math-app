import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: <T,>(initial: T) => [initial, vi.fn()] as const,
}));

vi.mock("react-native", () => ({
  Platform: { select: (values: { default?: unknown; ios?: unknown }) => values.ios ?? values.default },
  StyleSheet: { create: <T,>(styles: T) => styles },
  Text: "Text",
  View: "View",
}));

import { QuestionCard } from "./QuestionCard";

type ElementProps = {
  children?: ReactNode;
  style?: unknown;
};

function findText(node: ReactNode, value: number | string): ReactElement<ElementProps> {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<ElementProps>(child)) continue;
    if (child.type === "Text" && child.props.children === value) return child;
    const nested = findTextOrUndefined(child.props.children, value);
    if (nested) return nested;
  }
  throw new Error(`Missing text node: ${value}`);
}

function findTextOrUndefined(node: ReactNode, value: number | string) {
  try {
    return findText(node, value);
  } catch {
    return undefined;
  }
}

function flattenStyle(style: unknown) {
  return (Array.isArray(style) ? style : [style]).reduce<Record<string, unknown>>(
    (combined, item) => item && typeof item === "object" ? { ...combined, ...item } : combined,
    {},
  );
}

describe("vertical question card", () => {
  it.each(["+", "−", "×", "÷"] as const)("keeps both operands right-aligned when using %s", (operator) => {
    const tree = QuestionCard({
      height: 240,
      layout: "vertical",
      maxFontSize: 60,
      maxWidth: 340,
      question: {
        id: 1,
        operation: operator === "+" ? "addition" : operator === "−" ? "subtraction" : operator === "×" ? "multiplication" : "division",
        leftOperand: 744,
        rightOperand: 192,
        operator,
        correctAnswer: 936,
        choices: [936, 935, 938, 552],
        difficultyLevel: 1,
        presentedAtMs: 0,
      },
      verticalLineWidth: 112,
    });

    expect(flattenStyle(findText(tree, 744).props.style)).toMatchObject({ width: "100%", textAlign: "right" });
    expect(flattenStyle(findText(tree, 192).props.style)).toMatchObject({ width: "100%", textAlign: "right" });
    expect(flattenStyle(findText(tree, operator).props.style)).toMatchObject({
      position: "absolute",
      right: "100%",
      marginRight: 6,
    });
  });
});
