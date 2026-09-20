import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { apiService } from "@/lib/api";
import { AppNotification } from "@/types/notification";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:3000";

interface NotificationState {
  socket: Socket | null;
  recentNotifications: AppNotification[];
  notifications: AppNotification[];
  unreadCount: number;
  inAppNotificationsEnabled: boolean;
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingRecent: boolean;
  isLoadingMore: boolean;
  isMarkingAll: boolean;
  error: string | null;
  recentError: string | null;
  activeFilter: "all" | "unread";
  connect: () => void;
  disconnect: () => void;
  fetchNotifications: (options?: {
    reset?: boolean;
    filter?: "all" | "unread";
    scope?: "recent" | "history";
  }) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilter: (filter: "all" | "unread") => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

let recentRequestId = 0;
let historyRequestId = 0;
let notificationStateVersion = 0;
const locallyReadNotificationIds = new Set<string>();

function rememberLocallyRead(id: string) {
  locallyReadNotificationIds.add(id);
  if (locallyReadNotificationIds.size > 500) {
    const oldest = locallyReadNotificationIds.values().next().value;
    if (oldest) locallyReadNotificationIds.delete(oldest);
  }
}

function mergeNotifications(
  current: AppNotification[],
  incoming: AppNotification[],
) {
  const byId = new Map(
    current.map((notification) => [notification.id, notification]),
  );
  for (const notification of incoming) byId.set(notification.id, notification);
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  socket: null,
  recentNotifications: [],
  notifications: [],
  unreadCount: 0,
  inAppNotificationsEnabled: true,
  nextCursor: null,
  isLoading: false,
  isLoadingRecent: false,
  isLoadingMore: false,
  isMarkingAll: false,
  error: null,
  recentError: null,
  activeFilter: "all",

  connect: () => {
    const existingSocket = get().socket;
    if (existingSocket) {
      if (!existingSocket.connected) existingSocket.connect();
      return;
    }
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on(
      "notification.created",
      ({ notification }: { notification: AppNotification }) => {
        notificationStateVersion += 1;
        set((state) => {
          const exists =
            state.recentNotifications.some(
              (item) => item.id === notification.id,
            ) ||
            state.notifications.some((item) => item.id === notification.id);
          return {
            recentNotifications: mergeNotifications(state.recentNotifications, [
              notification,
            ]).slice(0, 20),
            notifications: mergeNotifications(state.notifications, [
              notification,
            ]),
            unreadCount:
              state.unreadCount + (!exists && !notification.readAt ? 1 : 0),
          };
        });
      },
    );
    socket.on(
      "notification.read",
      ({
        notificationId,
        readAt,
      }: {
        notificationId: string;
        readAt: string;
      }) => {
        notificationStateVersion += 1;
        set((state) => {
          const current =
            state.recentNotifications.find(
              (notification) => notification.id === notificationId,
            ) ||
            state.notifications.find(
              (notification) => notification.id === notificationId,
            );
          const alreadyApplied =
            locallyReadNotificationIds.has(notificationId) ||
            Boolean(current?.readAt);
          return {
            recentNotifications: state.recentNotifications.map(
              (notification) =>
                notification.id === notificationId
                  ? { ...notification, readAt }
                  : notification,
            ),
            notifications:
              state.activeFilter === "unread"
                ? state.notifications.filter(
                    (notification) => notification.id !== notificationId,
                  )
                : state.notifications.map((notification) =>
                    notification.id === notificationId
                      ? { ...notification, readAt }
                      : notification,
                  ),
            unreadCount: alreadyApplied
              ? state.unreadCount
              : Math.max(0, state.unreadCount - 1),
          };
        });
        rememberLocallyRead(notificationId);
      },
    );
    socket.on("notification.all_read", ({ readAt }: { readAt: string }) => {
      notificationStateVersion += 1;
      set((state) => ({
        recentNotifications: state.recentNotifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt || readAt,
        })),
        notifications:
          state.activeFilter === "unread"
            ? []
            : state.notifications.map((notification) => ({
                ...notification,
                readAt: notification.readAt || readAt,
              })),
        unreadCount: 0,
        nextCursor: state.activeFilter === "unread" ? null : state.nextCursor,
      }));
    });
    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },

  fetchNotifications: async (options = {}) => {
    const scope = options.scope ?? "history";
    const filter = options.filter ?? get().activeFilter;
    const requestId =
      scope === "recent" ? ++recentRequestId : ++historyRequestId;
    const stateVersion = notificationStateVersion;
    if (options.reset !== false) {
      if (scope === "recent") {
        set({ isLoadingRecent: true, recentError: null });
      } else {
        set({ isLoading: true, error: null, activeFilter: filter });
      }
    }
    try {
      const page = await apiService.getNotifications({
        limit: 20,
        unreadOnly: scope === "history" && filter === "unread",
      });
      const isCurrent =
        scope === "recent"
          ? requestId === recentRequestId
          : requestId === historyRequestId;
      if (!isCurrent) return;
      if (stateVersion !== notificationStateVersion) {
        void get().fetchNotifications({
          reset: options.reset,
          filter,
          scope,
        });
        return;
      }
      if (scope === "recent") {
        set((state) => ({
          recentNotifications: page.items,
          unreadCount:
            stateVersion === notificationStateVersion
              ? page.unreadCount
              : state.unreadCount,
          inAppNotificationsEnabled: page.notificationsEnabled,
          recentError: null,
        }));
      } else {
        set((state) => ({
          notifications: page.items,
          unreadCount:
            stateVersion === notificationStateVersion
              ? page.unreadCount
              : state.unreadCount,
          inAppNotificationsEnabled: page.notificationsEnabled,
          nextCursor: page.nextCursor,
          activeFilter: filter,
          error: null,
        }));
      }
    } catch (error) {
      const isCurrent =
        scope === "recent"
          ? requestId === recentRequestId
          : requestId === historyRequestId;
      if (!isCurrent) return;
      const message =
        error instanceof Error
          ? error.message
          : "Notifications could not be loaded.";
      set(scope === "recent" ? { recentError: message } : { error: message });
    } finally {
      if (scope === "history" && requestId === historyRequestId) {
        set({ isLoading: false });
      } else if (scope === "recent" && requestId === recentRequestId) {
        set({ isLoadingRecent: false });
      }
    }
  },

  loadMore: async () => {
    const { nextCursor, activeFilter, isLoadingMore } = get();
    if (!nextCursor || isLoadingMore) return;
    const requestId = ++historyRequestId;
    const stateVersion = notificationStateVersion;
    set({ isLoadingMore: true, error: null });
    try {
      const page = await apiService.getNotifications({
        cursor: nextCursor,
        limit: 20,
        unreadOnly: activeFilter === "unread",
      });
      if (requestId !== historyRequestId) return;
      if (stateVersion !== notificationStateVersion) return;
      set((state) => ({
        notifications: mergeNotifications(state.notifications, page.items),
        unreadCount:
          stateVersion === notificationStateVersion
            ? page.unreadCount
            : state.unreadCount,
        nextCursor: page.nextCursor,
      }));
    } catch (error) {
      if (requestId !== historyRequestId) return;
      set({
        error:
          error instanceof Error
            ? error.message
            : "More notifications could not be loaded.",
      });
    } finally {
      if (requestId === historyRequestId) set({ isLoadingMore: false });
    }
  },

  setFilter: async (filter) => {
    if (filter === get().activeFilter && get().notifications.length > 0) return;
    await get().fetchNotifications({ reset: true, filter });
  },

  markRead: async (id) => {
    const notification =
      get().recentNotifications.find((item) => item.id === id) ||
      get().notifications.find((item) => item.id === id);
    if (!notification || notification.readAt) return;
    const readAt = new Date().toISOString();
    notificationStateVersion += 1;
    rememberLocallyRead(id);
    set((state) => ({
      recentNotifications: state.recentNotifications.map((item) =>
        item.id === id ? { ...item, readAt } : item,
      ),
      notifications:
        state.activeFilter === "unread"
          ? state.notifications.filter((item) => item.id !== id)
          : state.notifications.map((item) =>
              item.id === id ? { ...item, readAt } : item,
            ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await apiService.markNotificationRead(id);
    } catch {
      locallyReadNotificationIds.delete(id);
      await Promise.all([
        get().fetchNotifications({ reset: true, scope: "recent" }),
        get().fetchNotifications({ reset: true, scope: "history" }),
      ]);
    }
  },

  markAllRead: async () => {
    if (get().isMarkingAll || get().unreadCount === 0) return;
    const readAt = new Date().toISOString();
    notificationStateVersion += 1;
    const previousFilter = get().activeFilter;
    set((state) => ({
      isMarkingAll: true,
      recentNotifications: state.recentNotifications.map((notification) => ({
        ...notification,
        readAt: notification.readAt || readAt,
      })),
      notifications:
        state.activeFilter === "unread"
          ? []
          : state.notifications.map((notification) => ({
              ...notification,
              readAt: notification.readAt || readAt,
            })),
      unreadCount: 0,
      inAppNotificationsEnabled: true,
      nextCursor: previousFilter === "unread" ? null : state.nextCursor,
    }));
    try {
      await apiService.markAllNotificationsRead();
    } catch {
      await Promise.all([
        get().fetchNotifications({ reset: true, scope: "recent" }),
        get().fetchNotifications({ reset: true, scope: "history" }),
      ]);
    } finally {
      set({ isMarkingAll: false });
    }
  },

  reset: () => {
    recentRequestId += 1;
    historyRequestId += 1;
    notificationStateVersion += 1;
    locallyReadNotificationIds.clear();
    get().socket?.disconnect();
    set({
      socket: null,
      recentNotifications: [],
      notifications: [],
      unreadCount: 0,
      nextCursor: null,
      isLoading: false,
      isLoadingRecent: false,
      isLoadingMore: false,
      isMarkingAll: false,
      error: null,
      recentError: null,
      activeFilter: "all",
    });
  },
}));
