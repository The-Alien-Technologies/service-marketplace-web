import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Conversation, Message } from "@/types/chat";
import { apiService } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { canAcknowledgeConversation } from "@/lib/chat-visibility";
import { throwIfSessionExpired } from "@/lib/client-session";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

let activeConversationRequestId = 0;

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isConversationVisible: boolean;
  messages: Message[];
  isLoading: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string) => Promise<void>;
  setConversationVisible: (visible: boolean) => void;
  sendMessage: (content: string) => void;
  startCustomConversation: (targetId: string) => Promise<string>;
  uploadFile: (file: File) => Promise<string>; // returns file URL
  clearActiveConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  conversations: [],
  activeConversation: null,
  isConversationVisible: false,
  messages: [],
  isLoading: false,

  connect: () => {
    const existingSocket = get().socket;
    if (existingSocket) {
      if (!existingSocket.connected) existingSocket.connect();
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      set({ isConnected: true });
      const activeConversation = get().activeConversation;
      if (
        activeConversation &&
        canAcknowledgeConversation({
          activeConversationId: activeConversation.id,
          conversationId: activeConversation.id,
          isConversationVisible: get().isConversationVisible,
          documentVisibility: currentDocumentVisibility(),
        })
      ) {
        newSocket.emit("join_conversation", activeConversation.id);
      }
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });

    newSocket.on("receive_message", (message: Message) => {
      const { activeConversation, conversations, isConversationVisible } =
        get();
      const currentUserId = useAuthStore.getState().user?.id;
      const isIncoming = message.senderId !== currentUserId;
      const isActivelyViewing = canAcknowledgeConversation({
        activeConversationId: activeConversation?.id,
        conversationId: message.conversationId,
        isConversationVisible,
        documentVisibility: currentDocumentVisibility(),
      });

      // If message belongs to active chat, append it to view
      if (
        activeConversation &&
        activeConversation.id === message.conversationId
      ) {
        set((state) => ({ messages: [...state.messages, message] }));
        if (isIncoming && isActivelyViewing) {
          newSocket.emit("mark_conversation_read", message.conversationId);
        }
      }

      // Update conversations list latest message
      const updatedConversations = conversations
        .map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                messages: [message],
                updatedAt: message.createdAt,
                unreadCount:
                  (isActivelyViewing &&
                    activeConversation?.id === message.conversationId) ||
                  !isIncoming
                    ? 0
                    : (c.unreadCount || 0) + 1,
              }
            : c,
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

      set({ conversations: updatedConversations });
    });

    newSocket.on(
      "messages_read",
      ({
        conversationId,
        readerId,
      }: {
        conversationId: string;
        readerId: string;
      }) => {
        const currentUserId = useAuthStore.getState().user?.id;
        if (!currentUserId || readerId === currentUserId) return;
        set((state) => ({
          messages:
            state.activeConversation?.id === conversationId
              ? state.messages.map((message) =>
                  message.senderId === currentUserId
                    ? { ...message, isRead: true }
                    : message,
                )
              : state.messages,
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.senderId === currentUserId
                      ? { ...message, isRead: true }
                      : message,
                  ),
                }
              : conversation,
          ),
        }));
      },
    );

    set({ socket: newSocket });
  },

  disconnect: () => {
    activeConversationRequestId += 1;
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        activeConversation: null,
        messages: [],
      });
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      // In a real scenario, you'd add this method to your ApiService
      // For now, doing a direct fetch using the stored token
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${SOCKET_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      throwIfSessionExpired(res.status, Boolean(token));
      const data = await res.json();
      if (data.data) {
        set({ conversations: data.data.conversations });
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      set({ isLoading: false });
    }
  },

  startCustomConversation: async (targetId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${SOCKET_URL}/api/chat/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetId }),
      });
      throwIfSessionExpired(res.status, Boolean(token));
      const data = await res.json();
      if (data.data) {
        const conversation = data.data.conversation;
        // Store the conversation directly — no need to wait for fetchConversations
        const { conversations } = get();
        if (!conversations.find((c) => c.id === conversation.id)) {
          set({
            conversations: [
              ...conversations,
              { ...conversation, unreadCount: 0 },
            ],
          });
        }
        // Refresh the list in the background for the sidebar
        get().fetchConversations();
        return conversation.id;
      }
    } catch (error) {
      console.error("Failed to start conversation", error);
    }
    return "";
  },

  setActiveConversation: async (conversationId: string) => {
    const requestId = ++activeConversationRequestId;
    const { socket, conversations, activeConversation } = get();
    if (
      socket?.connected &&
      activeConversation &&
      activeConversation.id !== conversationId
    ) {
      socket.emit("leave_conversation", activeConversation.id);
    }
    const conversation =
      conversations.find((c) => c.id === conversationId) || null;

    set({ activeConversation: conversation, isLoading: true });

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `${SOCKET_URL}/api/chat/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      throwIfSessionExpired(res.status, Boolean(token));
      const data = await res.json();
      if (
        requestId === activeConversationRequestId &&
        get().activeConversation?.id === conversationId &&
        data.data
      ) {
        const canAcknowledge = canAcknowledgeConversation({
          activeConversationId: conversationId,
          conversationId,
          isConversationVisible: get().isConversationVisible,
          documentVisibility: currentDocumentVisibility(),
        });
        set({ messages: data.data.messages });
        if (canAcknowledge) {
          set((state) => ({
            conversations: state.conversations.map((item) =>
              item.id === conversationId ? { ...item, unreadCount: 0 } : item,
            ),
          }));
        }

        // Joining acknowledges the conversation, so only join while it is visible.
        if (socket?.connected && canAcknowledge) {
          socket.emit("join_conversation", conversationId);
        } else if (canAcknowledge) {
          void apiService
            .markConversationRead(conversationId)
            .catch(() => undefined);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      if (requestId === activeConversationRequestId) {
        set({ isLoading: false });
      }
    }
  },

  setConversationVisible: (visible) => {
    const isVisible = visible && currentDocumentVisibility() === "visible";
    set({ isConversationVisible: isVisible });
    if (!isVisible) return;

    const { activeConversation, socket } = get();
    if (!activeConversation) return;
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === activeConversation.id
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    }));
    if (socket?.connected) {
      socket.emit("join_conversation", activeConversation.id);
    } else {
      void apiService
        .markConversationRead(activeConversation.id)
        .catch(() => undefined);
    }
  },

  clearActiveConversation: () => {
    activeConversationRequestId += 1;
    const { socket, activeConversation } = get();
    if (socket?.connected && activeConversation) {
      socket.emit("leave_conversation", activeConversation.id);
    }
    set({ activeConversation: null, messages: [] });
  },

  sendMessage: (content: string) => {
    const { socket, activeConversation } = get();
    if (socket?.connected && activeConversation) {
      socket.emit("send_message", {
        conversationId: activeConversation.id,
        content,
      });
    }
  },

  uploadFile: async (file: File) => {
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${SOCKET_URL}/api/chat/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      throwIfSessionExpired(res.status, Boolean(token));
      const data = await res.json();
      if (data.data?.url) {
        return data.data.url as string;
      }
    } catch (error) {
      console.error("Failed to upload file", error);
    }
    return "";
  },
}));

function currentDocumentVisibility() {
  return typeof document === "undefined" ? "hidden" : document.visibilityState;
}
