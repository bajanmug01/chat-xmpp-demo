export interface Conversation {
    id: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unread: number
    online: boolean
    isGroup?: boolean
  }
  
  export interface Message {
    id: string
    text: string
    sender: "me" | "them"
    timestamp: string
    status?: "sent" | "delivered" | "read"
    senderName?: string
  }
  
  