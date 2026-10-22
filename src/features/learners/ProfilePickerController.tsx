import { useRouter } from "expo-router";
import { useState } from "react";

import { usePreferences } from "@/providers/PreferencesProvider";
import { ProfilePicker } from "./ProfilePicker";

/** Owns profile-picker interaction state so the root route only composes features. */
export function ProfilePickerController({ presentation = "modal" }: { presentation?: "modal" | "screen" }) {
  const router = useRouter();
  const {
    learners,
    activeLearner,
    profilePickerVisible,
    switchLearner,
    closeProfilePicker,
  } = usePreferences();
  const [switchError, setSwitchError] = useState<string | null>(null);

  return (
    <ProfilePicker
      activeLearnerId={activeLearner.id}
      learners={learners}
      visible={profilePickerVisible}
      presentation={presentation}
      error={switchError}
      onChoose={(learnerId) => {
        setSwitchError(null);
        void switchLearner(learnerId).then(closeProfilePicker, () => {
          setSwitchError("Couldn’t switch learners. Please try again.");
        });
      }}
      onManage={() => {
        closeProfilePicker();
        router.navigate("/settings");
      }}
    />
  );
}
