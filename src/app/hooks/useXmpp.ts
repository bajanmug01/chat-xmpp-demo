import { useState, useEffect, useCallback } from "react";
import {
  xmppClient,
  type XMPPContact,
  type XMPPMessage,
} from "../lib/xmppClient";

export function useXmpp() {
  const [isConnected, setIsConnected] = useState(xmppClient.isConnected());
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<XMPPContact[]>(
    xmppClient.getContacts(),
  );
  const [messages, setMessages] = useState<Record<string, XMPPMessage[]>>({});

  useEffect(() => {
    // Initialize state with current client state
    setIsConnected(xmppClient.isConnected());
    setContacts(xmppClient.getContacts());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: Error) => setError(err.message);
    const handleContactsUpdate = (newContacts: XMPPContact[]) =>
      setContacts(newContacts);
    const handleMessage = (message: XMPPMessage) => {
      setMessages((prev) => {
        const contactMessages = prev[message.from] ?? [];
        return {
          ...prev,
          [message.from]: [...contactMessages, message],
        };
      });
    };

    // Subscribe to XMPP client events
    xmppClient.on("connected", handleConnect);
    xmppClient.on("disconnected", handleDisconnect);
    xmppClient.on("error", handleError);
    xmppClient.on("contactsUpdated", handleContactsUpdate);
    xmppClient.on("message", handleMessage);

    // Cleanup subscriptions
    return () => {
      xmppClient.off("connected", handleConnect);
      xmppClient.off("disconnected", handleDisconnect);
      xmppClient.off("error", handleError);
      xmppClient.off("contactsUpdated", handleContactsUpdate);
      xmppClient.off("message", handleMessage);
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
      setMessages((prev) => {
        const contactMessages = prev[to] ?? [];
        return {
          ...prev,
          [to]: [...contactMessages, message],
        };
      });
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

  return {
    client: xmppClient,
    isConnected,
    error,
    contacts,
    messages,
    // Exposed functions
    addContact,
    sendMessage,
    markAsRead,
    updatePresence,
    // Expose original client methods if needed
    getContacts: () => xmppClient.getContacts(),
    getMessages: (contactId: string) => xmppClient.getMessages(contactId),
  };
}
