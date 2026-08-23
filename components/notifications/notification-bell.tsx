"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationStore } from "@/store/notification-store";
import { AppNotification } from "@/types/notification";
import { NotificationItem } from "./notification-item";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [open, setOpen] = useState(false);
  const {
    recentNotifications,
    unreadCount,
    inAppNotificationsEnabled,
    isLoadingRecent,
    isMarkingAll,
    recentError,
    connect,
    disconnect,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    connect();
    void fetchNotifications({ reset: true, filter: "all", scope: "recent" });
    return disconnect;
  }, [connect, disconnect, fetchNotifications, isAuthenticated]);

  if (!isAuthenticated) return null;

  const openNotification = (notification: AppNotification) => {
    if (!notification.readAt) void markRead(notification.id);
    setOpen(false);
    router.push(notification.actionUrl || "/dashboard/notifications");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600",
            className,
          )}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border-gray-200 bg-white p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="font-semibold text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500">
              {!inAppNotificationsEnabled
                ? "In-app notifications are off"
                : unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You’re all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={isMarkingAll}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              {isMarkingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {!inAppNotificationsEnabled && (
          <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs leading-5 text-amber-900">
              Unread badges are paused in your preferences.
            </p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/profile?tab=preferences");
              }}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
            >
              Review settings
            </button>
          </div>
        )}

        <div className="max-h-[26rem] divide-y divide-gray-100 overflow-y-auto">
          {isLoadingRecent && recentNotifications.length === 0 ? (
            <div className="space-y-3 p-4" aria-label="Loading notifications">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex animate-pulse gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentError && recentNotifications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm font-medium text-gray-900">
                Notifications couldn’t load
              </p>
              <p className="mt-1 text-sm text-gray-500">{recentError}</p>
              <button
                type="button"
                onClick={() =>
                  void fetchNotifications({ reset: true, scope: "recent" })
                }
                className="mt-3 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                Try again
              </button>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Bell
                className="mx-auto h-6 w-6 text-gray-400"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No notifications yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Order, payment, message, and support updates will appear here.
              </p>
            </div>
          ) : (
            recentNotifications
              .slice(0, 6)
              .map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onOpen={openNotification}
                  compact
                />
              ))
          )}
        </div>

        <div className="border-t border-gray-100 p-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/notifications");
            }}
            className="w-full rounded-md px-3 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
