"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  Crown, 
  ChevronLeft,
  Search,
  MoreVertical
} from "lucide-react";
import { ChatList } from "./ChatList";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-80 bg-sidebar border-r border-border flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            {/* New Chat Button */}
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">محادثة جديدة</span>
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث في المحادثات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            <ChatList searchQuery={searchQuery} />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <span className="font-medium">الإعدادات</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-start">
                <div className="font-medium">ترقية إلى Pro</div>
                <div className="text-sm text-muted-foreground">احصل على ميزات متقدمة</div>
              </div>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
