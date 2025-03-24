"use client";

import { AuthScreen } from "./_components/auth/auth-screen";
import ChatInterface from "./_components/chat-interface";
import { useAuth } from "./lib/auth-context";

export default function Home() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <ChatInterface />
    </main>
  );
}
