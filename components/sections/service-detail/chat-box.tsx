"use client";

import { X, Paperclip, Smile, Send, CheckCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  isOnline?: boolean;
  responseTime?: string;
}

const quickMessages = [
  "How long would this project take to complete?",
  "Hi, are you available to take on a project right now?",
  "Can you share some recent projects you've worked on?",
  "What's the earliest you can start?",
  "Are you available on Weekends"
];

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i;

export function ChatBox({
  isOpen,
  onClose,
  providerId,
  providerName,
  providerAvatar,
  isOnline = true,
  responseTime = "30mins",
}: ChatBoxProps) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const {
    connect,
    startCustomConversation,
    setActiveConversation,
    sendMessage,
    uploadFile,
    messages,
    isLoading,
    clearActiveConversation,
    activeConversation,
  } = useChatStore();

  useEffect(() => {
    if (isOpen) {
      connect();
      const initChat = async () => {
        const convId = await startCustomConversation(providerId);
        if (convId) {
          await setActiveConversation(convId);
        }
      };
      initChat();
    } else {
      clearActiveConversation();
    }
  }, [
    isOpen,
    providerId,
    connect,
    startCustomConversation,
    setActiveConversation,
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
    sendMessage(message.trim());
    setMessage("");
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
    <div className="fixed inset-0 sm:inset-auto sm:right-4 sm:bottom-4 w-full h-[100dvh] sm:h-[600px] sm:max-w-md bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-2xl z-50 flex flex-col border-0 sm:border border-gray-200 dark:border-gray-700">
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
                  alt="Online"
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Avg. response time {responseTime}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-900" />
          </div>
        ) : messages.length === 0 ? (
          <>
            <div className="text-center mb-6 mt-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start your conversation with {providerName.split(" ")[0]}
              </p>
            </div>
            <div className="space-y-3">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(msg)}
                  className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                          alt="shared image"
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
                      {new Date(msg.createdAt).toLocaleTimeString([], {
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-20 left-4 z-50">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.AUTO}
              height={350}
              width={300}
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

        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* File/Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
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
            placeholder="Type here..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-900"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!activeConversation || !message.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-brand-900"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
