"use client";

import { useState } from "react";
import { 
  Menu, 
  Search, 
  HelpCircle, 
  Settings, 
  User,
  ChevronDown,
  Sparkles,
  Zap
} from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [selectedModel, setSelectedModel] = useState("siraj-pro");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const models = [
    {
      id: "siraj-pro",
      name: "سيراج Pro",
      description: "أحدث نموذج للذكاء الاصطناعي",
      icon: Sparkles,
      badge: "الأحدث",
    },
    {
      id: "siraj-fast",
      name: "سيراج Fast",
      description: "سريع ومحسن للأداء",
      icon: Zap,
    },
    {
      id: "siraj-basic",
      name: "سيراج Basic",
      description: "النموذج الأساسي",
      icon: Sparkles,
    },
  ];

  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            {currentModel && (
              <>
                <currentModel.icon className="w-4 h-4" />
                <span className="font-medium">{currentModel.name}</span>
                {currentModel.badge && (
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                    {currentModel.badge}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Model Dropdown */}
          {isModelDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50">
              <div className="p-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-start transition-colors ${
                      selectedModel === model.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <model.icon className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        {model.badge && (
                          <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Help */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
        </button>
      </div>
    </header>
  );
}
