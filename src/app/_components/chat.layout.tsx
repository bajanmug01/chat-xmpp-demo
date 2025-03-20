"use client";

import { useState } from "react";
import { type Contact, type UserSession } from "../lib/types";
import { ContactList } from "./contact-list";
import { ChatInterface } from "./chat-interface";

interface ChatLayoutProps {
  session: UserSession;
  onSelectContact: (contact: Contact) => void;
  onSendMessage: (content: string) => void;
  onToggleOnlineStatus: () => void;
  onLogout: () => void;
}

export function ChatLayout({
  session,
  onSelectContact,
  onSendMessage,
  onToggleOnlineStatus,
  onLogout,
}: ChatLayoutProps) {
  const [isMobileView, setIsMobileView] = useState(false);

  return (
    <div className="flex h-full w-full">
      <div
        className={`${isMobileView ? "hidden" : "block"} w-full border-r border-gray-200 bg-white md:w-1/3`}
      >
        <ContactList
          user={session.user!}
          onLogout={onLogout}
          onSelectContact={(contact) => {
            onSelectContact(contact);
            setIsMobileView(true);
          }}
          selectedContact={session.selectedContact}
          onToggleOnlineStatus={onToggleOnlineStatus}
        />
      </div>
      <div
        className={`${isMobileView ? "block" : "hidden"} w-full md:block md:w-2/3`}
      >
        {session.selectedContact ? (
          <ChatInterface
            contact={session.selectedContact}
            user={session.user!}
            messages={session.messages[session.selectedContact.id] ?? []}
            onSendMessage={onSendMessage}
            onBack={() => setIsMobileView(false)}
            isMobile={true}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a contact to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
