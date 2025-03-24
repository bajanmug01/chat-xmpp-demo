"use client";

import type React from "react";

import { useState } from "react";

import { useAuth } from "LA/app/lib/auth-context";
import { Label } from "LA/components/ui/label";
import { Input } from "LA/components/ui/input";
import { Button } from "LA/components/ui/button";
import toast from "react-hot-toast";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Please fill in all fields");
      }

      const success = await login(email, password);
      if (!success) {
        throw new Error("Invalid email or password");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="loading loading-spinner"></span>
            Logging in...
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
