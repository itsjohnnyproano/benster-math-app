import {
  OPERATIONS,
  type DifficultyLevel,
  type MathOperation,
  type MathQuestion,
  type QuestionGenerationInput,
  type RandomSource,
} from "./types";

const ADDITION_MAX: Record<DifficultyLevel, number> = {
  1: 10,
  2: 20,
  3: 50,
  4: 100,
};

const MULTIPLICATION_MAX: Record<DifficultyLevel, number> = {
  1: 5,
  2: 8,
  3: 10,
  4: 12,
};

const OPERATOR: Record<MathOperation, MathQuestion["operator"]> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
};

function randomInteger(min: number, max: number, random: RandomSource) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function chooseOperation(
  mode: QuestionGenerationInput["mode"],
  random: RandomSource,
): MathOperation {
  if (mode !== "mixed") return mode;
  return OPERATIONS[randomInteger(0, OPERATIONS.length - 1, random)];
}

function createOperands(
  operation: MathOperation,
  difficultyLevel: DifficultyLevel,
  levelUpEnabled: boolean,
  random: RandomSource,
) {
  if (operation === "multiplication") {
    const max = levelUpEnabled ? MULTIPLICATION_MAX[difficultyLevel] : MULTIPLICATION_MAX[4];
    return [randomInteger(1, max, random), randomInteger(1, max, random)] as const;
  }

  const max = ADDITION_MAX[difficultyLevel];
  const first = randomInteger(0, max, random);
  const second = randomInteger(0, max, random);

  if (operation === "subtraction") {
    return [Math.max(first, second), Math.min(first, second)] as const;
  }

  return [first, second] as const;
}

export function calculateCorrectAnswer(
  operation: MathOperation,
  leftOperand: number,
  rightOperand: number,
) {
  if (operation === "addition") return leftOperand + rightOperand;
  if (operation === "subtraction") return leftOperand - rightOperand;
  return leftOperand * rightOperand;
}

function shuffle(values: number[], random: RandomSource) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index, random);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

export function generateDistractors(
  correctAnswer: number,
  operation: MathOperation,
  leftOperand: number,
  rightOperand: number,
  random: RandomSource = Math.random,
) {
  const candidates = [
    correctAnswer - 1,
    correctAnswer + 1,
    correctAnswer - 2,
    correctAnswer + 2,
    leftOperand + rightOperand,
    Math.abs(leftOperand - rightOperand),
    operation === "multiplication"
      ? leftOperand * Math.max(1, rightOperand - 1)
      : correctAnswer + leftOperand,
  ];
  const unique = new Set<number>();

  for (const candidate of candidates) {
    if (candidate >= 0 && candidate !== correctAnswer) unique.add(candidate);
  }

  let offset = 3;
  while (unique.size < 3) {
    const candidate = correctAnswer + offset;
    if (candidate !== correctAnswer) unique.add(candidate);
    offset += 1;
  }

  return shuffle(Array.from(unique), random).slice(0, 3);
}

export function generateQuestion({
  mode,
  levelUpEnabled,
  difficultyLevel,
  questionId,
  presentedAtMs,
  random = Math.random,
}: QuestionGenerationInput): MathQuestion {
  const operation = chooseOperation(mode, random);
  const [leftOperand, rightOperand] = createOperands(
    operation,
    difficultyLevel,
    levelUpEnabled,
    random,
  );
  const correctAnswer = calculateCorrectAnswer(
    operation,
    leftOperand,
    rightOperand,
  );
  const choices = shuffle(
    [
      correctAnswer,
      ...generateDistractors(
        correctAnswer,
        operation,
        leftOperand,
        rightOperand,
        random,
      ),
    ],
    random,
  );

  return Object.freeze({
    id: questionId,
    operation,
    leftOperand,
    rightOperand,
    operator: OPERATOR[operation],
    correctAnswer,
    choices: Object.freeze(choices),
    difficultyLevel,
    presentedAtMs,
  });
}
