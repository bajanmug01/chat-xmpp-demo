"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { type Contact, type User, type UserSession } from "../lib/types"
import { Card, CardContent, CardHeader } from "LA/components/ui/card"
import { Button } from "LA/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "LA/components/ui/tabs"
import { ContactList } from "./contact-list"
import { ChatInterface } from "./chat-interface"
import { AuthForm } from "./auth-form"


interface UserSessionCardProps {
  session: UserSession
  onLogin: (user: User) => void
  onLogout: () => void
  onSelectContact: (contact: Contact | null) => void
  onSendMessage: (content: string) => void
  onToggleOnlineStatus: () => void
  onRemoveSession: () => void
}

export function UserSessionCard({
  session,
  onLogin,
  onLogout,
  onSelectContact,
  onSendMessage,
  onToggleOnlineStatus,
  onRemoveSession,
}: UserSessionCardProps) {
  const [activeTab, setActiveTab] = useState<string>("contacts")

  // If user is logged in, show the chat interface
  if (session.user) {
    return (
      <Card className="h-[600px] flex flex-col overflow-hidden">
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="font-medium">{session.user.username}</div>
            <div className={`h-2 w-2 rounded-full ${session.user.isOnline ? "bg-green-500" : "bg-gray-400"}`}></div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLogout}>
              <span className="sr-only">Logout</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemoveSession}>
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="contacts" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid grid-cols-2 mx-3 mb-2">
              <TabsTrigger value="contacts" onClick={() => setActiveTab("contacts")}>
                Contacts
              </TabsTrigger>
              <TabsTrigger value="chat" onClick={() => setActiveTab("chat")} disabled={!session.selectedContact}>
                {session.selectedContact ? `Chat: ${session.selectedContact.name}` : "Chat"}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contacts" className="flex-1 overflow-hidden m-0 border-0">
              <div className="h-full">
                <ContactList
                  user={session.user}
                  onLogout={onLogout}
                  onSelectContact={(contact) => {
                    onSelectContact(contact)
                    setActiveTab("chat")
                  }}
                  selectedContact={session.selectedContact}
                  onToggleOnlineStatus={onToggleOnlineStatus}
                  compact={true}
                />
              </div>
            </TabsContent>
            <TabsContent value="chat" className="flex-1 overflow-hidden m-0 border-0">
              {session.selectedContact ? (
                <ChatInterface
                  contact={session.selectedContact}
                  user={session.user}
                  messages={session.messages[session.selectedContact.id] ?? []}
                  onSendMessage={onSendMessage}
                  compact={true}
                  onClose={() => {
                    onSelectContact(null)
                    setActiveTab("contacts")
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a contact to start chatting
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  // If user is not logged in, show the auth form
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
        <div className="font-medium">New Chat Session</div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemoveSession}>
          <span className="sr-only">Close</span>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <AuthForm onLogin={onLogin} compact={true} />
      </CardContent>
    </Card>
  )
}

