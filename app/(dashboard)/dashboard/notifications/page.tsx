"use client";

/*
THESIS: A calm, chronological inbox for operational updates.
OWN-WORLD: Pavodah’s restrained green, neutral dashboard surfaces, Lucide icons.
STORY: Scan unread work, open the relevant task, then reach older history.
FIRST VIEWPORT: Title, unread status, filters, and the newest actionable updates.
FORM: One divided list; no decorative card grid or competing summary metrics.
*/

import { useEffect } from "react";
import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotificationStore } from "@/store/notification-store";
import { AppNotification } from "@/types/notification";
import { cn } from "@/lib/utils";
import {useTranslations} from "next-intl";

export default function NotificationsPage() {
  const t = useTranslations("Notifications");
  const common = useTranslations("Common");
  const errors = useTranslations("Errors");
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    nextCursor,
    isLoading,
    isLoadingMore,
    isMarkingAll,
    error,
    activeFilter,
    fetchNotifications,
    loadMore,
    setFilter,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    void fetchNotifications({ reset: true, filter: "all", scope: "history" });
  }, [fetchNotifications]);

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) void markRead(notification.id);
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t("subtitle")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={isMarkingAll}
            onClick={() => void markAllRead()}
            className="self-start border-gray-200 text-gray-700 hover:bg-gray-50 sm:self-auto"
          >
            <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("markAll")}
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 sm:px-5">
          <div
            className="flex rounded-lg bg-gray-100 p-1"
            role="group"
            aria-label={t("filters")}
          >
            {(["all", "unread"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => void setFilter(filter)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600",
                  activeFilter === filter
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-600 hover:text-gray-900",
                )}
                aria-pressed={activeFilter === filter}
              >
                {filter === "all" ? t("all") : t("unreadFilter", {count: unreadCount})}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              void fetchNotifications({ reset: true, filter: activeFilter })
            }
            disabled={isLoading}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
              aria-hidden="true"
            />
          </button>
        </div>

        {isLoading && notifications.length === 0 ? (
          <div className="divide-y divide-gray-100" aria-label={t("loading")}>
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex animate-pulse gap-3 px-5 py-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-2/5 rounded bg-gray-200" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error && notifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold text-gray-900">
              {t("loadFailed")}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              {error} {errors("network")}
            </p>
            <Button
              type="button"
              onClick={() =>
                void fetchNotifications({ reset: true, filter: activeFilter })
              }
              className="mt-5 bg-green-700 text-white hover:bg-green-800"
            >
              {common("retry")}
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-semibold text-gray-900">
              {activeFilter === "unread"
                ? t("caughtUp")
                : t("empty")}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
              {activeFilter === "unread"
                ? t("caughtUpBody")
                : t("historyEmptyBody")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onOpen={openNotification}
              />
            ))}
          </div>
        )}

        {nextCursor && notifications.length > 0 && (
          <div className="border-t border-gray-200 p-4 text-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingMore}
              onClick={() => void loadMore()}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {isLoadingMore ? common("loading") : t("loadOlder")}
            </Button>
          </div>
        )}

        {error && notifications.length > 0 && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error} {t("retryRefresh")}
          </div>
        )}
      </div>
    </div>
  );
}
