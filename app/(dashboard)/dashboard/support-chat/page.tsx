"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Bot,
  Headphones,
  MessageCircle,
  Send,
  X,
  UserCheck,
  Clock,
  Users,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initiatorName(conv: SupportConversation) {
  const firstName = conv.initiator?.firstName ?? "";
  const lastName = conv.initiator?.lastName ?? "";

  return `${firstName} ${lastName}`.trim() || "Unknown user";
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const BADGE: Record<
  SupportConversationStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  BOT: {
    label: "Bot",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  AWAITING_FOR_ADMIN: {
    label: "Waiting",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  ACTIVE_WITH_ADMIN: {
    label: "Active",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-400",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-300",
  },
};

function StatusBadge({ status }: { status: SupportConversationStatus }) {
  const b = BADGE[status] ?? BADGE.CLOSED
  console.log("status value " + status);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${b.bg} ${b.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
      {b.label}
    </span>
  );
}

// ─── Conversation card ────────────────────────────────────────────────────────

function ConvCard({
  conv,
  isSelected,
  onSelect,
  onJoin,
  isJoining,
}: {
  conv: SupportConversation;
  isSelected: boolean;
  onSelect: () => void;
  onJoin?: () => void;
  isJoining?: boolean;
}) {
  const lastMsg = conv.messages?.[0];
  const isWaiting = conv.status === "AWAITING_FOR_ADMIN";

  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
        isSelected ? "bg-green-50/60 border-l-2 border-l-green-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
            {conv.initiator?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conv.initiator.avatar}
                alt={initiatorName(conv)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-700 text-sm font-semibold">
                {initiatorName(conv).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {initiatorName(conv)}
            </p>
            <p className="text-[10px] text-gray-400">
              {conv.initiatorType === "SERVICE_PROVIDER"
                ? "Service Provider"
                : "User"}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <StatusBadge status={conv.status} />
          <span className="text-[10px] text-gray-400">
            {formatElapsed(conv.updatedAt)}
          </span>
        </div>
      </div>

      {lastMsg && (
        <p className="text-xs text-gray-500 line-clamp-2 pl-10">
          {lastMsg.content}
        </p>
      )}

      {isWaiting && onJoin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onJoin();
          }}
          disabled={isJoining}
          className="mt-2 ml-10 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
        >
          {isJoining ? (
            <Loader2 className="w-3 h-3 animate-spin inline" />
          ) : (
            "Join Conversation"
          )}
        </button>
      )}
    </div>
  );
}

// ─── Message bubble (admin chat view) ────────────────────────────────────────

function AdminMessageBubble({ message }: { message: SupportMessage }) {
  const isBot = message.senderType === "BOT";
  const isAdmin = message.senderType === "ADMIN";
  const isUser =
    message.senderType === "USER" ||
    message.senderType === "SERVICE_PROVIDER";
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isBot) {
    return (
      <div className="flex items-start gap-2 max-w-[75%]">
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 ml-1">KWADWO</p>
          <div className="px-3 py-2 bg-gray-100 rounded-xl rounded-tl-none text-sm text-gray-900 prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 ml-1">{time}</p>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-start max-w-[75%]">
        <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl rounded-tl-none text-sm text-gray-900 prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-1">{time}</p>
      </div>
    );
  }

  // Admin's own message — right side
  if (isAdmin) {
    return (
      <div className="flex flex-col items-end ml-auto max-w-[75%]">
        <div className="px-3 py-2 bg-green-600 rounded-xl rounded-tr-none text-sm text-white prose prose-sm max-w-none prose-invert">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 mr-1">{time}</p>
      </div>
    );
  }

  return null;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "waiting" | "active" | "closed";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSupportChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  // Redirect non-admins
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || user?.role !== "ADMIN") router.push("/dashboard");
  }, [hasHydrated, isAuthenticated, user, router]);

  const [tab, setTab] = useState<Tab>("waiting");
  const [waiting, setWaiting] = useState<SupportConversation[]>([]);
  const [active, setActive] = useState<SupportConversation[]>([]);
  const [closed, setClosed] = useState<SupportConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  //selected trigger
  useEffect(() => {
  if (!selected) return;

  setWaiting((prev) =>
    prev.map((c) => (c.id === selected.id ? { ...c, ...selected } : c))
  );

  setActive((prev) =>
    prev.map((c) => (c.id === selected.id ? { ...c, ...selected } : c))
  );

  setClosed((prev) =>
    prev.map((c) => (c.id === selected.id ? { ...c, ...selected } : c))
  );
}, [selected]);

