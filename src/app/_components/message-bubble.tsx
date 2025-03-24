import { Check, CheckCheck } from "lucide-react"
import { type Message } from "../lib/types"
import { cn } from "LA/lib/utils"

interface MessageBubbleProps {
  message: Message
  isGroup?: boolean
}

export default function MessageBubble({ message, isGroup }: MessageBubbleProps) {
  const isMe = message.sender === "me"

  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 text-sm",
          isMe
            ? "bg-green-100 dark:bg-green-900 text-gray-800 dark:text-gray-100 rounded-tr-none"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none",
        )}
      >
        {isGroup && !isMe && message.senderName && (
          <div className="font-medium text-xs text-blue-600 dark:text-blue-400 mb-1">{message.senderName}</div>
        )}
        <div>{message.text}</div>
        <div className="flex justify-end items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{message.timestamp}</span>
          {isMe && (
            <>
              {message.status === "sent" && <Check className="h-3 w-3" />}
              {message.status === "delivered" && <CheckCheck className="h-3 w-3" />}
              {message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

