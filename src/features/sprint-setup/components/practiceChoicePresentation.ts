import type { PracticeNumberRange } from "@/domain/practiceSelection";

export function getRangeExamples(
  mode: "addition" | "subtraction",
  range: PracticeNumberRange | null,
) {
  if (range === null) {
    return mode === "addition"
      ? ["7 + 3", "4 + 6", "9 + 1"]
      : ["9 − 4", "12 − 7", "8 − 3"];
  }

  const half = Math.floor(range / 2);
  if (mode === "addition") {
    return [
      `${half} + ${range - half}`,
      `${Math.max(0, range - 1)} + 1`,
      `${range} + 0`,
    ];
  }

  return [
    `${range} − ${half}`,
    `${half} − ${Math.floor(half / 2)}`,
    `${range - half} − 0`,
  ];
}
