export type ParentalChallenge = Readonly<{ left: number; right: number }>;

// This is a parental friction step, not age verification or authentication.
export function createParentalChallenge(previous?: ParentalChallenge, random = Math.random): ParentalChallenge {
  const choices: ParentalChallenge[] = [];
  for (let left = 6; left <= 12; left++) {
    for (let right = 6; right <= 12; right++) {
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
