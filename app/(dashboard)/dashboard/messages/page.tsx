"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Send,
  MoreVertical,
  CheckCheck,
  Smile,
  Paperclip,
  Loader2,
} from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/i;

export default function MessagesPage() {
  const { user } = useAuthStore();
  const {
    connect,
    disconnect,
    fetchConversations,
    conversations,
    activeConversation,
    setActiveConversation,
    clearActiveConversation,
    messages,
    sendMessage,
    uploadFile,
  } = useChatStore();

  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect();
    fetchConversations();
    return () => {
      clearActiveConversation();
      disconnect();
    };
  }, [connect, fetchConversations, disconnect, clearActiveConversation]);

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
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row bg-white rounded-xl overflow-hidden border border-gray-200">
      {/* Sidebar List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search for chat"
              className="pl-9 bg-white border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => {
            const otherUser =
              chat.userId === user?.id ? chat.provider : chat.user;
            const lastMessage =
              chat.messages?.[0]?.content || "No messages yet";
            const isImage = IMAGE_EXTENSIONS.test(lastMessage);

            return (
              <button
                key={chat.id}
                onClick={() => setActiveConversation(chat.id)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-l-4 border-transparent",
                  activeConversation?.id === chat.id
                    ? "bg-green-50/50 border-green-600"
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
                      {new Date(chat.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {isImage ? "📎 Image" : lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {activeConversation ? (
          (() => {
            const otherUser =
              activeConversation.userId === user?.id
                ? activeConversation.provider
                : activeConversation.user;
            return (
              <>
                {/* Header */}
                <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
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
                    <span className="font-bold text-gray-900">
                      {otherUser?.firstName} {otherUser?.lastName}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto flex flex-col-reverse p-6">
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
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200 relative">
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-16 left-4 z-50"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.AUTO}
                        height={350}
                        width={320}
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
                    >
                      <Smile className="w-6 h-6" />
                    </Button>

                    <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4 py-2 gap-2 border border-transparent focus-within:border-gray-200 transition-colors">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type here..."
                        className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400"
                      />
                      <div className="flex items-center gap-2 text-gray-400">
                        {/* Send */}
                        <button
                          onClick={handleSend}
                          className="hover:text-gray-600"
                        >
                          <Send className="w-5 h-5 -rotate-45" />
                        </button>
                        {/* File upload */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="hover:text-gray-600 disabled:opacity-50"
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
              Client messages will appear here. Chat to discuss requirements,
              updates, and orders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
