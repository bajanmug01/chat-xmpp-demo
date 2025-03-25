import { useState, useEffect, useCallback } from "react";
import {
  xmppClient,
  type XMPPContact,
  type XMPPMessage,
} from "../lib/xmppClient";

export function useXmpp() {
  const [isConnected, setIsConnected] = useState(xmppClient.isConnected());
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<XMPPContact[]>([]);
  const [messageUpdate, setMessageUpdate] = useState(0);

  useEffect(() => {
    // Only initialize state if connected
    if (xmppClient.isConnected()) {
      setContacts(xmppClient.getContacts());
    } else {
      setContacts([]);
    }

    const handleConnect = () => {
      setIsConnected(true);
      setContacts(xmppClient.getContacts());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setContacts([]);
    };

    const handleError = (err: Error) => setError(err.message);
    const handleContactsUpdate = (newContacts: XMPPContact[]) =>
      setContacts(newContacts);
    
    const handleMessage = () => {
      setMessageUpdate(prev => prev + 1);
    };

    // Subscribe to XMPP client events
    xmppClient.on("connected", handleConnect);
    xmppClient.on("disconnected", handleDisconnect);
    xmppClient.on("error", handleError);
    xmppClient.on("contactsUpdated", handleContactsUpdate);
    xmppClient.on("message", handleMessage);
    xmppClient.on("archivedMessage", handleMessage);

    return () => {
      xmppClient.off("connected", handleConnect);
      xmppClient.off("disconnected", handleDisconnect);
      xmppClient.off("error", handleError);
      xmppClient.off("contactsUpdated", handleContactsUpdate);
      xmppClient.off("message", handleMessage);
      xmppClient.off("archivedMessage", handleMessage);
    };
  }, []);

  // Wrap XMPP client methods in useCallback to maintain reference stability
  const addContact = useCallback(async (jid: string) => {
    try {
      const result = await xmppClient.addToRoster(jid);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add contact";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const sendMessage = useCallback(async (to: string, body: string) => {
    try {
      const message = await xmppClient.sendMessage(to, body);
      return message;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markAsRead = useCallback((contactId: string) => {
    xmppClient.markAsRead(contactId);
  }, []);

  const updatePresence = useCallback(
    (status: "online" | "offline" | "away") => {
      xmppClient.updatePresence(status);
    },
    [],
  );

  const getMessages = useCallback((contactId: string) => {
    return xmppClient.getMessages(contactId);
  }, []);

  return {
    client: xmppClient,
    isConnected,
    error,
    contacts,
    getMessages,
    addContact,
    sendMessage,
    markAsRead,
    updatePresence,
  };
}
