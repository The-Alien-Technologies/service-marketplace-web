"use client";

import { X, Plus, Smile, Send, Camera, Mic } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChatFormData } from "./chatInput";
import ChatMessages, { Message } from "./chatMessage";
import axios from 'axios';
import { apiService } from "@/lib/api";
import TypingIndicator from "./typingIndicator";

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  botName: string;
  botAvatar: string;
  isOnline?: boolean;
  responseTime?: string;
}

const quickMessages = [
  "Tell me about Pavodah",
  "How can I make contact a provider?",
  "Tell me how to make a dispute?",
  "Where can I find pavodah office or number?",
  "How do I make a report?"
];

export function BotChatBox({
  isOpen,
  onClose,
  botName,
  botAvatar,
  isOnline = true,
  responseTime = "1mins",
}: ChatBoxProps) {
  const [message, setMessage] = useState("");


  const sendMessage = (message: string) => {
    if(!message.trim()) return;
    onSubmit({prompt: message})
    setMessage("")
  };

  //****************************************************** */

  const conversationId = useRef(crypto.randomUUID());

  const [messages, setMessages] = useState<Message[]>([]);

  const [isBotTyping, setIsBotTyping] = useState(false);

const onSubmit = async ({prompt}: ChatFormData) => {
  try {
    setMessages(prev => [...prev, { content: prompt, role: "user"}]);
    setIsBotTyping(true);

    const data = await apiService.chatBot(prompt, conversationId.current);

    setMessages(prev => [...prev, { content: data.message, role: "bot"}]);

  } catch (error) {
    console.log(error);
  } finally {
    setIsBotTyping(false);
  }
}

const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement> ) =>{
if ( event.key === 'Enter'){
      event.preventDefault();
      sendMessage(message)
    }
  }
  //****************************************************** */

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-full max-w-md h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {/* <Image
                src={botAvatar}
                alt={botName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              /> */}
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

          {/* Name and Response Time */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {botName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Avg. response time {responseTime}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

{/* ***************************************** */}

{/* Chat Area */}
<div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3">

  {/* Messages */}
  {messages.length > 0 && (
    <ChatMessages messages={messages} />
  )}

  {/* Typing Indicator */}
  {isBotTyping && <TypingIndicator />}

  {/* Quick messages (only before chat starts) */}
  {messages.length === 0 && (
    <div className="space-y-3">
      {quickMessages.map((msg, index) => (
        <button
          key={index}
          onClick={() => sendMessage(msg)}
          className="w-full text-left p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <p className="text-sm text-gray-900 dark:text-white">{msg}</p>
        </button>
      ))}
    </div>
  )}

</div>
{/* ****************************************** */}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Plus Button */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Emoji Button */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
         <button onClick={() => sendMessage(message)}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
        <Send className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

          {/* Camera Button */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Mic Button */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0">
            <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
