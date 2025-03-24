"use client";

import type React from "react";

import { useState } from "react";
import { ArrowLeft, Paperclip, Mic, Send, X } from "lucide-react";
import { type Conversation, type Message } from "../lib/types";
import { Button } from "LA/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "LA/components/ui/avatar";
import MessageBubble from "./message-bubble";
import { Input } from "LA/components/ui/input";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onBack?: () => void;
  onClose: () => void;
}

export default function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  onBack,
  onClose,
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState("");

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar>
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
          <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">
            {conversation.name}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {conversation.online ? "Online" : "Last seen recently"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-500"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e5e5e5' fillOpacity='0.1' fillRule='evenodd'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="w-full space-y-2">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isGroup={conversation.isGroup}
            />
          ))}
        </div>
      </div>

      {/* Message input */}
      <div className="flex items-center gap-2 border-t bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
        <Button variant="ghost" size="icon">
          <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Button>
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="flex-1 bg-white dark:bg-gray-700"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSend}
          disabled={!messageText.trim()}
        >
          {messageText.trim() ? (
            <Send className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <Mic className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </Button>
      </div>
    </div>
  );
}
