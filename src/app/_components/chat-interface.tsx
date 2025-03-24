"use client";

import { useState } from "react";
import { useMediaQuery } from "../hooks/use-media-query";
import { useAuth } from "../lib/auth-context";
import ConversationList from "./conversation-list";
import ChatWindow from "./chat-window";
import { type XMPPContact, type XMPPMessage } from "../lib/xmppClient";

export default function ChatInterface() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeConversation, setActiveConversation] =
    useState<XMPPContact | null>(null);
  const [showConversations, setShowConversations] = useState(true);
  const { user, logout } = useAuth();

  // getContacts()  XMPPContact
  const [conversations, setConversations] = useState<XMPPContact[]>([
    {
      id: "1",
      jid: "John",
      name: "John Doe",
      avatar: "/placeholder.svg?height=40&width=40",
      //lastMessage: "Hey, how are you?",
      lastMessageTime: "10:30 AM",
      unreadCount: 2,
      status: "online",
    },
  ]);

  // getMessages(contactId: string)
  const [messages, setMessages] = useState<Record<string, XMPPMessage[]>>({
    "1": [
      {
        id: "1",
        body: "Hey, how are you?",
        from: "them",
        timestamp: new Date().toLocaleString(),
        to: "John",
      },
    ],
  });

  const handleSelectConversation = (conversation: XMPPContact) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversations(false);
    }
  };

  const handleBackToList = () => {
    setShowConversations(true);
  };

  // TODO: TO is missing
  // TODO: Current User that is logged in
  const handleSendMessage = (text: string) => {
    if (!activeConversation) return;

    // await sendMessage(to: string, body: string)
    const newMessage: XMPPMessage = {
      id: Date.now().toString(),
      body: text,
      from: "me", // current user
      timestamp: new Date().toLocaleString(),
      to: "", // to user
      //status: "sent",
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

  const handleAddContact = (contactData: Omit<XMPPContact, "id">) => {
    // Generate a unique ID for the new contact
    const newId = (conversations.length + 1).toString();

    // TODO: public async addToRoster(jid: string, name?: string)

    // Create the new contact with the generated ID
    const newContact: XMPPContact = {
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
