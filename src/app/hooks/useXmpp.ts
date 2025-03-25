import { useState, useEffect, useCallback } from "react";
import { xmppClient } from "../lib/xmppClient";

export function useXmpp() {
  const [isConnected, setIsConnected] = useState(xmppClient.isConnected());
  const [error, setError] = useState<string | null>(null);
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setUpdateTrigger((prev) => prev + 1);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setUpdateTrigger((prev) => prev + 1);
    };

    const handleError = (err: Error) => setError(err.message);

    const handleUpdate = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    xmppClient.on("connected", handleConnect);
    xmppClient.on("disconnected", handleDisconnect);
    xmppClient.on("error", handleError);
    xmppClient.on("contactsUpdated", handleUpdate);
    xmppClient.on("message", handleUpdate);
    xmppClient.on("archivedMessage", handleUpdate);

    return () => {
      xmppClient.off("connected", handleConnect);
      xmppClient.off("disconnected", handleDisconnect);
      xmppClient.off("error", handleError);
      xmppClient.off("contactsUpdated", handleUpdate);
      xmppClient.off("message", handleUpdate);
      xmppClient.off("archivedMessage", handleUpdate);
    };
  }, []);

  const connect = useCallback(async (email: string, password: string) => {
    try {
      return await xmppClient.connect(email, password);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      return await xmppClient.disconnect();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getContacts = useCallback(() => {
    return xmppClient.getContacts();
  }, []);

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
    connect,
    disconnect,
    isConnected,
    error,
    getContacts,
    getMessages,
    addContact,
    sendMessage,
    markAsRead,
    updatePresence,
  };
}

// TODO: handle contacts online and update contacts, add status to message
// TODO: show last message for contact
// TODO: fix date for new messages
// TODO: order messages by date
