"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useMarketStore } from "@/store/market-store";

export function MarketBootstrap() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const load = useMarketStore((state) => state.load);

  useEffect(() => {
    if (!hasHydrated) return;
    const preferredMarketId =
      user?.role === "ADMIN"
        ? user.adminMarketId
        : (user?.selectedMarketId ?? user?.homeMarketId);
    void load(preferredMarketId).catch(() => undefined);
  }, [
    hasHydrated,
    load,
    user?.role,
    user?.adminMarketId,
    user?.selectedMarketId,
    user?.homeMarketId,
  ]);

  return null;
}
