"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Clock, Trash2, Edit3 } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isToday: boolean;
}

interface ChatListProps {
  searchQuery: string;
}

// TODO: Replace with real API call to fetch chats
const mockChats: Chat[] = [];

export function ChatList({ searchQuery }: ChatListProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  // Filter chats based on search query
  const filteredChats = mockChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by date
  const todayChats = filteredChats.filter(chat => chat.isToday);
  const previousChats = filteredChats.filter(chat => !chat.isToday);

  const formatTime = (timestamp: string) => {
    if (timestamp === "أمس" || timestamp.includes("ال")) {
      return timestamp;
    }
    return timestamp;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Today */}
      {todayChats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>اليوم</span>
          </div>
          <div className="space-y-1">
            {todayChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChat === chat.id}
                isHovered={hoveredChat === chat.id}
                onSelect={() => setSelectedChat(chat.id)}
                onHover={setHoveredChat}
              />
            ))}
          </div>
        </div>
      )}

      {/* Previous 7 days */}
      {previousChats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>السبعة أيام الماضية</span>
          </div>
          <div className="space-y-1">
            {previousChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChat === chat.id}
                isHovered={hoveredChat === chat.id}
                onSelect={() => setSelectedChat(chat.id)}
                onHover={setHoveredChat}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredChats.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "لا توجد محادثات تطابق البحث" : "لا توجد محادثات بعد"}
          </p>
        </div>
      )}
    </div>
  );
}

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}

function ChatItem({ chat, isSelected, isHovered, onSelect, onHover }: ChatItemProps) {
  const formatTime = (timestamp: string) => {
    if (timestamp === "أمس" || timestamp.includes("ال")) {
      return timestamp;
    }
    return timestamp;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={onSelect}
        onMouseEnter={() => onHover(chat.id)}
        onMouseLeave={() => onHover(null)}
        className={`w-full p-3 rounded-xl text-start transition-all duration-200 group ${
          isSelected 
            ? "bg-primary/10 border border-primary/20" 
            : "hover:bg-muted border border-transparent"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm truncate">{chat.title}</h4>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatTime(chat.timestamp)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {chat.lastMessage}
            </p>
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isHovered ? "opacity-100" : ""
          }`}>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <Edit3 className="w-3 h-3" />
            </button>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
