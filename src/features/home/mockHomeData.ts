export const MOCK_HOME_DATA = {
  displayName: "Mia",
  streakDays: 3,
  personalBests: {
    addition: 18,
    subtraction: 15,
    multiplication: 12,
  },
} as const;

export type MockHomePersonalBestKey = keyof typeof MOCK_HOME_DATA.personalBests;
