"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "LA/components/ui/dialog"
import { Contact } from "../lib/types"
import { Label } from "LA/components/ui/label"
import { Button } from "LA/components/ui/button"
import { Input } from "LA/components/ui/input"

interface AddContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddContact: (contact: Contact) => void
}

export function AddContactDialog({ open, onOpenChange, onAddContact }: AddContactDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Please enter a contact name")
      return
    }

    // Create a new contact
    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      lastSeen: new Date(),
      isOnline: false,
      avatar: "/placeholder.svg?height=40&width=40",
    }

    onAddContact(newContact)
    setName("")
    setError("")
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
              <Label htmlFor="contact-name">Contact Name</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter contact name"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

