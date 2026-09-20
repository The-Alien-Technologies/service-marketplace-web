export type NotificationType =
  | "ORDER_PAID"
  | "ORDER_STATUS_CHANGED"
  | "QUOTE_RECEIVED"
  | "QUOTE_UPDATED"
  | "REVIEW_RECEIVED"
  | "REVIEW_RESPONSE"
  | "DISPUTE_OPENED"
  | "DISPUTE_UPDATED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "REFUND_UPDATED"
  | "PAYOUT_REQUESTED"
  | "PAYOUT_UPDATED"
  | "MESSAGE_RECEIVED"
  | "SUPPORT_ESCALATED"
  | "SECURITY_ALERT"
  | "SYSTEM_ALERT";

export type NotificationPriority = "INFO" | "IMPORTANT" | "CRITICAL";

export interface AppNotification {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
}

export interface NotificationPage {
  items: AppNotification[];
  unreadCount: number;
  notificationsEnabled: boolean;
  nextCursor: string | null;
}
