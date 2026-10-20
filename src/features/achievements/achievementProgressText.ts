import type { AchievementProgress } from "@/domain/achievements";

function progressUnit(achievement: AchievementProgress) {
  switch (achievement.metric) {
    case "minutes": return "minutes";
    case "modes": return "modes";
    case "correct-answers": return "correct";
    case "single-sprint": return "sprint";
    case "personal-bests": return "personal bests";
    case "comebacks": return "comebacks";
    case "mode-sprints":
    case "sprints":
    case "daily-sprints": return "sprints";
    case "perfect-sprints": return "perfect sprints";
    case "weekends": return achievement.target === 1 ? "weekend" : "weekends";
    case "practice-days":
    case "practice-days-total": return "days";
  }
}

export function formatAchievementProgress(achievement: AchievementProgress) {
  return `${Math.min(achievement.current, achievement.target)} of ${achievement.target} ${progressUnit(achievement)}`;
}
