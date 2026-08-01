"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { SupportConversation, SupportMessage } from "@/types/support";

const WS_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
).replace("/api", "");

export interface SupportSocketCallbacks {
  onMessage?: (message: SupportMessage) => void;
  onEscalated?: (conversation: SupportConversation) => void;
  onAdminJoined?: (conversation: SupportConversation) => void;
  onClosed?: (conversation: SupportConversation) => void;
  onNewWaiting?: (conversation: SupportConversation) => void;
  onAdminTookConversation?: (conversationId: string) => void;
  onError?: (message: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * This hook here manages a Socket.io connection to the /support namespace.
 * Callbacks are stored in a ref so they always reflect the latest values
 * without triggering reconnects.
 */
export function useSupportSocket(
  enabled: boolean,
  callbacks: SupportSocketCallbacks
) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const socket = io(`${WS_BASE_URL}/support`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => callbacksRef.current.onConnect?.());
    socket.on("disconnect", () => callbacksRef.current.onDisconnect?.());

    socket.on("support:message", ({ message }: { message: SupportMessage }) =>
      callbacksRef.current.onMessage?.(message)
    );
    socket.on(
      "support:escalated",
      ({ conversation }: { conversation: SupportConversation }) =>
        callbacksRef.current.onEscalated?.(conversation)
    );
    socket.on(
      "support:admin_joined",
      ({ conversation }: { conversation: SupportConversation }) =>
        callbacksRef.current.onAdminJoined?.(conversation)
    );
    socket.on(
      "support:closed",
      ({ conversation }: { conversation: SupportConversation }) =>
        callbacksRef.current.onClosed?.(conversation)
    );
    socket.on(
      "support:new_waiting",
      ({ conversation }: { conversation: SupportConversation }) =>
        callbacksRef.current.onNewWaiting?.(conversation)
    );
    socket.on(
      "support:admin_took_conversation",
      ({ conversationId }: { conversationId: string }) =>
        callbacksRef.current.onAdminTookConversation?.(conversationId)
    );
    socket.on("support:error", ({ message }: { message: string }) =>
      callbacksRef.current.onError?.(message)
    );

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return {
    joinConversation: (conversationId: string) =>
      socketRef.current?.emit("support:join", conversationId),
    joinAsAdmin: (conversationId: string) =>
      socketRef.current?.emit("support:join_as_admin", conversationId),
    sendMessage: (conversationId: string, content: string) =>
      socketRef.current?.emit("support:send_message", { conversationId, content }),
    escalate: (conversationId: string) =>
      socketRef.current?.emit("support:escalate", conversationId),
    close: (conversationId: string) =>
      socketRef.current?.emit("support:close", conversationId),
  };
}
