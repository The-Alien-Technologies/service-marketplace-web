"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Send,
  CheckCheck,
  Smile,
  Paperclip,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { useFormatter, useTranslations } from "next-intl";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i;

function MessagesContent() {
  const t = useTranslations("Messaging");
  const format = useFormatter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const {
    connect,
    disconnect,
    fetchConversations,
    conversations,
    activeConversation,
    setActiveConversation,
    setConversationVisible,
    clearActiveConversation,
    messages,
    sendMessage,
    uploadFile,
    isConnected,
  } = useChatStore();

  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const deepLinkHandledRef = useRef<string | null>(null);

  useEffect(() => {
    clearActiveConversation();
    connect();
    return () => {
      clearActiveConversation();
      disconnect();
    };
  }, [connect, fetchConversations, disconnect, clearActiveConversation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchConversations(searchQuery);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchConversations, searchQuery]);

  useEffect(() => {
    const syncVisibility = () => {
      setConversationVisible(document.visibilityState === "visible");
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncVisibility);
      setConversationVisible(false);
    };
  }, [setConversationVisible]);

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (
      !conversationId ||
      deepLinkHandledRef.current === conversationId ||
      conversations.length === 0
    ) {
      return;
    }
    if (
      conversations.some((conversation) => conversation.id === conversationId)
    ) {
      deepLinkHandledRef.current = conversationId;
      void setActiveConversation(conversationId);
    }
  }, [conversations, searchParams, setActiveConversation]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) sendMessage(url);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] min-h-[28rem] overflow-hidden rounded-xl border border-gray-200 bg-white md:h-[calc(100vh-8rem)] md:flex-row">
      {/* Sidebar List */}
      <div
        className={cn(
          "w-full flex-col border-r border-gray-200 bg-white md:w-80 lg:w-96",
          activeConversation ? "hidden md:flex" : "flex",
        )}
      >
        <div className="p-4 pb-2 sm:p-6 sm:pb-2">
          <h1 className="text-xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t("searchChats")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9 bg-white border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => {
            const otherUser =
              chat.userId === user?.id ? chat.provider : chat.user;
            const lastMessage =
              chat.messages?.[0]?.content || t("noMessages");
            const isImage = IMAGE_EXTENSIONS.test(lastMessage);

            return (
              <button
                key={chat.id}
                onClick={() => setActiveConversation(chat.id)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left",
                  activeConversation?.id === chat.id
                    ? "bg-green-50 ring-1 ring-inset ring-green-200"
                    : "",
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    {otherUser?.avatar ? (
                      <Image
                        src={otherUser.avatar}
                        alt={otherUser.firstName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium text-lg uppercase">
                        {otherUser?.firstName?.charAt(0)}
                        {otherUser?.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="font-bold text-gray-900 truncate">
                      {otherUser?.firstName} {otherUser?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format.dateTime(new Date(chat.updatedAt), {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm text-gray-500">
                      {isImage ? `📎 ${t("imageAttachment")}` : lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-[11px] font-bold text-white">
                        {chat.unreadCount > 99 ? "99+" : format.number(chat.unreadCount)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-gray-500">
              {searchQuery.trim() ? t("noSearchMatches") : t("noConversations")}
            </p>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 flex-col bg-gray-50/30",
          activeConversation ? "flex" : "hidden md:flex",
        )}
      >
        {activeConversation ? (
          (() => {
            const otherUser =
              activeConversation.userId === user?.id
                ? activeConversation.provider
                : activeConversation.user;
            return (
              <>
                {/* Header */}
                <div className="flex min-h-16 items-center justify-between border-b border-gray-200 bg-white px-3 py-2 sm:px-6">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={clearActiveConversation}
                      aria-label={t("backToConversations")}
                      className="-ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {otherUser?.avatar ? (
                          <Image
                            src={otherUser.avatar}
                            alt={otherUser.firstName}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium text-sm uppercase">
                            {otherUser?.firstName?.charAt(0)}
                            {otherUser?.lastName?.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="truncate font-bold text-gray-900">
                      {otherUser?.firstName} {otherUser?.lastName}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex flex-1 flex-col-reverse overflow-y-auto p-3 sm:p-6">
                  <div className="space-y-6 flex flex-col justify-end min-h-full">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      const isImage = IMAGE_EXTENSIONS.test(msg.content);
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isMe ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] lg:max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed relative group",
                              isMe
                                ? "bg-[#157145] text-white rounded-tr-none"
                                : "bg-white text-gray-700 rounded-tl-none shadow-sm",
                            )}
                          >
                            {isImage ? (
                              <a
                                href={msg.content}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Image
                                  src={msg.content}
                                  alt={t("sharedImage")}
                                  width={200}
                                  height={200}
                                  className="rounded-lg object-cover max-h-48 w-auto"
                                  unoptimized
                                />
                              </a>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                            <div
                              className={cn(
                                "text-[10px] mt-1 flex items-center justify-end gap-1",
                                isMe ? "text-green-100" : "text-gray-400",
                              )}
                            >
                              {format.dateTime(new Date(msg.createdAt), {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {isMe && msg.isRead && (
                                <CheckCheck className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200 relative">
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-16 left-2 z-50 max-w-[calc(100%-1rem)] overflow-x-auto sm:left-4"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.AUTO}
                        height={320}
                        width={280}
                      />
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />

                  <div className="flex items-end gap-2">
                    {/* Emoji button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-gray-600 mb-0.5"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      aria-label={t("chooseEmoji")}
                    >
                      <Smile className="w-6 h-6" />
                    </Button>

                    <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4 py-2 gap-2 border border-transparent focus-within:border-gray-200 transition-colors">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={5000}
                        placeholder={t("typeMessage")}
                        className="min-h-11 flex-1 border-0 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-500 sm:text-sm"
                      />
                      <div className="flex items-center gap-2 text-gray-400">
                        {/* Send */}
                        <button
                          type="button"
                          onClick={handleSend}
                          disabled={!isConnected || !inputText.trim()}
                          className="hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={t("sendMessage")}
                        >
                          <Send className="w-5 h-5 -rotate-45" />
                        </button>
                        {/* File upload */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading || !isConnected}
                          className="hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={t("attachFile")}
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Paperclip className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4 opacity-50">
              <div className="w-8 h-8 bg-gray-400 rounded-full" />
            </div>
            <p className="text-gray-500 font-medium">
              {t("emptySelection")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-5.5rem)] min-h-[28rem] animate-pulse rounded-xl border border-gray-200 bg-white md:h-[calc(100vh-8rem)]" />
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