//auto update admin page for new support request
// useEffect(() => {
//   const interval = setInterval(async () => {
//     const data = await apiService.getAdminSupportConversations();

//     setWaiting(data.waiting);
//     setActive(data.active);
//     setClosed(data.close);
//   }, 10000);

//   return () => clearInterval(interval);
// }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load all conversations ─────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiService.getAdminSupportConversations();
      setWaiting(data.waiting);
      setActive(data.active);
      setClosed(data.close);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") return;
    loadConversations();
  }, [isAuthenticated, user, loadConversations]);

  // ── Socket callbacks ───────────────────────────────────────────────────────

  const handleSocketMessage = useCallback((msg: SupportMessage) => {
    setMessages((prev) =>
      prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
  }, []);

  const handleNewWaiting = useCallback((conv: SupportConversation) => {
    setWaiting((prev) =>
      prev.find((c) => c.id === conv.id) ? prev : [conv, ...prev]
    );
  }, []);

  const handleAdminTook = useCallback((conversationId: string) => {
    setWaiting((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  const handleAdminJoined = useCallback((conv: SupportConversation) => {
  setWaiting((prev) => prev.filter((c) => c.id !== conv.id));

  const waitingConv = waiting.find((c) => c.id === conv.id);

  setActive((prev) => {
    const existing = prev.find((c) => c.id === conv.id);

    const updated = {
      ...existing,
      ...waitingConv,
      ...conv,
      status: "ACTIVE_WITH_ADMIN" as SupportConversationStatus,
      initiator: conv.initiator || waitingConv?.initiator || existing?.initiator,
      messages: conv.messages ||  waitingConv?.messages || existing?.messages || [],
    };

    return [updated, ...prev.filter((c) => c.id !== conv.id)];
  });

  setSelected((prev) =>
    prev?.id === conv.id
      ? {
          ...prev,
          ...conv,
          status: "ACTIVE_WITH_ADMIN" as SupportConversationStatus,
          initiator: conv.initiator || prev.initiator,
          messages: conv.messages || prev.messages,
        }
      : prev
  );
}, [waiting]);

  const handleClosed = useCallback((conv: SupportConversation) => {
    setWaiting((prev) => prev.filter((c) => c.id !== conv.id));
    setActive((prev) => prev.filter((c) => c.id !== conv.id));

    setClosed((prev) => {
      const existing = prev.find((c) => c.id === conv.id);

      const updated = existing
        ? {
            ...existing,
            ...conv,
            initiator: existing.initiator,
          }
        : conv;

      return [updated, ...prev.filter((c) => c.id !== conv.id)];
    });

    setSelected((prev) =>
      prev?.id === conv.id
        ? {
            ...prev,
            ...conv,
            initiator: prev.initiator,
            messages: prev.messages,
          }
        : prev
    );
  }, []);

  useSupportSocket(isAuthenticated && user?.role === "ADMIN", {
    onMessage: handleSocketMessage,
    onNewWaiting: handleNewWaiting,
    onAdminTookConversation: handleAdminTook,
    onAdminJoined: handleAdminJoined,
    onClosed: handleClosed,
  });

  // ── Poll for new messages in the selected conversation ────────────────────
  // Needed because the backend's support:join handler has a bug that prevents
  // client sockets from joining conversation rooms via WebSocket.
  useEffect(() => {
    if (!selected?.id || selected.status === "CLOSED") return;

    const tick = async () => {
      try {
        const fresh = await apiService.getSupportConversation(selected.id);

        setMessages((prev) => {
          const pending = prev.filter((m) => m.id.startsWith("temp-"));
          const serverMessages = fresh.messages ?? [];
          if (
            pending.length === 0 &&
            serverMessages.length === prev.length &&
            serverMessages.every((m, i) => m.id === prev[i]?.id)
          ) {
            return prev;
          }
          // return [...serverMessages, ...pending];
          return Array.from(new Map([...serverMessages, ...pending].map((m) => [m.id, m])).values());
        });

        // Keep conversation metadata in sync (status, adminId)
          setSelected((prev) => {
            if (!prev) return fresh;

            return {
              ...prev,
              ...fresh,
              initiator: fresh.initiator || prev.initiator,
              messages: fresh.messages || prev.messages,
            };
          });

        // Keep the lists in sync too
        // if (fresh.status === "CLOSED") {
        //   const updatedConv = {
        //       ...selected,
        //       ...fresh,
        //       initiator: fresh.initiator ?? selected?.initiator,
        //   };
        //   setActive((prev) => prev.filter((c) => c.id !== fresh.id));
        //   setClosed((prev) => [
        //       updatedConv,
        //       ...prev.filter((c) => c.id !== fresh.id),
        //     ]);
        // }
      } catch {
        // Ignore transient errors
      }
    };

    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [selected?.id, selected?.status]);

  // ── Open a conversation ────────────────────────────────────────────────────

  const openConversation = async (conv: SupportConversation) => {
    setSelected(conv);
    setMessages([]);
    setIsLoadingMessages(true);
    try {
      const full = await apiService.getSupportConversation(conv.id);
        setSelected((prev) => ({
          ...prev,
          ...full,
          initiator: full.initiator || prev?.initiator,
          messages: full.messages || prev?.messages,
        }));

      setMessages(
        Array.from(
          new Map(
            (full.messages ?? []).map((m, i) => [`${m.id}-${i}`, m])
          ).values()
        )
      );
    } catch {
      setMessages(conv.messages ?? []);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // ── Join a waiting conversation ────────────────────────────────────────────

    const joinConversation = async (convId: string) => {
      setJoiningId(convId);

      try {
        // preserve existing waiting conversation data
        const existingConv = waiting.find((c) => c.id === convId);

        // join API
        const joinedConv = await apiService.adminJoinSupportConversation(convId);

        // merge joined + old initiator/avatar/messages
        const safeConv = {
          ...existingConv,
          ...joinedConv,
          initiator: joinedConv.initiator || existingConv?.initiator,
          messages: joinedConv.messages || existingConv?.messages || [],
        };

        setWaiting((prev) => prev.filter((c) => c.id !== convId));

        setActive((prev) => [
          safeConv,
          ...prev.filter((c) => c.id !== convId),
        ]);

        setTab("active");
        setSelected(safeConv);

        await openConversation(safeConv);
      } catch (e) {
        console.error("Join failed", e);
      } finally {
        setJoiningId(null);
      }
    };

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const content = inputText.trim();
    if (!content || !selected || isSending) return;
    setInputText("");
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: SupportMessage = {
      id: tempId,
      conversationId: selected.id,
      senderType: "ADMIN",
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id ?? "",
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await apiService.sendSupportMessage(selected.id, content);
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return [...without, result.userMessage];
      });
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      console.error("Send failed", e);
    } finally {
      setIsSending(false);
    }
  };

  // ── Close conversation (admin) ─────────────────────────────────────────────

  const closeConversation = async () => {
    if (!selected || selected.status === "CLOSED") return;
    try {
      const conv = await apiService.adminCloseSupportConversation(selected.id);
      const updatedCov = {
        ...selected, //keep initiator/avatar/messages
        ...conv, //overrite status/updatedAt
        initiator: conv.initiator ?? selected.initiator, //force initiator if return null with cov
      };

      setActive((prev) => prev.filter((c) => c.id !== updatedCov.id));

      setClosed((prev) => [updatedCov, ...prev.filter((c)=> c.id !== updatedCov.id)]);
      setSelected(updatedCov);
    } catch (e: unknown) {
      console.error("Close failed", e);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!hasHydrated || user?.role !== "ADMIN") return null;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "waiting", label: "Waiting", count: waiting.length },
    { id: "active", label: "Active", count: active.length },
    { id: "closed", label: "Closed", count: closed.length },
  ];

  const TAB_COLOR: Record<Tab, string> = {
    waiting: "text-amber-600 border-amber-500",
    active: "text-green-600 border-green-500",
    closed: "text-gray-500 border-gray-400",
  };

  const currentList =
    tab === "waiting" ? waiting : tab === "active" ? active : closed;

  const isClosed = selected?.status === "CLOSED";
  const isActive = selected?.status === "ACTIVE_WITH_ADMIN";
  const isAdminAssigned = selected?.adminId === user?.id;

  console.log(
  "currentList ids",
  currentList.map((c) => c.id)
);

console.log(
  "message ids",
  messages.map((m) => m.id)
);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Chat</h1>
        <p className="text-gray-500 mt-1">
          Manage live customer support conversations
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            id: 1,
            label: "Waiting",
            count: waiting.length,
            icon: Clock,
            color: "text-amber-600 bg-amber-50",
          },
          {
            id: 2,
            label: "Active",
            count: active.length,
            icon: UserCheck,
            color: "text-green-600 bg-green-50",
          },
          {
            id: 3,
            label: "Closed",
            count: closed.length,
            icon: Users,
            color: "text-gray-600 bg-gray-50",
          },
        ].map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}
            >
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main split layout */}
      <div className="flex gap-5 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Left: conversation list */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  tab === t.id
                    ? TAB_COLOR[t.id]
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-xs text-gray-500">{error}</p>
              </div>
            ) : currentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-1 text-center px-4">
                <MessageCircle
                  className="w-7 h-7 text-gray-200"
                  strokeWidth={1.5}
                />
                <p className="text-xs text-gray-400">
                  No {tab} conversations
                </p>
              </div>
            ) : (
              currentList.map((conv, index) => {
                const displayConv =
                  selected?.id === conv.id
                    ? { ...conv, status: selected.status }
                    : conv;

                return (
                  <ConvCard
                    key={conv.id ?? `${conv.updatedAt}-${index}`}
                    conv={displayConv}
                    isSelected={selected?.id === conv.id}
                    onSelect={() => openConversation(conv)}
                    onJoin={
                      tab === "waiting"
                        ? () => joinConversation(conv.id)
                        : undefined
                    }
                    isJoining={joiningId === conv.id}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right: chat view */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
              <Headphones
                className="w-12 h-12 text-gray-200"
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium text-gray-400">
                Select a conversation to start helping
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {selected?.initiator?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.initiator.avatar}
                        alt={initiatorName(selected)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-700 font-semibold">
                        {initiatorName(selected).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {initiatorName(selected)}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selected.status} />
                      <span className="text-[10px] text-gray-400">
                        {selected.initiatorType === "SERVICE_PROVIDER"
                          ? "Service Provider"
                          : "User"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isActive && isAdminAssigned && (
                    <button
                      onClick={closeConversation}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Close
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center flex-1">
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No messages yet
                  </p>
                ) : (
                  messages.map((msg, index) => (
                    <AdminMessageBubble
                      key={`${msg.id}-${msg.createdAt}-${index}`}
                      message={msg}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input — only when admin is assigned and chat is active */}
              {isActive && isAdminAssigned && (
                <div className="px-4 py-3 border-t border-gray-100 shrink-0">
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
                      placeholder="Type a reply…"
                      disabled={isSending}
                      className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim() || isSending}
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

              {/* Waiting state: prompt to join */}
              {selected.status === "AWAITING_FOR_ADMIN" && (
                <div className="px-4 py-3 border-t border-gray-100 bg-amber-50 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-amber-700">
                      This user is waiting for a human agent.
                    </p>
                    <button
                      onClick={() => joinConversation(selected.id)}
                      disabled={joiningId === selected.id}
                      className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors"
                    >
                      {joiningId === selected.id ? (
                        <Loader2 className="w-3 h-3 animate-spin inline" />
                      ) : (
                        "Join Conversation"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isClosed && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center shrink-0">
                  Conversation closed ·{" "}
                  {new Date(selected.updatedAt).toLocaleDateString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
