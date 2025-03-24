"use client";

import { useState } from "react";
import { Search, LogOut, Plus, X } from "lucide-react";
import { type User } from "../lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "LA/components/ui/avatar";
import { Button } from "LA/components/ui/button";
import { Input } from "LA/components/ui/input";
import { cn } from "LA/lib/utils";
import { AddContactDialog } from "./add-contact-dialog";
import { type XMPPContact } from "../lib/xmppClient";

interface ConversationListProps {
  conversations: XMPPContact[];
  activeConversationId?: string;
  onSelectConversation: (conversation: XMPPContact) => void;
  onLogout: () => void;
  onAddContact: (contact: Omit<XMPPContact, "id">) => void;
  currentUser: User;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onLogout,
  onAddContact,
  currentUser,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="bg-gray-50 p-3 dark:bg-gray-800">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Chat-Demo
            </h1>
            <div className="ml-2 flex items-center gap-2 border-l border-gray-300 pl-2 dark:border-gray-700">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={
                    currentUser.avatar ??
                    `/placeholder.svg?height=24&width=24&text=${encodeURIComponent(currentUser.name.charAt(0))}`
                  }
                  alt={currentUser.name}
                />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentUser.name}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </Button>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search contacts"
              className="bg-white pl-8 dark:bg-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2.5 top-2.5 text-gray-500 dark:text-gray-400"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setIsAddContactOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800",
                activeConversationId === conversation.id &&
                  "bg-gray-100 dark:bg-gray-800",
              )}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage
                    src={conversation.avatar}
                    alt={conversation.name}
                  />
                  <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {conversation.status && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <h3 className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {conversation.name}
                  </h3>
                  <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {conversation.lastMessageTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {"TODO: last Message"/* show last message*/} 
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? "No contacts found" : "No contacts yet"}
          </div>
        )}
      </div>

      <AddContactDialog
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
        onAddContact={onAddContact}
      />
    </div>
  );
}
