"use client";

import { X } from "lucide-react";
import { type UserSession } from "../lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "LA/components/ui/tooltip";
import { Button } from "LA/components/ui/button";
import { Avatar, AvatarFallback } from "LA/components/ui/avatar";

interface UserSwitcherProps {
  userSessions: UserSession[];
  activeIndex: number | null;
  onSwitchUser: (index: number) => void;
  onLogout: (index: number) => void;
}

export function UserSwitcher({
  userSessions,
  activeIndex,
  onSwitchUser,
  onLogout,
}: UserSwitcherProps) {
  return (
    <div className="flex items-center space-x-2">
      {userSessions.map((session, index) => (
        <TooltipProvider key={session.user?.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant={activeIndex === index ? "default" : "outline"}
                  size="sm"
                  className="flex items-center space-x-2 pr-8"
                  onClick={() => onSwitchUser(index)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {session.user?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{session.user?.username}</span>
                  <span
                    className={`absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 transform rounded-full ${
                      session.user?.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></span>
                </Button>
                <button
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {session.user?.username} (
                {session.user?.isOnline ? "Online" : "Offline"})
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
