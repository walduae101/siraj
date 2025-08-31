"use client";

import { motion } from "framer-motion";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

export function MessageBubble({ message, isLast = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}
    >
      <div className={`flex gap-3 max-w-3xl ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        }`}>
          {isUser ? "أ" : "س"}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div className={`rounded-2xl px-4 py-3 max-w-2xl ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}>
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </div>
          </div>

          {/* Message Actions */}
          <div className={`flex items-center gap-2 mt-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            
            {!isUser && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="نسخ الرسالة"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="إعادة توليد"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="إعجاب"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="عدم إعجاب"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="المزيد"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Loading message bubble for when AI is responding
export function LoadingMessageBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-6"
    >
      <div className="flex gap-3 max-w-3xl">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
          س
        </div>

        {/* Loading Content */}
        <div className="flex flex-col">
          <div className="bg-muted text-foreground rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
              <span className="text-sm text-muted-foreground">جاري الكتابة...</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
