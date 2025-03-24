"use client";

import type React from "react";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "LA/components/ui/dialog";
import { Alert, AlertDescription } from "LA/components/ui/alert";
import { Label } from "LA/components/ui/label";
import { Input } from "LA/components/ui/input";
import { Button } from "LA/components/ui/button";
import { type XMPPContact } from "../lib/xmppClient";

interface AddContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddContact: (contact: Omit<XMPPContact, "id">) => void;
}

export function AddContactDialog({
  open,
  onOpenChange,
  onAddContact,
}: AddContactDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Contact name is required");
      return;
    }

    setIsSubmitting(true);

    //TODO:  public async addToRoster(jid: string, name?: string): 

    // Create a new contact
    const newContact: Omit<XMPPContact, "id"> = {
      jid: name,
      name: name.trim(),
      avatar: `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(name.charAt(0))}`,
      lastMessageTime: "Just now",
      unreadCount: 0,
      status: "online",
    };

    // Add the contact
    onAddContact(newContact);

    // Reset form and close dialog
    setName("");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter contact name"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
