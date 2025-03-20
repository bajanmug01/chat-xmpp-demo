"use client"

import { useState } from "react"
import { Search, Plus, LogOut } from "lucide-react"
import { Contact, User } from "../lib/types"
import { Button } from "LA/components/ui/button"
import { Switch } from "LA/components/ui/switch"
import { Label } from "LA/components/ui/label"
import { Input } from "LA/components/ui/input"
import { AddContactDialog } from "./add-contact-dialog"

// Demo contacts data
const demoContacts: Contact[] = [
  { id: "1", name: "John Doe", lastSeen: new Date(), isOnline: true, avatar: "/placeholder.svg?height=40&width=40" },
  {
    id: "2",
    name: "Jane Smith",
    lastSeen: new Date(Date.now() - 1000 * 60 * 5),
    isOnline: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  { id: "3", name: "Bob Johnson", lastSeen: new Date(), isOnline: true, avatar: "/placeholder.svg?height=40&width=40" },
  {
    id: "4",
    name: "Alice Brown",
    lastSeen: new Date(Date.now() - 1000 * 60 * 30),
    isOnline: false,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

interface ContactListProps {
  user: User
  onLogout: () => void
  onSelectContact: (contact: Contact) => void
  selectedContact: Contact | null
  onToggleOnlineStatus: () => void
  compact?: boolean
}

export function ContactList({
  user,
  onLogout,
  onSelectContact,
  selectedContact,
  onToggleOnlineStatus,
  compact = false,
}: ContactListProps) {
  const [contacts, setContacts] = useState<Contact[]>(demoContacts)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))

  // Add a new contact
  const handleAddContact = (newContact: Contact) => {
    setContacts([...contacts, newContact])
    setIsAddContactOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Status toggle */}
      {!compact && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="font-medium">{user.username}</div>
              <div className={`h-2 w-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`}></div>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="online-status" checked={user.isOnline} onCheckedChange={onToggleOnlineStatus} />
            <Label htmlFor="online-status">{user.isOnline ? "Online" : "Offline"}</Label>
          </div>
        </div>
      )}

      {/* Compact version only shows the status toggle */}
      {compact && (
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Switch
              id="online-status-compact"
              checked={user.isOnline}
              onCheckedChange={onToggleOnlineStatus}
              className="scale-75"
            />
            <Label htmlFor="online-status-compact" className="text-sm">
              {user.isOnline ? "Online" : "Offline"}
            </Label>
          </div>
        </div>
      )}

      {/* Search and add contact */}
      <div className={`${compact ? "p-2" : "p-4"} border-b border-gray-200`}>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className={`absolute left-2 ${compact ? "top-1.5 h-3 w-3" : "top-2.5 h-4 w-4"} text-gray-400`} />
            <Input
              placeholder="Search contacts"
              className={`${compact ? "pl-7 py-1 h-7 text-sm" : "pl-8"}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            size={compact ? "sm" : "icon"}
            className={compact ? "h-7 w-7 p-0" : ""}
            onClick={() => setIsAddContactOpen(true)}
          >
            <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length > 0 ? (
          <ul>
            {filteredContacts.map((contact) => (
              <li
                key={contact.id}
                className={`${compact ? "p-2" : "p-4"} flex items-center space-x-3 cursor-pointer hover:bg-gray-100 ${
                  selectedContact?.id === contact.id ? "bg-gray-100" : ""
                }`}
                onClick={() => onSelectContact(contact)}
              >
                <div className="relative">
                  <img
                    src={contact.avatar || "/placeholder.svg"}
                    alt={contact.name}
                    className={`${compact ? "h-8 w-8" : "h-10 w-10"} rounded-full`}
                  />
                  <div
                    className={`absolute bottom-0 right-0 ${compact ? "h-2 w-2" : "h-3 w-3"} rounded-full border-2 border-white ${
                      contact.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${compact ? "text-sm" : ""}`}>{contact.name}</div>
                  <div className={`${compact ? "text-xs" : "text-sm"} text-gray-500`}>
                    {contact.isOnline
                      ? "Online"
                      : `Last seen ${new Date(contact.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${compact ? "p-2" : "p-4"} text-center text-gray-500 ${compact ? "text-sm" : ""}`}>
            No contacts found
          </div>
        )}
      </div>

      {/* Add contact dialog */}
      <AddContactDialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen} onAddContact={handleAddContact} />
    </div>
  )
}

