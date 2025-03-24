"use client";

import { useState } from "react";
import { useMediaQuery } from "../hooks/use-media-query";
import { Conversation, Message } from "../lib/types";
import { useAuth } from "../lib/auth-context";
import ConversationList from "./conversation-list";
import ChatWindow from "./chat-window";

export default function ChatInterface() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [showConversations, setShowConversations] = useState(true);
  const { user, logout } = useAuth();

  // Sample data
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      name: "John Doe",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Hey, how are you?",
      timestamp: "10:30 AM",
      unread: 2,
      online: true,
    },
    {
      id: "2",
      name: "Jane Smith",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Can we meet tomorrow?",
      timestamp: "Yesterday",
      unread: 0,
      online: false,
    },
    {
      id: "3",
      name: "Tech Group",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Alice: Check out this new framework!",
      timestamp: "Yesterday",
      unread: 5,
      online: false,
      isGroup: true,
    },
    {
      id: "4",
      name: "Mom",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Call me when you're free",
      timestamp: "Monday",
      unread: 0,
      online: true,
    },
    {
      id: "5",
      name: "Work Team",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: "Boss: Don't forget the meeting at 3",
      timestamp: "Monday",
      unread: 0,
      online: false,
      isGroup: true,
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "1",
        text: "Hey, how are you?",
        sender: "them",
        timestamp: "10:30 AM",
        status: "read",
      },
      {
        id: "2",
        text: "I'm good, thanks! How about you?",
        sender: "me",
        timestamp: "10:31 AM",
        status: "read",
      },
      {
        id: "3",
        text: "Doing well. Any plans for the weekend?",
        sender: "them",
        timestamp: "10:32 AM",
        status: "read",
      },
    ],
    "2": [
      {
        id: "1",
        text: "Hi Jane, do you have time to meet?",
        sender: "me",
        timestamp: "Yesterday",
        status: "read",
      },
      {
        id: "2",
        text: "Sure, what's it about?",
        sender: "them",
        timestamp: "Yesterday",
        status: "read",
      },
      {
        id: "3",
        text: "Can we meet tomorrow?",
        sender: "them",
        timestamp: "Yesterday",
        status: "delivered",
      },
    ],
    "3": [
      {
        id: "1",
        text: "Welcome to the Tech Group!",
        sender: "them",
        timestamp: "Yesterday",
        status: "read",
        senderName: "Admin",
      },
      {
        id: "2",
        text: "Thanks for adding me!",
        sender: "me",
        timestamp: "Yesterday",
        status: "read",
      },
      {
        id: "3",
        text: "Has anyone tried the new React 18?",
        sender: "them",
        timestamp: "Yesterday",
        status: "read",
        senderName: "Bob",
      },
      {
        id: "4",
        text: "Yes, the concurrent features are amazing!",
        sender: "them",
        timestamp: "Yesterday",
        status: "read",
        senderName: "Alice",
      },
      {
        id: "5",
        text: "Check out this new framework!",
        sender: "them",
        timestamp: "Yesterday",
        status: "delivered",
        senderName: "Alice",
      },
    ],
    "4": [
      {
        id: "1",
        text: "Hi sweetie, how are you doing?",
        sender: "them",
        timestamp: "Monday",
        status: "read",
      },
      {
        id: "2",
        text: "I'm good Mom, just busy with work",
        sender: "me",
        timestamp: "Monday",
        status: "read",
      },
      {
        id: "3",
        text: "Call me when you're free",
        sender: "them",
        timestamp: "Monday",
        status: "read",
      },
    ],
    "5": [
      {
        id: "1",
        text: "Team meeting at 3pm today",
        sender: "them",
        timestamp: "Monday",
        status: "read",
        senderName: "Boss",
      },
      {
        id: "2",
        text: "I'll be there",
        sender: "me",
        timestamp: "Monday",
        status: "read",
      },
      {
        id: "3",
        text: "Don't forget the meeting at 3",
        sender: "them",
        timestamp: "Monday",
        status: "read",
        senderName: "Boss",
      },
    ],
  });

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversations(false);
    }
  };

  const handleBackToList = () => {
    setShowConversations(true);
  };

  const handleSendMessage = (text: string) => {
    if (!activeConversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "me",
      timestamp: "Just now",
      status: "sent",
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [
        ...(prev[activeConversation.id] ?? []),
        newMessage,
      ],
    }));

    // Update last message in conversation list
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation.id
          ? { ...conv, lastMessage: text, timestamp: "Just now", unread: 0 }
          : conv,
      ),
    );
  };

  const handleCloseChat = () => {
    setActiveConversation(null);
    if (isMobile) {
      setShowConversations(true);
    }
  };

  const handleAddContact = (contactData: Omit<Conversation, "id">) => {
    // Generate a unique ID for the new contact
    const newId = (conversations.length + 1).toString();

    // Create the new contact with the generated ID
    const newContact: Conversation = {
      id: newId,
      ...contactData,
    };

    // Add the new contact to the conversations list
    setConversations((prev) => [...prev, newContact]);

    // Initialize empty messages array for the new contact
    setMessages((prev) => ({
      ...prev,
      [newId]: [],
    }));

    // Open the chat with the new contact
    setActiveConversation(newContact);
    if (isMobile) {
      setShowConversations(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Conversations sidebar */}
      {(showConversations || !isMobile) && (
        <div
          className={`${isMobile ? "w-full" : "w-1/3 border-r"} dark:border-gray-800`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            onLogout={logout}
            onAddContact={handleAddContact}
            currentUser={user}
          />
        </div>
      )}

      {/* Chat window */}
      {(!showConversations || !isMobile) && (
        <div className={`${isMobile ? "w-full" : "w-2/3"} flex flex-col`}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={messages[activeConversation.id] ?? []}
              onSendMessage={handleSendMessage}
              onBack={isMobile ? handleBackToList : undefined}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      )}
    </div>
  );
}
