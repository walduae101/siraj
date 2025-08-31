"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Send, 
  Mic, 
  Paperclip, 
  Sparkles,
  Lightbulb,
  MessageSquare,
  FileText,
  BarChart3
} from "lucide-react";

interface ComposerProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const suggestions = [
  {
    icon: Lightbulb,
    title: "أفكار للمحتوى",
    description: "أنشئ أفكار إبداعية للمحتوى العربي",
  },
  {
    icon: MessageSquare,
    title: "تحليل النصوص",
    description: "حلل النصوص العربية واستخرج الرؤى",
  },
  {
    icon: FileText,
    title: "كتابة المقالات",
    description: "اكتب مقالات احترافية باللغة العربية",
  },
  {
    icon: BarChart3,
    title: "تحليل البيانات",
    description: "حلل البيانات وأنشئ تقارير شاملة",
  },
];

export function Composer({ onSendMessage, isLoading = false }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    setMessage(suggestion.title);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border bg-background">
      {/* Suggestions */}
      {showSuggestions && !message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-start group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <suggestion.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative">
          {/* Input Field */}
          <div className="relative bg-muted rounded-2xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا... (Shift + Enter للأسطر الجديدة)"
              className="w-full p-4 pr-12 bg-transparent resize-none outline-none placeholder:text-muted-foreground max-h-32"
              rows={1}
              disabled={isLoading}
            />
            
            {/* Action Buttons */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-background transition-colors"
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-background transition-colors"
                disabled={isLoading}
              >
                <Mic className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className="absolute bottom-3 right-3 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Character Count */}
          {message && (
            <div className="flex items-center justify-between mt-2 px-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3" />
                <span>سيراج Pro</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {message.length} حرف
              </span>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          سيراج قد يقدم معلومات غير دقيقة. تحقق من المعلومات المهمة.
        </p>
      </div>
    </div>
  );
}
