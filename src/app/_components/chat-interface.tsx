"use client";

import type React from "react";
import Image from "next/image";

import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, X } from "lucide-react";
import { type Contact, type Message, type User } from "../lib/types";
import { Button } from "LA/components/ui/button";
import { Input } from "LA/components/ui/input";

interface ChatInterfaceProps {
  contact: Contact;
  user: User;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  compact?: boolean;
}

export function ChatInterface({
  contact,
  user,
  messages,
  onSendMessage,
  onBack,
  onClose,
  isMobile = false,
  compact = false,
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Chat header */}
      {!compact && (
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={onBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src={contact.avatar || "/placeholder.svg"}
                  alt={contact.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    contact.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
              </div>
              <div>
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-gray-500">
                  {contact.isOnline
                    ? "Online"
                    : `Last seen ${new Date(contact.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* Compact header */}
      {compact && (
        <div className="flex items-center justify-between border-b border-gray-200 p-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Image
                src={contact.avatar || "/placeholder.svg"}
                alt={contact.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <div
                className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white ${
                  contact.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
            </div>
            <div className="text-sm font-medium">{contact.name}</div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Messages area */}
      <div
        className={`flex-1 ${compact ? "p-2" : "p-4"} overflow-y-auto bg-gray-50`}
      >
        {messages.length > 0 ? (
          <div className={`space-y-${compact ? "2" : "4"}`}>
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] ${compact ? "p-2 text-sm" : "p-3"} rounded-lg ${
                      isOwnMessage
                        ? "rounded-br-none bg-blue-500 text-white"
                        : "rounded-bl-none bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div>{message.content}</div>
                    <div
                      className={`${compact ? "text-[10px]" : "text-xs"} mt-1 ${
                        isOwnMessage ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <span className={compact ? "text-sm" : ""}>No messages yet</span>
          </div>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSubmit}
        className={`${compact ? "p-2" : "p-4"} border-t border-gray-200`}
      >
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 ${compact ? "h-8 py-1 text-sm" : ""}`}
          />
          <Button
            type="submit"
            size={compact ? "sm" : "icon"}
            className={compact ? "h-8 w-8 p-0" : ""}
          >
            <Send className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </Button>
        </div>
      </form>
    </div>
  );
}
