import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Conversation, Message } from "@/types/chat";
import { apiService } from "@/lib/api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

interface ChatState {
  socket: Socket | null;
  isConnected: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string) => Promise<void>;
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
  messages: [],
  isLoading: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      set({ isConnected: true });
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });

    newSocket.on("receive_message", (message: Message) => {
      const { activeConversation, conversations } = get();

      // If message belongs to active chat, append it to view
      if (
        activeConversation &&
        activeConversation.id === message.conversationId
      ) {
        set((state) => ({ messages: [...state.messages, message] }));
      }

      // Update conversations list latest message
      const updatedConversations = conversations
        .map((c) =>
          c.id === message.conversationId
            ? { ...c, messages: [message], updatedAt: message.createdAt }
            : c,
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

      set({ conversations: updatedConversations });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
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
      const data = await res.json();
      if (data.data) {
        const conversation = data.data.conversation;
        // Store the conversation directly — no need to wait for fetchConversations
        const { conversations } = get();
        if (!conversations.find((c) => c.id === conversation.id)) {
          set({ conversations: [...conversations, conversation] });
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
    const { socket, conversations } = get();
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
      const data = await res.json();
      if (data.data) {
        set({ messages: data.data.messages });

        // Join socket room
        if (socket?.connected) {
          socket.emit("join_conversation", conversationId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearActiveConversation: () => {
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
