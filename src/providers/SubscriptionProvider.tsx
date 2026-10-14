import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { getSubscriptionAccess } from "@/data/subscription/revenueCatSubscription";

type SubscriptionStatus = "loading" | "ready" | "unavailable" | "error";

type SubscriptionContextValue = {
  status: SubscriptionStatus;
  isPremium: boolean;
  refreshSubscription: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SubscriptionStatus>("loading");
  const [isPremium, setIsPremium] = useState(false);
  const mounted = useRef(true);

  const refreshSubscription = useCallback(async () => {
    try {
      const access = await getSubscriptionAccess();
      if (mounted.current) {
        setIsPremium(access.premium);
        setStatus(access.configured ? "ready" : "unavailable");
      }
      return access.premium;
    } catch {
      // Do not lock an offline learner out of locally stored practice data if
      // RevenueCat cannot refresh its cached entitlement information.
      if (mounted.current) setStatus("error");
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    // Start the asynchronous RevenueCat read after subscription. This avoids a
    // synchronous effect-driven render while still refreshing at app launch.
    void Promise.resolve().then(async () => {
      if (active) await refreshSubscription();
    });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [refreshSubscription]);

  const value = useMemo(
    () => ({ status, isPremium, refreshSubscription }),
    [isPremium, refreshSubscription, status],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
}
