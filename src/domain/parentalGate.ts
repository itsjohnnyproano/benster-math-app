export type ParentalChallenge = Readonly<{ left: number; right: number }>;

const LEFT_OPERANDS = [13, 14, 15, 16, 17, 18, 19] as const;
const RIGHT_OPERANDS = [17, 18, 19, 20, 21, 22, 23] as const;

// This is adult-level friction for access to settings that leave the app or
// remove data. It is not age verification or authentication.
export function createParentalChallenge(previous?: ParentalChallenge, random = Math.random): ParentalChallenge {
  const choices: ParentalChallenge[] = [];
  for (const left of LEFT_OPERANDS) {
    for (const right of RIGHT_OPERANDS) {
      // A retry must not reuse the same answer (including reversed operands).
      if (!previous || left * right !== previous.left * previous.right) choices.push({ left, right });
    }
  }
  return choices[Math.floor(random() * choices.length)];
}

export function isParentalAnswerCorrect(challenge: ParentalChallenge, answer: string): boolean {
  const value = answer.trim();
  return /^\d{1,3}$/.test(value) && Number(value) === challenge.left * challenge.right;
}
