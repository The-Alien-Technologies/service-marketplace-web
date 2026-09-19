import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiService } from "@/lib/api";
import { suggestMarketCode } from "@/lib/market-selection";
import { Market } from "@/types/market";

interface MarketStore {
  markets: Market[];
  selectedCode: string;
  hasExplicitChoice: boolean;
  isLoading: boolean;
  hasLoaded: boolean;
  load: (preferredMarketId?: string | null) => Promise<void>;
  select: (code: string, explicit?: boolean) => void;
}

let latestLoad = 0;

export const useMarketStore = create<MarketStore>()(
  persist(
    (set, get) => ({
      markets: [],
      selectedCode: "GH",
      hasExplicitChoice: false,
      isLoading: false,
      hasLoaded: false,
      load: async (preferredMarketId) => {
        const loadId = ++latestLoad;
        set({ isLoading: true });
        try {
          const markets = await apiService.getMarkets();
          // Authentication can finish while an anonymous market request is in
          // flight. Only the newest load may choose the visible market.
          if (loadId !== latestLoad) return;
          const current = get();
          const selectedCode = suggestMarketCode(markets, {
            persistedCode: current.hasExplicitChoice
              ? current.selectedCode
              : undefined,
            preferredMarketId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
          });
          set({ markets, selectedCode, hasLoaded: true });
        } finally {
          if (loadId === latestLoad) set({ isLoading: false });
        }
      },
      select: (selectedCode, explicit = true) =>
        set({ selectedCode, hasExplicitChoice: explicit }),
    }),
    {
      name: "service-marketplace-market",
      partialize: (state) => ({
        selectedCode: state.selectedCode,
        hasExplicitChoice: state.hasExplicitChoice,
      }),
    },
  ),
);
