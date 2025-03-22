"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, Plus, LogOut } from "lucide-react"
import { Button } from "LA/components/ui/button"
import { Switch } from "LA/components/ui/switch"
import { Label } from "LA/components/ui/label"
import { Input } from "LA/components/ui/input"
import { AddContactDialog } from "./add-contact-dialog"
import { Loader2 } from "lucide-react"
import { useToast } from "LA/components/ui/use-toast"
import { useXmppAuth } from "../lib/xmppAuthContext"
import { XMPPContact, xmppClient } from "../lib/xmppClient"

// Define types needed for the component
export interface User {
  id: string
  username: string
  isOnline: boolean
}

interface Contact {
  id: string
  name: string
  isOnline: boolean
  avatar?: string
  lastSeen: Date | string
}
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
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { credentials, clearCredentials } = useXmppAuth()
  const { toast } = useToast()

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch contacts on component mount and when user/credentials change
  useEffect(() => {
    void fetchContacts()
    
    // Listen for contacts updated events from xmppClient
    const handleContactsUpdated = (updatedContacts: XMPPContact[]) => {
      const mappedContacts = mapXmppContactsToContacts(updatedContacts)
      setContacts(mappedContacts)
    }
    
    xmppClient.on('contactsUpdated', handleContactsUpdated)
    
    // Clean up event listener
    return () => {
      xmppClient.off('contactsUpdated', handleContactsUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, credentials])

  // Helper function to map XMPP contacts to our Contact interface
  const mapXmppContactsToContacts = (xmppContacts: XMPPContact[]): Contact[] => {
    return xmppContacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      isOnline: contact.status === 'online',
      avatar: contact.avatar,
      lastSeen: contact.lastMessageTime
    }))
  }

  const fetchContacts = async () => {
    if (!user?.username || !credentials?.password) return
    
    try {
      setIsLoading(true)
      
      // Check if already connected
      if (!xmppClient.isConnected()) {
        // Connect to XMPP server
        const connected = await xmppClient.connect(user.username, credentials.password)
        if (!connected) {
          throw new Error("Failed to connect to XMPP server")
        }
      }
      
      // Get contacts from xmppClient
      const xmppContacts = xmppClient.getContacts()
      const mappedContacts = mapXmppContactsToContacts(xmppContacts)
      setContacts(mappedContacts)
    } catch (error) {
      toast({
        title: "Error fetching contacts",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new contact
  const handleAddContact = async (newContact: Contact) => {
    if (!credentials?.password) {
      toast({
        title: "Authentication required",
        description: "Please log in again to add contacts",
        variant: "destructive"
      })
      return
    }

    // Extract the username from the contact
    let contactJid = "";
    
    if (newContact.id.includes('@')) {
      contactJid = newContact.id
    } else {
      // Add domain if not present
      contactJid = `${newContact.id}@${new URL(process.env.NEXT_PUBLIC_XMPP_SERVICE ?? "").hostname}`
    }
    
    // Safety check - only proceed if we have a valid JID
    if (!contactJid) {
      toast({
        title: "Invalid contact",
        description: "The contact ID is invalid",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true)
      
      // Use xmppClient to add contact
      const success = await xmppClient.addToRoster(contactJid, newContact.name)
      
      if (success) {
        toast({
          title: "Contact added",
          description: `${newContact.name} has been added to your contacts`,
        })
        
        // Refresh contacts
        void fetchContacts()
      } else {
        throw new Error("Failed to add contact")
      }
      
      setIsAddContactOpen(false);
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error adding contact",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false)
    }
  }

  // Handle logout with credential clearing
  const handleLogout = async () => {
    try {
      // Disconnect from XMPP server
      if (xmppClient.isConnected()) {
        await xmppClient.disconnect()
      }
      
      clearCredentials()
      onLogout()
    } catch (error) {
      console.error("Error during logout:", error)
      
      // Still clear credentials and log out even if there's an error
      clearCredentials()
      onLogout()
    }
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
            <Button variant="ghost" size="icon" onClick={handleLogout}>
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
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className={compact ? "h-3 w-3 animate-spin" : "h-4 w-4 animate-spin"} />
            ) : (
              <Plus className={compact ? "h-3 w-3" : "h-4 w-4"} />
            )}
          </Button>
        </div>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}
        {!isLoading && filteredContacts.length > 0 ? (
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
                  <Image
                    src={contact.avatar ?? "/placeholder.svg"}
                    alt={contact.name}
                    width={compact ? 32 : 40}
                    height={compact ? 32 : 40}
                    className="rounded-full"
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
        ) : !isLoading ? (
          <div className={`${compact ? "p-2" : "p-4"} text-center text-gray-500 ${compact ? "text-sm" : ""}`}>
            {filteredContacts.length === 0 && contacts.length > 0
              ? "No matching contacts"
              : "No contacts found. Add some contacts to get started."}
          </div>
        ) : null}
      </div>

      {/* Add contact dialog */}
      <AddContactDialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen} onAddContact={handleAddContact} />
    </div>
  )
}

