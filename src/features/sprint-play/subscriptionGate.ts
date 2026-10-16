type SubscriptionStatus = "loading" | "ready" | "unavailable" | "error";

type SprintSubscriptionGateInput = Readonly<{
  firstFreeSprintCompleted: boolean;
  isPremium: boolean;
  sprintCompleted: boolean;
  subscriptionStatus: SubscriptionStatus;
}>;

/**
 * The first free sprint may finish before its result is saved. Once it is
 * saved, the subscription gate becomes eligible—but never at the expense of
 * the result and answer review the learner has just earned.
 */
export function getSprintSubscriptionGate({
  firstFreeSprintCompleted,
  isPremium,
  sprintCompleted,
  subscriptionStatus,
}: SprintSubscriptionGateInput) {
  const shouldCheckSubscription = !sprintCompleted && firstFreeSprintCompleted;

  return {
    subscriptionCheckPending: shouldCheckSubscription && subscriptionStatus === "loading",
    requiresPremium: shouldCheckSubscription && subscriptionStatus === "ready" && !isPremium,
  };
}
