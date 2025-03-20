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
    content: string
    timestamp: Date
  }
  
  export interface UserSession {
    id: string
    user: User | null
    selectedContact: Contact | null
    messages: Record<string, Message[]>
  }
  
  