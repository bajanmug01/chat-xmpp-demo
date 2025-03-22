"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { type Contact, type Message, type User, type UserSession } from "./lib/types";
import { Button } from "LA/components/ui/button";
import { UserSessionCard } from "./_components/user-session-card";

export default function Home() {
  // Store multiple user sessions
  const [userSessions, setUserSessions] = useState<UserSession[]>([
    // Start with one empty session
    { id: "new-session-1", user: null, selectedContact: null, messages: {} },
  ]);

  // Add a new user session
  const handleAddSession = () => {
    const newSession: UserSession = {
      id: `new-session-${Date.now()}`,
      user: null,
      selectedContact: null,
      messages: {},
    };

    setUserSessions((prev) => [...prev, newSession]);
  };

  // Remove a session
  const handleRemoveSession = (sessionId: string) => {
    setUserSessions((prev) =>
      prev.filter((session) => session.id !== sessionId),
    );
  };

  // Update a user session
  const updateUserSession = (
    sessionId: string,
    updates: Partial<UserSession>,
  ) => {
    setUserSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session,
      ),
    );
  };

  // Handle user login
  const handleLogin = (sessionId: string, user: User) => {
    updateUserSession(sessionId, { user });
  };

  // Handle user logout
  const handleLogout = (sessionId: string) => {
    updateUserSession(sessionId, { user: null, selectedContact: null });
  };

  // Handle selecting a contact
  const handleSelectContact = (sessionId: string, contact: Contact | null) => {
    updateUserSession(sessionId, { selectedContact: contact });
  };

  // Handle sending a message
  const handleSendMessage = (sessionId: string, content: string) => {
    const session = userSessions.find((s) => s.id === sessionId);
    if (!session?.user || !session.selectedContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: session.user.id,
      text: content,
      isRead: false, // TODO 
      timestamp: new Date(),
    };

    const contactId = session.selectedContact.id;
    const updatedMessages = {
      ...session.messages,
      [contactId]: [...(session.messages[contactId] ?? []), newMessage],
    };

    updateUserSession(sessionId, { messages: updatedMessages });
  };

  // Toggle online status for a user
  const toggleOnlineStatus = (sessionId: string) => {
    const session = userSessions.find((s) => s.id === sessionId);
    if (!session?.user) return;

    const updatedUser = {
      ...session.user,
      isOnline: !session.user.isOnline,
    };

    updateUserSession(sessionId, { user: updatedUser });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Multi-User Chat App</h1>
          <Button
            onClick={handleAddSession}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Chat Session
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userSessions.map((session) => (
            <UserSessionCard
              key={session.id}
              session={session}
              onLogin={(user) => handleLogin(session.id, user)}
              onLogout={() => handleLogout(session.id)}
              onSelectContact={(contact) =>
                handleSelectContact(session.id, contact)
              }
              onSendMessage={(content) =>
                handleSendMessage(session.id, content)
              }
              onToggleOnlineStatus={() => toggleOnlineStatus(session.id)}
              onRemoveSession={() => handleRemoveSession(session.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
