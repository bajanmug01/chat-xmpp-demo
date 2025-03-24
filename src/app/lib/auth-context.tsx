"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "LA/trpc/react";
import { useXmpp } from "../hooks/useXmpp";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { client } = useXmpp();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const registerMutation = api.xmpp.registerUser.useMutation();

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Connect to XMPP server with credentials
      const success = await client.connect(email, password);

      if (success) {
        const newUser = {
          id: email,
          name: email.split("@")[0] ?? email,
          email,
          avatar: `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(email.charAt(0).toUpperCase())}`,
        };
        setUser(newUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      await registerMutation.mutateAsync({
        username: email,
        password,
      });

      // If registration successful, login automatically
      return await login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<boolean> => {
    await client.disconnect();
    setUser(null);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
