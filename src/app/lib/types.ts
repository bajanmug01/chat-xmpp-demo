import type { AppRouter } from "LA/server/api/root";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { UseTRPCMutationResult } from "@trpc/react-query/shared";

export interface User {
    id: string
    username: string
    isOnline: boolean
  }
  
  export interface Contact {
    id: string
    name: string
    lastSeen: Date
    isOnline: boolean
    avatar: string
  }
  
  export interface Message {
    id: string
    senderId: string
    text: string
    timestamp: Date
    isRead: boolean
  }
  
  export interface UserSession {
    id: string
    user: User | null
    selectedContact: Contact | null
    messages: Record<string, Message[]>
  }
  
  // Type for the mutation state that includes isLoading
  export interface MutationState {
    isLoading: boolean;
  }
  
  // Helper type for working with tRPC mutations
  export type TRPCMutationResult<TData, TInput> = UseTRPCMutationResult<
    TData,
    TRPCClientErrorLike<AppRouter>,
    TInput,
    unknown
  > & MutationState;
  
  // Specific mutation result types used in our app
  export type GetContactsMutationResult = TRPCMutationResult<
    { contacts: Contact[] },
    { username: string; password: string }
  >;
  
  export type AddContactMutationResult = TRPCMutationResult<
    { success: boolean; contactJid: string },
    { username: string; password: string; contactUsername: string; name?: string }
  >;
  
  