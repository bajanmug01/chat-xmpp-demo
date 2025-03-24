import { cn } from "LA/lib/utils";
import { type XMPPMessage } from "../lib/xmppClient";
import { useAuth } from "../lib/auth-context";

interface MessageBubbleProps {
  message: XMPPMessage;
  isGroup?: boolean;
}

export default function MessageBubble({
  message,
  isGroup,
}: MessageBubbleProps) {
  const user = useAuth();
  const isMe = message.from === user.user?.name;

  console.log("user name: ", user.user?.name);

  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2 text-sm",
          isMe
            ? "rounded-tr-none bg-green-100 text-gray-800 dark:bg-green-900 dark:text-gray-100"
            : "rounded-tl-none bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100",
        )}
      >
        {isGroup && !isMe && message.from && (
          <div className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            {message.from}
          </div>
        )}
        <div>{message.body}</div>
        <div className="mt-1 flex items-center justify-end gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{message.timestamp}</span>
          {isMe && (
            <>
              {/*message.status === "sent" && <Check className="h-3 w-3" />*/}
              {/*message.status === "delivered" && <CheckCheck className="h-3 w-3" />*/}
              {/*message.status === "read" && <CheckCheck className="h-3 w-3 text-blue-500" />*/}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
