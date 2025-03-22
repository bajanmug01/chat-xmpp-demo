"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "LA/components/ui/dialog"
import { type Contact } from "../lib/types"
import { Label } from "LA/components/ui/label"
import { Button } from "LA/components/ui/button"
import { Input } from "LA/components/ui/input"
import { env } from "LA/env"

interface AddContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddContact: (contact: Contact) => void
}

export function AddContactDialog({ open, onOpenChange, onAddContact }: AddContactDialogProps) {
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Please enter a contact username")
      return
    }

    // Clean up the username - if it includes @domain, use as is, otherwise add domain
    const domain = env.NEXT_PUBLIC_XMPP_DOMAIN
    const jid = username.includes('@') ? username : `${username}@${domain}`

    // Create a new contact
    const newContact: Contact = {
      id: jid, // Use the full JID as the ID
      name: displayName.trim() || username.trim(), // Use display name if provided, otherwise username
      lastSeen: new Date(),
      isOnline: false,
      avatar: "/placeholder.svg?height=40&width=40",
    }

    onAddContact(newContact)
    setUsername("")
    setDisplayName("")
    setError("")
  }

  const handleCancel = () => {
    // Clear form and close
    setUsername("")
    setDisplayName("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-username">Username or JID</Label>
              <Input
                id="contact-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or full JID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-display-name">Display Name (optional)</Label>
              <Input
                id="contact-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name for this contact"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

