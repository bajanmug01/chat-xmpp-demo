"use client";

import type React from "react";

import { useState } from "react";
import { User } from "../lib/types";
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

interface AuthFormProps {
  onLogin: (user: User) => void;
  compact?: boolean;
}

export function AuthForm({ onLogin, compact = false }: AuthFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    // In a real app, you would validate credentials against a database
    // For this demo, we'll just create a user object
    const user: User = {
      id: Date.now().toString(),
      username,
      isOnline: true,
    };

    onLogin(user);
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
