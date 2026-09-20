"use client";

import { X, Paperclip, Smile, Send, CheckCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { useFormatter, useTranslations } from "next-intl";

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  isOnline?: boolean;
  responseTime?: string;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i;
const ATTACHMENT_URL = /^(https?:\/\/|\/uploads\/)/i;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function ChatBox({
  isOpen,
  onClose,
  providerId,
  providerName,
  providerAvatar,
  isOnline = false,
  responseTime,
}: ChatBoxProps) {
  const t = useTranslations("Messaging");
  const marketplace = useTranslations("Marketplace");
  const common = useTranslations("Common");
  const format = useFormatter();
  const quickMessages = [
    t("quickDuration"),
    t("quickAvailable"),
    t("quickProjects"),
    t("quickStart"),
    t("quickWeekends"),
  ];
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const {
    connect,
    startCustomConversation,
    setActiveConversation,
    setConversationVisible,
    sendMessage,
    uploadFile,
    messages,
    isLoading,
    clearActiveConversation,
    activeConversation,
    isConnected,
  } = useChatStore();

  useEffect(() => {
    if (!isOpen) {
      setConversationVisible(false);
      clearActiveConversation();
      return;
    }

    let cancelled = false;
    const syncVisibility = () => {
      setConversationVisible(document.visibilityState === "visible");
    };
    clearActiveConversation();
    connect();
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);

    const initChat = async () => {
      const convId = await startCustomConversation(providerId);
      if (convId && !cancelled) {
        await setActiveConversation(convId);
      }
    };
    void initChat();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", syncVisibility);
      setConversationVisible(false);
      clearActiveConversation();
    };
  }, [
    isOpen,
    providerId,
    connect,
    startCustomConversation,
    setActiveConversation,
    setConversationVisible,
    clearActiveConversation,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker when clicking outside
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

  if (!isOpen) return null;

  const handleSend = () => {
    if (!message.trim() || !activeConversation) return;
    if (sendMessage(message.trim())) setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickMessage = (msg: string) => {
    if (!activeConversation) return;
    sendMessage(msg);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    setFileError("");
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setFileError(t("imageOnly"));
      e.target.value = "";
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      if (url && !sendMessage(url)) setFileError(t("reconnecting"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-dvh w-full flex-col border-0 border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:inset-auto sm:bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-4 sm:h-[min(600px,calc(100dvh-2rem))] sm:max-w-md sm:rounded-lg sm:border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {providerAvatar ? (
                <Image
                  src={providerAvatar}
                  alt={providerName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 font-medium text-sm lg uppercase">
                  {providerName.charAt(0)}
                </span>
              )}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0">
                <Image
                  src="/assets/icons/online_indicator.svg"
                  alt={marketplace("online")}
                  width={10}
                  height={10}
                />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {providerName}
            </h3>
            {responseTime && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("averageResponse", { time: responseTime })}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={common("close")}
          className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-900" />
          </div>
        ) : messages.length === 0 ? (
          <>
            <div className="text-center mb-6 mt-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("startWith", { name: providerName.split(" ")[0] })}
              </p>
            </div>
            <div className="space-y-3">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(msg)}
                  disabled={!activeConversation || !isConnected}
                  className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="text-sm text-gray-900 dark:text-white">{msg}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6 flex flex-col justify-end min-h-full">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const isImage = IMAGE_EXTENSIONS.test(msg.content);
              const isAttachment =
                !isImage && ATTACHMENT_URL.test(msg.content);
              return (
                <div
                  key={msg.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed relative group",
                      isMe
                        ? "bg-[#157145] text-white rounded-tr-none"
                        : "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white rounded-tl-none shadow-sm",
                    )}
                  >
                    {isImage ? (
                      <a href={msg.content} target="_blank" rel="noreferrer">
                        <Image
                          src={msg.content}
                          alt={t("sharedImage")}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover max-h-48 w-auto"
                          unoptimized
                        />
                      </a>
                    ) : isAttachment ? (
                      <a
                        href={msg.content}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 underline underline-offset-2"
                      >
                        <Paperclip className="h-4 w-4" />
                        {t("openAttachment")}
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-700 sm:p-4">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-20 left-2 z-50 max-w-[calc(100%-1rem)] overflow-x-auto sm:left-4">
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
        />

        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label={t("chooseEmoji")}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* File/Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("attachFile")}
            disabled={isUploading || !isConnected || !activeConversation}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("typeMessage")}
            className="min-h-11 flex-1 rounded-lg bg-gray-100 px-3 py-2 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-900 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:px-4 sm:text-sm"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            aria-label={t("sendMessage")}
            disabled={!isConnected || !activeConversation || !message.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-brand-900"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {(fileError || !isConnected) && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="status">
            {fileError || t("reconnecting")}
          </p>
        )}
      </div>
    </div>
  );
}
