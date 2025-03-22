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
import { Loader2 } from "lucide-react";

interface AuthFormProps {
  onLogin: (user: User) => void;
  compact?: boolean;
}

export function AuthForm({ onLogin, compact = false }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Register user on xmpp server
  const registerUser = api.xmpp.registerUser.useMutation();

  // Add event listener for XMPP client errors
  useEffect(() => {
    const handleXmppError = (err: Error) => {
      console.log("XMPP error received in auth form:", err);
      setError(err.message || "XMPP connection error");
      setIsLoading(false);
    };

    xmppClient.on("error", handleXmppError);

    return () => {
      xmppClient.off("error", handleXmppError);
    };
  }, []);

  const handleAuth = async (isSignUp: boolean) => {
    // Clear previous errors
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    try {
      // Process the username - for this demo we just need the local part for both registration and connection
      const cleanUsername = username.includes('@') 
        ? username.split('@')[0] 
        : username;
        
      // Make sure we have a valid username after processing
      if (!cleanUsername) {
        setError("Invalid username format");
        setIsLoading(false);
        return;
      }

      // If signing up, register the user first
      if (isSignUp) {
        console.log("Registering user:", cleanUsername);
        
        try {
          await registerUser.mutateAsync({ username: cleanUsername, password });
          console.log("User registered successfully");
        } catch (registerError) {
          console.error("Registration error:", registerError);
          
          // Format error message for display
          if (registerError instanceof Error) {
            // Check for already exists error to provide a more helpful message
            if (registerError.message.includes("already exists")) {
              setError(`User ${cleanUsername} already exists. Please sign in instead.`);
            } else {
              setError(`Registration error: ${registerError.message}`);
            }
          } else if (typeof registerError === 'object' && registerError !== null) {
            setError(`Failed to register user: ${JSON.stringify(registerError)}`);
          } else {
            setError("Failed to register user: Unknown error");
          }
          
          setIsLoading(false);
          return;
        }
      }

      // Connect with the same clean username (for both sign-in and sign-up)
      console.log(`Connecting with XMPP username: ${cleanUsername}`);
      
      // Try to connect with a timeout to ensure we don't wait forever
      const connected = await xmppClient.connect(cleanUsername, password);
      if (!connected) {
        setError("Failed to connect. Check your credentials or try again later.");
        setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is handled by the specific button click
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`space-y-${compact ? "2" : "4"}`}>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button 
            type="button" 
            className="flex-1" 
            disabled={isLoading}
            onClick={() => handleAuth(false)}
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
          <Button 
            type="button" 
            className="flex-1" 
            disabled={isLoading}
            onClick={() => handleAuth(true)}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing up...
              </>
            ) : "Sign Up"}
          </Button>
        </div>
      </div>
    </form>
  );

  if (compact) {
    return formContent;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Chat App</CardTitle>
        <CardDescription>Sign in or create an account</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
