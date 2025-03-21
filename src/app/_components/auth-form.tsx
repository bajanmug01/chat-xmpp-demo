"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { type User } from "../lib/types";
import { Label } from "LA/components/ui/label";
import { Input } from "LA/components/ui/input";
import { Button } from "LA/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "LA/components/ui/card";
import { xmppClient } from "../lib/xmppClient";
import { api } from "LA/trpc/react";

interface AuthFormProps {
  onLogin: (user: User) => void;
  compact?: boolean;
}

export function AuthForm({ onLogin, compact = false }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Register mutation at component level
  const registerUser = api.xmpp.registerUser.useMutation();

  // Add event listener for XMPP client errors
  useEffect(() => {
    const handleXmppError = (err: Error) => {
      console.log("XMPP error received in auth form:", err);
      setError(err.message || "XMPP connection error");
    };

    xmppClient.on("error", handleXmppError);

    return () => {
      xmppClient.off("error", handleXmppError);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    console.log("handle submit");

    try {
      // Process the username - we just need the local part for both registration and connection
      const cleanUsername = username.includes('@') 
        ? username.split('@')[0] 
        : username;
        
      // Make sure we have a valid username after processing
      if (!cleanUsername) {
        setError("Invalid username format");
        return;
      }

      try {
        // Register the user on the server
        await registerUser.mutateAsync({ jid: cleanUsername, password });
        console.log("User registered successfully");
      } catch (registerError) {
        console.error("Registration error:", registerError);
        // If there was an error registering, don't proceed with connection
        if (registerError instanceof Error) {
          setError(`Registration error: ${registerError.message}`);
        } else if (typeof registerError === 'object' && registerError !== null) {
          setError(`Failed to register user: ${JSON.stringify(registerError)}`);
        } else {
          setError("Failed to register user: Unknown error");
        }
        return;
      }

      // Connect with the same clean username
      console.log(`Connecting with XMPP username: ${cleanUsername}`);
      
      // Try to connect with a timeout to ensure we don't wait forever
      const connected = await xmppClient.connect(cleanUsername, password);
      if (!connected) {
        setError("Failed to connect. Check your credentials or try again later.");
        return;
      }

      console.log("Connected as user");

      // Create user object for the application
      const user: User = {
        id: Date.now().toString(),
        username: cleanUsername,
        isOnline: true,
      };
      onLogin(user);
    } catch(err) {
      console.error("Authentication error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`space-y-${compact ? "2" : "4"}`}>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </div>
    </form>
  );

  if (compact) {
    return content;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Chat App</CardTitle>
        <CardDescription>Sign in to access your chats</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
