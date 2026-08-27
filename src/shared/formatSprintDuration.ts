import type { SprintDurationSeconds } from "@/domain/sprint";

const DURATION_LABELS: Record<SprintDurationSeconds, string> = {
  30: "30 sec",
  60: "1 min",
  90: "1 min 30 sec",
  120: "2 min",
};

const DURATION_SUBTITLES: Record<SprintDurationSeconds, string> = {
  30: "30-second sprint",
  60: "1-minute sprint",
  90: "1-minute 30-second sprint",
  120: "2-minute sprint",
};

export function formatDurationLabel(duration: SprintDurationSeconds) {
  return DURATION_LABELS[duration];
}

export function formatDurationSubtitle(duration: SprintDurationSeconds) {
  return DURATION_SUBTITLES[duration];
}
