"use client";

import {
  CircleAlert,
  FileText,
  Headphones,
  MessageSquare,
  Scale,
  ShoppingBag,
  Star,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppNotification, NotificationType } from "@/types/notification";

function iconFor(type: NotificationType) {
  if (type.includes("PAYMENT") || type.includes("ORDER")) return ShoppingBag;
  if (type.includes("QUOTE")) return FileText;
  if (type.includes("REVIEW")) return Star;
  if (type.includes("DISPUTE")) return Scale;
  if (type.includes("PAYOUT") || type.includes("REFUND")) return WalletCards;
  if (type === "MESSAGE_RECEIVED") return MessageSquare;
  if (type === "SUPPORT_ESCALATED") return Headphones;
  return CircleAlert;
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

interface NotificationItemProps {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onOpen,
  compact = false,
}: NotificationItemProps) {
  const Icon = iconFor(notification.type);
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "group relative flex w-full gap-3 text-left transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600",
        compact ? "px-4 py-3" : "px-4 py-4 sm:px-5",
        isUnread && "bg-green-50/60 pr-7 hover:bg-green-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center rounded-full",
          compact ? "h-9 w-9" : "h-10 w-10",
          notification.priority === "CRITICAL"
            ? "bg-red-50 text-red-700"
            : isUnread
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "min-w-0 break-words text-sm leading-5 text-gray-900",
              isUnread ? "font-semibold" : "font-medium",
            )}
          >
            {isUnread && <span className="sr-only">Unread: </span>}
            {notification.title}
          </span>
          <span
            className="shrink-0 text-xs text-gray-500"
            title={dateLabel(notification.createdAt)}
          >
            {formatNotificationTime(notification.createdAt)}
          </span>
        </span>
        <span
          className={cn(
            "mt-0.5 block break-words text-sm leading-5 text-gray-600",
            compact && "line-clamp-2",
          )}
        >
          {notification.message}
        </span>
      </span>
      {isUnread && (
        <span
          className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-green-600"
          aria-label="Unread"
        />
      )}
    </button>
  );
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}
