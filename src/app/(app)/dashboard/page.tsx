"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble, LoadingMessageBubble } from "~/components/app/MessageBubble";
import { Composer } from "~/components/app/Composer";
import { MessageSquare, Sparkles, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // TODO: Replace with real AI API call
      // const response = await fetch('/api/ai/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: content })
      // });
      // const data = await response.json();
      
      // For now, show a placeholder response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "سيتم ربط هذه الميزة بـ API الذكاء الاصطناعي قريباً.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "عذراً، حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">مرحباً بك في سيراج</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                منصة الذكاء الاصطناعي الرائدة للغة العربية. ابدأ محادثة جديدة لاستكشاف إمكانيات الذكاء الاصطناعي.
              </p>
              
              {/* Quick Start Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">ابدأ محادثة جديدة</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    اطرح سؤالك وستحصل على إجابة ذكية من سيراج
                  </p>
                </div>
                
                <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">استكشف الميزات</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    تعرف على جميع إمكانيات المنصة وكيفية استخدامها
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            // Messages List
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
              
              {isLoading && <LoadingMessageBubble />}
            </div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <Composer onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
