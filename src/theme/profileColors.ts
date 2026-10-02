import type { ProfileColorId } from "@/domain/learner";

export const PROFILE_COLORS: Readonly<Record<ProfileColorId, { background: string; foreground: string; label: string }>> = {
  violet: { background: "#6D45E8", foreground: "#FFFFFF", label: "Violet" },
  sky: { background: "#2F8DF4", foreground: "#FFFFFF", label: "Sky blue" },
  teal: { background: "#00A6A6", foreground: "#FFFFFF", label: "Teal" },
  green: { background: "#31C66A", foreground: "#101827", label: "Green" },
  yellow: { background: "#F6BE30", foreground: "#101827", label: "Yellow" },
  orange: { background: "#FF8617", foreground: "#101827", label: "Orange" },
  coral: { background: "#FF6F61", foreground: "#FFFFFF", label: "Coral" },
  rose: { background: "#E85A8C", foreground: "#FFFFFF", label: "Rose" },
  berry: { background: "#A258D5", foreground: "#FFFFFF", label: "Berry" },
  indigo: { background: "#4658C8", foreground: "#FFFFFF", label: "Indigo" },
};
