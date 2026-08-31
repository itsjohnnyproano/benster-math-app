import { useLocalSearchParams, useRouter } from "expo-router";

import SprintHistoryDetailScreen from "@/features/history/SprintHistoryDetailScreen";

export default function SprintHistoryDetailRoute() {
  const router = useRouter();
  const { sprintId } = useLocalSearchParams<{ sprintId?: string | string[] }>();

  return (
    <SprintHistoryDetailScreen
      sprintId={typeof sprintId === "string" ? sprintId : null}
      onBack={() => router.canGoBack() ? router.back() : router.replace("/history")}
    />
  );
}
