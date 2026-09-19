"use client";

import { Check, ChevronDown, Globe2, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiService } from "@/lib/api";
import { marketDisplayName } from "@/lib/market-display";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useMarketStore } from "@/store/market-store";

export function MarketSelector({
  className,
  align = "end",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const t = useTranslations("Markets");
  const locale = useLocale();
  const { markets, selectedCode, hasExplicitChoice, select } = useMarketStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const selected = markets.find((market) => market.code === selectedCode);

  const choose = async (code: string) => {
    const previousCode = selectedCode;
    const previousWasExplicit = hasExplicitChoice;
    select(code);
    if (!isAuthenticated) return;
    try {
      await apiService.selectMarket(code === "GLOBAL" ? undefined : code);
    } catch (error) {
      select(previousCode, previousWasExplicit);
      toast.error(
        error instanceof Error ? error.message : t("saveMarketFailed"),
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-green-600 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600",
            className,
          )}
          aria-label={t("chooseMarketplaceCountry")}
        >
          {selected ? (
            <MapPin className="h-4 w-4" />
          ) : (
            <Globe2 className="h-4 w-4" />
          )}
          <span>{selected?.code ?? t("global")}</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-72">
        <DropdownMenuLabel>
          <span className="block text-sm font-semibold text-gray-900">
            {t("marketplace")}
          </span>
          <span className="mt-0.5 block text-xs font-normal text-gray-500">
            {t("selectorBody")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {markets.map((market) => (
          <DropdownMenuItem
            key={market.id}
            disabled={market.status === "INACTIVE"}
            onClick={() => void choose(market.code)}
            className="flex items-center justify-between py-2.5"
          >
            <span>
              <span className="block font-medium">
                {marketDisplayName(locale, market)}
              </span>
              <span className="text-xs text-gray-500">
                {market.currency}
                {market.status === "PAUSED"
                  ? ` · ${t("checkoutPaused")}`
                  : ""}
              </span>
            </span>
            {selectedCode === market.code && (
              <Check className="h-4 w-4 text-green-700" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void choose("GLOBAL")}
          className="flex items-center justify-between py-2.5"
        >
          <span>
            <span className="block font-medium">{t("global")}</span>
            <span className="text-xs text-gray-500">
              {t("globalBrowse")}
            </span>
          </span>
          {selectedCode === "GLOBAL" && (
            <Check className="h-4 w-4 text-green-700" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
