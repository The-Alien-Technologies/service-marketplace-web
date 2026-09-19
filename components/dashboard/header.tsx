"use client";

import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslations } from "next-intl";
import { DashboardMarketContext } from "@/components/market/dashboard-market-context";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations("Navigation");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-5 lg:px-8">
      <div className="flex items-center lg:hidden">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t("openDashboardNavigation")}
          className="-ml-2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <DashboardMarketContext />
        <NotificationBell className="text-gray-500 hover:text-gray-700" />

        <LanguageSwitcher variant="dashboard" />
      </div>
    </header>
  );
}
