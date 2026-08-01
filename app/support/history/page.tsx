"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  Loader2,
  AlertCircle,
  Bot,
  Headphones,
  ChevronRight,
  ArrowLeft,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuthStore } from "@/store/auth-store";
import { apiService } from "@/lib/api";
import {
  SupportConversation,
  SupportConversationStatus,
  SupportMessage,
} from "@/types/support";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<
  SupportConversationStatus,
  { label: string; badgeBg: string; badgeText: string }
> = {
  BOT: {
    label: "Bot",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
  },
  AWAITING_FOR_ADMIN: {
    label: "Waiting",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
  },
  ACTIVE_WITH_ADMIN: {
    label: "Active",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
  },
  CLOSED: {
    label: "Closed",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-500",
  },
};

// ─── Message bubble (read-only transcript) ────────────────────────────────────

function TranscriptBubble({
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
      <div className="flex items-start gap-2 max-w-[80%]">
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

  if (isAdmin) {
    const name = message.sender
      ? `${message.sender.firstName ?? ""} ${message.sender.lastName ?? ""}`.trim() ||
        "Support Agent"
      : "Support Agent";
    return (
      <div className="flex items-start gap-2 max-w-[80%]">
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1">
          <Headphones className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 ml-1">
            {name} · Agent
          </p>
          <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-xl rounded-tl-none text-sm text-gray-900 prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 ml-1">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end ml-auto max-w-[80%]">
      <div className="px-3 py-2 bg-blue-600 rounded-xl rounded-tr-none text-sm text-white prose prose-sm max-w-none prose-invert">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      <p className="text-[10px] text-gray-400 mt-1 mr-1">{time}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push("/");
  }, [hasHydrated, isAuthenticated, router]);

  // Load conversations list
  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    apiService
      .getMySupportConversations()
      .then(setConversations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  // Open a conversation (load full messages)
  const openConversation = async (conv: SupportConversation) => {
    setIsLoadingMessages(true);
    try {
      const full = await apiService.getSupportConversation(conv.id);
      setSelected(full);
    } catch {
      setSelected(conv);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Support History</h1>
          <p className="text-xs text-gray-500">
            All your past and active support conversations
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 flex gap-6 h-[calc(100vh-73px)]">
        {/* ── Conversation list ──────────────────────────────────────── */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-4 text-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-4 text-center">
              <MessageCircle className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-500">
                No conversations yet
              </p>
              <p className="text-xs text-gray-400">
                Use the support chat button to get help
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const meta = STATUS_META[conv.status];
              const lastMsg = conv.messages?.[0];
              const isOpenChat = conv.status !== "CLOSED";
              const isSelected = selected?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-green-50/60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(conv.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {lastMsg ? (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                      {lastMsg.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mb-1">
                      No messages
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {conv.admin && (
                      <span className="text-[10px] text-gray-400">
                        Agent: {conv.admin.firstName} {conv.admin.lastName}
                      </span>
                    )}
                    <span
                      className={`ml-auto text-[10px] font-medium ${
                        isOpenChat ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {isOpenChat ? "Continue" : "View"}{" "}
                      <ChevronRight className="inline w-2.5 h-2.5" />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Transcript panel ───────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : !selected ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
              <MessageCircle
                className="w-12 h-12 text-gray-200"
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium text-gray-400">
                Select a conversation to view its transcript
              </p>
            </div>
          ) : (
            <>
              {/* Transcript header */}
              <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Conversation on{" "}
                      {new Date(selected.createdAt).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          STATUS_META[selected.status].badgeBg
                        } ${STATUS_META[selected.status].badgeText}`}
                      >
                        {STATUS_META[selected.status].label}
                      </span>
                      {selected.admin && (
                        <span className="text-xs text-gray-400">
                          Handled by {selected.admin.firstName}{" "}
                          {selected.admin.lastName}
                        </span>
                      )}
                      {selected.adminJoinedAt && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Agent joined{" "}
                          {new Date(selected.adminJoinedAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Continue chat button if still open */}
                  {selected.status !== "CLOSED" && (
                    <button
                      onClick={() => window.scrollTo({ top: 0 })}
                      className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Continue chat
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {(selected.messages ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No messages in this conversation
                  </p>
                ) : (
                  (selected.messages ?? []).map((msg) => (
                    <TranscriptBubble
                      key={msg.id}
                      message={msg}
                      isOwn={
                        msg.senderType === "USER" ||
                        msg.senderType === "SERVICE_PROVIDER"
                      }
                    />
                  ))
                )}
              </div>

              {selected.status === "CLOSED" && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-center shrink-0">
                  This conversation was closed on{" "}
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
