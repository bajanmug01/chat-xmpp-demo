"use client";

import { useState } from "react";
import { useMediaQuery } from "../hooks/use-media-query";
import { useAuth } from "../lib/auth-context";
import { useXmpp } from "../hooks/useXmpp";
import ConversationList from "./conversation-list";
import ChatWindow from "./chat-window";
import { type XMPPContact } from "../lib/xmppClient";

export default function ChatInterface() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeConversation, setActiveConversation] =
    useState<XMPPContact | null>(null);
  const [showConversations, setShowConversations] = useState(true);
  const { user, logout } = useAuth();
  const { sendMessage, getContacts, getMessages } = useXmpp();

  console.log("activeConversations", activeConversation);

  const handleSelectConversation = (conversation: XMPPContact) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversations(false);
    }
  };

  const handleBackToList = () => {
    setShowConversations(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;

    try {
      await sendMessage(activeConversation.jid, text);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleCloseChat = () => {
    setActiveConversation(null);
    if (isMobile) {
      setShowConversations(true);
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
            conversations={getContacts()}
            activeConversationId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            onLogout={logout}
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
              messages={getMessages(activeConversation.id) ?? []}
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
