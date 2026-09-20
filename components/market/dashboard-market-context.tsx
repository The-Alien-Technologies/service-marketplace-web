"use client";

import { MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { marketDisplayName } from "@/lib/market-display";
import { useAuthStore } from "@/store/auth-store";
import { useMarketStore } from "@/store/market-store";
import { MarketSelector } from "@/components/market/market-selector";

export function DashboardMarketContext() {
  const t = useTranslations("Markets");
  const locale = useLocale();
  const user = useAuthStore((state) => state.user);
  const markets = useMarketStore((state) => state.markets);

  if (user?.role === "SUPER_ADMIN") {
    return (
      <MarketSelector className="inline-flex px-2 sm:px-3" compactOnMobile />
    );
  }

  if (user?.role === "USER" || user?.role === "SERVICE_PROVIDER") {
    return <MarketSelector className="hidden sm:inline-flex" />;
  }

  if (user?.role !== "ADMIN") return null;
  const market = markets.find((item) => item.id === user.adminMarketId);
  return (
    <div className="hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 sm:flex">
      <MapPin className="h-4 w-4 text-green-700" />
      {market ? marketDisplayName(locale, market) : t("assignedMarket")}
    </div>
  );
}
