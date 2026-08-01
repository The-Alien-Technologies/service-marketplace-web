"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  X,
  Send,
  Bot,
  Headphones,
  ChevronLeft,
  MessageCircle,
  Loader2,
  UserCheck,
  History,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";


import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import { useSupportSocket } from "@/hooks/use-support-socket";
import {
  SupportConversation,
  SupportConversationStatus,
  SupportMessage,
} from "@/types/support";

import { useSupportChatStore } from "@/store/support-chat-store";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SupportConversationStatus,
  {
    label: string;
    subLabel: string;
    dotColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  BOT: {
    label: "KWADWO",
    subLabel: "Pavodah Virtual Assistant",
    dotColor: "bg-blue-400",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  AWAITING_FOR_ADMIN: {
    label: "Waiting for agent…",
    subLabel: "You are in the queue",
    dotColor: "bg-amber-400 animate-pulse",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  ACTIVE_WITH_ADMIN: {
    label: "Support Agent",
    subLabel: "Live support connected",
    dotColor: "bg-green-400",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
  },
  CLOSED: {
    label: "Conversation Closed",
    subLabel: "This session has ended",
    dotColor: "bg-gray-300",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
  },
};


// ─── Message bubble ───────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
}: {
  message: SupportMessage;
  isOwn: boolean;
}) {
  const isBot = message.senderType === "BOT";
  const isAdmin = message.senderType === "ADMIN";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isBot) {
    return (
      <div className="flex items-start gap-2 self-start max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 ml-1">KWADWO</p>
          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl rounded-tl-none text-sm text-gray-900 dark:text-white prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 ml-1">{time}</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    const name = message.sender
      ? `${message.sender.firstName ?? ""} ${message.sender.lastName ?? ""}`.trim() ||
        "Support Agent"
      : "Support Agent";
    return (
      <div className="flex items-start gap-2 self-start max-w-[85%]">
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1">
          <Headphones className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 ml-1">
            {name} · Agent
          </p>
          <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 rounded-xl rounded-tl-none text-sm text-gray-900 dark:text-white prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 ml-1">{time}</p>
        </div>
      </div>
    );
  }

  // Own message (USER / SERVICE_PROVIDER)
  return (
    <div className="flex flex-col items-end self-end max-w-[85%]">
      <div className="px-3 py-2 bg-blue-600 rounded-xl rounded-tr-none text-sm text-white prose prose-sm max-w-none prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      <p className="text-[10px] text-gray-400 mt-1 mr-1">{time}</p>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-start gap-2 self-start">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex gap-1 px-3 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Status info bar ──────────────────────────────────────────────────────────

function StatusBar({ status }: { status: SupportConversationStatus }) {
  const cfg = STATUS_CONFIG[status];

  if (status === "BOT" || status === "ACTIVE_WITH_ADMIN") return null;

  return (
    <div
      className={`mx-3 mt-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      {status === "AWAITING_FOR_ADMIN" && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>
            Your request is queued. A human agent will join shortly. Please
            hold on.
          </span>
        </>
      )}
      {status === "CLOSED" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            This conversation is closed. Start a new chat if you need further
            help.
          </span>
        </>
      )}
    </div>
  );
}

// ─── Quick-start prompts ──────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "How can I place an order?",
  "How do I contact a provider?",
  "How do disputes work?",
  "Tell me about Pavodah",
];

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({
  conv,
  onOpen,
}: {
  conv: SupportConversation;
  onOpen: (conv: SupportConversation) => void;
}) {
  const cfg = STATUS_CONFIG[conv.status];
  const isOpen = conv.status !== "CLOSED";
  const lastMsg = conv.messages?.[0];
  const date = new Date(conv.createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.badgeBg} ${cfg.badgeText}`}
        >
          {conv.status === "AWAITING_FOR_ADMIN"
            ? "Waiting"
            : conv.status === "ACTIVE_WITH_ADMIN"
            ? "Active"
            : conv.status === "CLOSED"
            ? "Closed"
            : "Bot"}
        </span>
        <span className="text-[10px] text-gray-400">{date}</span>
      </div>

      {lastMsg && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
          {lastMsg.content}
        </p>
      )}

      {conv.admin && (
        <p className="text-[10px] text-gray-400 mb-1">
          Agent: {conv.admin.firstName} {conv.admin.lastName}
        </p>
      )}

      <button
        onClick={() => onOpen(conv)}
        className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
      >
        {isOpen ? "Continue →" : "View transcript →"}
      </button>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function SupportChatWidget() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const { isOpen, openChat, closeChat } = useSupportChatStore();

  // const [isOpen, setIsOpen] = useState(false);
  // const [isOpenChatState, setIsOpenChat] = useState(false);

  const [view, setView] = useState<"chat" | "history">("chat");

  // Conversation
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null
  );
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Input
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Admin-joined banner
  const [showAdminBanner, setShowAdminBanner] = useState(false);

  // History
  const [conversations, setConversations] = useState<SupportConversation[]>(
    []
  );
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  // Focus input when chat panel opens
  useEffect(() => {
    if (isOpen && view === "chat") {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, view]);

  // Auto-hide admin-joined banner
  useEffect(() => {
    if (!showAdminBanner) return;
    const t = setTimeout(() => setShowAdminBanner(false), 5000);
    return () => clearTimeout(t);
  }, [showAdminBanner]);

  // Socket callbacks (stable refs, no reconnect on re-render)
  const handleSocketMessage = useCallback((msg: SupportMessage) => {
    setMessages((prev) =>
      prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
    setIsBotTyping(false);
  }, []);

  const handleEscalated = useCallback((conv: SupportConversation) => {
    setConversation(conv);
  }, []);

  const handleAdminJoined = useCallback((conv: SupportConversation) => {
    setConversation(conv);
    setShowAdminBanner(true);
  }, []);

  const handleClosed = useCallback((conv: SupportConversation) => {
    setConversation(conv);
  }, []);

  const socket = useSupportSocket(isAuthenticated && isOpen, {
    onMessage: handleSocketMessage,
    onEscalated: handleEscalated,
    onAdminJoined: handleAdminJoined,
    onClosed: handleClosed,
  });

  // Join WebSocket room when conversation is ready
  useEffect(() => {
    if (conversation?.id && isAuthenticated) {
      socket.joinConversation(conversation.id);
    }
  }, [conversation?.id, isAuthenticated]);

  // Start/resume conversation when the widget first opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated || conversation || isLoading) return;
    setIsLoading(true);
    setError(null);
    apiService
      .startSupportConversation()
      .then((conv) => {
        setConversation(conv);
        setMessages(conv.messages ?? []);
      })
      .catch((e: Error) => setError(e.message ?? "Could not connect."))
      .finally(() => setIsLoading(false));
  }, [isOpen, isAuthenticated, conversation, isLoading]);

  // Load history when switching to history view
  useEffect(() => {
    if (view !== "history" || !isAuthenticated) return;
    setIsHistoryLoading(true);
    apiService
      .getMySupportConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsHistoryLoading(false));
  }, [view, isAuthenticated]);

  // Poll for new messages every 3 s while the chat is open.
  // Needed because the backend's support:join handler has a bug
  // (calls client.leave instead of client.join), so WebSocket room
  // broadcasts never reach the client socket.
  useEffect(() => {
    if (!isOpen || !conversation?.id || conversation.status === "CLOSED") return;

    const tick = async () => {
      try {
        const fresh = await apiService.getSupportConversation(conversation.id);

        // Merge messages: keep any pending optimistic messages, add all server messages
        setMessages((prev) => {
          // const pending = prev.filter((m) => m.id.startsWith("temp-"));
          const pending = prev.filter((m) => {
          if (!m.id.startsWith("temp-")) return false;

          const existsOnServer = (fresh.messages ?? []).some(
            (sm) =>
              sm.content === m.content &&
              sm.senderType === m.senderType
          );

          return !existsOnServer;
        });
          const serverMessages = fresh.messages ?? [];
          // Avoid a re-render when nothing changed
          if (
            pending.length === 0 &&
            serverMessages.length === prev.length &&
            serverMessages.every((m, i) => m.id === prev[i]?.id)
          ) {
            return prev;
          }
          return [...serverMessages, ...pending];
        });

        // Update conversation metadata when status or admin assignment changes
        setConversation((prev) => {
          if (!prev) return fresh;
          if (
            prev.status !== fresh.status ||
            prev.adminId !== fresh.adminId
          ) {
            // Show banner when admin just joined
            if (
              prev.status !== "ACTIVE_WITH_ADMIN" &&
              fresh.status === "ACTIVE_WITH_ADMIN"
            ) {
              setShowAdminBanner(true);
            }
            return { ...fresh, messages: undefined };
          }
          return prev;
        });
      } catch {
        // Ignore transient poll errors
      }
    };

    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [isOpen, conversation?.id, conversation?.status]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || !conversation || isSending) return;

    setInputText("");
    setIsSending(true);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimistic: SupportMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderType:
        user?.role === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    if (conversation.status === "BOT") setIsBotTyping(true);

    try {
      const result = await apiService.sendSupportMessage(
        conversation.id,
        content
      );
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        const fresh: SupportMessage[] = [result.userMessage];
        if (result.botMessage) fresh.push(result.botMessage);
        return [...without, ...fresh];
      });
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError((e as Error).message ?? "Failed to send message.");
    } finally {
      setIsSending(false);
      setIsBotTyping(false);
    }
  };

  const escalate = async () => {
    if (!conversation || conversation.status !== "BOT") return;
    try {
      const conv = await apiService.escalateSupportConversation(conversation.id);
      setConversation(conv);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const closeConversation = async () => {
    if (!conversation || conversation.status === "CLOSED") return;
    try {
      const conv = await apiService.closeSupportConversation(conversation.id);
      setConversation(conv);
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const startNewChat = async () => {
    setConversation(null);
    setMessages([]);
    setError(null);
    setIsLoading(true);
    try {
      const conv = await apiService.startSupportConversation();
      setConversation(conv);
      setMessages(conv.messages ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const openConversationFromHistory = async (conv: SupportConversation) => {
    try {
      const full = await apiService.getSupportConversation(conv.id);
      setConversation(full);
      setMessages(full.messages ?? []);
    } catch {
      setConversation(conv);
      setMessages(conv.messages ?? []);
    }
    setView("chat");
  };

  // ── Guard ──────────────────────────────────────────────────────────────────

  // Only show for authenticated non-admin users
  if (!hasHydrated || !isAuthenticated || user?.role === "ADMIN") return null;

  const status: SupportConversationStatus = conversation?.status ?? "BOT";
  const cfg = STATUS_CONFIG[status];
  const isClosed = status === "CLOSED";
  const isWaiting = status === "AWAITING_FOR_ADMIN";
  const isBot = status === "BOT";

  // ── Render ─────────────────────────────────────────────────────────────────


  // if(!isOpenChat) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => {
            openChat();
            setView("chat");
          }}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center z-50 transition-transform hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-4 w-full max-w-md h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-2">
              {view === "history" && (
                <button
                  onClick={() => setView("chat")}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <div className="relative w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                {status === "ACTIVE_WITH_ADMIN" ? (
                  <Headphones className="w-5 h-5 text-green-600" />
                ) : (
                  <Bot className="w-5 h-5 text-green-600" />
                )}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.dotColor}`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
                  {view === "history" ? "Chat History" : cfg.label}
                </h3>
                <p className="text-xs text-gray-500">
                  {view === "history"
                    ? "Your past conversations"
                    : cfg.subLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setView((v) => (v === "chat" ? "history" : "chat"))
                }
                title="Toggle history"
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <History className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={closeChat}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Admin-joined notification banner */}
          {showAdminBanner && (
            <div className="mx-3 mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700 shrink-0">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              A support agent has joined the conversation!
            </div>
          )}

          {/* ── Chat view ─────────────────────────────────────────────────── */}
          {view === "chat" && (
            <>
              {/* Status bar */}
              <StatusBar status={status} />

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-10">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-gray-500">{error}</p>
                    <button
                      onClick={startNewChat}
                      className="text-xs text-green-600 hover:underline mt-1"
                    >
                      Try again
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs text-gray-400 text-center mb-3">
                      Ask KWADWO anything about Pavodah
                    </p>
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInputText(q);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-800 dark:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={
                        msg.senderType === "USER" ||
                        msg.senderType === "SERVICE_PROVIDER"
                      }
                    />
                  ))
                )}
                {isBotTyping && <TypingDots />}
                <div ref={messagesEndRef} />
              </div>

              {/* Action buttons row */}
              <div className="px-4 py-1.5 flex items-center gap-2 shrink-0">
                {isBot && conversation && (
                  <button
                    onClick={escalate}
                    className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    Talk to a human
                  </button>
                )}
                {isWaiting && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Waiting for an agent…
                  </span>
                )}
                {isClosed && (
                  <button
                    onClick={startNewChat}
                    className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Start new chat
                  </button>
                )}
                {!isClosed && conversation && (
                  <button
                    onClick={closeConversation}
                    className="ml-auto text-xs text-gray-400 hover:text-gray-600 px-2 py-1 transition-colors"
                  >
                    End chat
                  </button>
                )}
              </div>

              {/* Input */}
              {!isClosed && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={
                        isWaiting
                          ? "Waiting for agent…"
                          : "Type your message…"
                      }
                      disabled={isSending || isWaiting || isLoading || !conversation}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white placeholder-gray-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={
                        !inputText.trim() ||
                        isSending ||
                        isWaiting ||
                        isLoading ||
                        !conversation
                      }
                      className="w-9 h-9 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── History view ──────────────────────────────────────────────── */}
          {view === "history" && (
            <div className="flex-1 overflow-y-auto">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                  <MessageCircle
                    className="w-10 h-10 text-gray-300"
                    strokeWidth={1.5}
                  />
                  <p className="text-sm font-medium text-gray-500">
                    No chat history yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Start a conversation to get help
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <HistoryRow
                    key={conv.id}
                    conv={conv}
                    onOpen={openConversationFromHistory}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
