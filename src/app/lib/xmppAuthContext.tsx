"use client";

import React, { createContext, useContext, useState } from "react";

interface XmppCredentials {
  username: string;
  password: string;
}

interface XmppAuthContextType {
  credentials: XmppCredentials | null;
  setCredentials: (credentials: XmppCredentials | null) => void;
  clearCredentials: () => void;
}

const XmppAuthContext = createContext<XmppAuthContextType | undefined>(undefined);

export function XmppAuthProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentialsState] = useState<XmppCredentials | null>(null);

  const setCredentials = (newCredentials: XmppCredentials | null) => {
    setCredentialsState(newCredentials);
  };

  const clearCredentials = () => {
    setCredentialsState(null);
  };

  return (
    <XmppAuthContext.Provider
      value={{
        credentials,
        setCredentials,
        clearCredentials,
      }}
    >
      {children}
    </XmppAuthContext.Provider>
  );
}

export function useXmppAuth() {
  const context = useContext(XmppAuthContext);
  if (context === undefined) {
    throw new Error("useXmppAuth must be used within an XmppAuthProvider");
  }
  return context;
} 