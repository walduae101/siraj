'use client';

import { cn } from '~/lib/utils';
import { isRTLLocale } from '../rtl';
import { Button } from '~/components/ui/button';
import { MessageSquare, Bell, FileText, Users, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  className?: string;
  type?: 'notifications' | 'tools' | 'data' | 'users' | 'default';
}

// SVG Illustrations for different empty state types
const EmptyStateIllustration = ({ type }: { type: string }) => {
  const illustrations = {
    notifications: (
      <svg viewBox="0 0 200 120" className="w-24 h-16 text-white/20">
        <defs>
          <linearGradient id="bellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <Bell 
          x="80" y="20" width="40" height="40" 
          fill="url(#bellGradient)" 
          className="animate-pulse"
        />
        <circle cx="100" cy="30" r="2" fill="currentColor" opacity="0.4" />
        <circle cx="90" cy="50" r="1.5" fill="currentColor" opacity="0.3" />
        <circle cx="110" cy="60" r="1" fill="currentColor" opacity="0.2" />
      </svg>
    ),
    tools: (
      <svg viewBox="0 0 200 120" className="w-24 h-16 text-white/20">
        <defs>
          <linearGradient id="toolsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <Sparkles 
          x="70" y="15" width="60" height="60" 
          fill="url(#toolsGradient)" 
          className="animate-pulse"
        />
        <circle cx="80" cy="40" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="120" cy="50" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="100" cy="70" r="2.5" fill="currentColor" opacity="0.25" />
      </svg>
    ),
    data: (
      <svg viewBox="0 0 200 120" className="w-24 h-16 text-white/20">
        <defs>
          <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <FileText 
          x="80" y="20" width="40" height="50" 
          fill="url(#dataGradient)" 
          className="animate-pulse"
        />
        <rect x="85" y="30" width="30" height="2" fill="currentColor" opacity="0.3" />
        <rect x="85" y="35" width="25" height="2" fill="currentColor" opacity="0.2" />
        <rect x="85" y="40" width="20" height="2" fill="currentColor" opacity="0.15" />
      </svg>
    ),
    users: (
      <svg viewBox="0 0 200 120" className="w-24 h-16 text-white/20">
        <defs>
          <linearGradient id="usersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <Users 
          x="70" y="20" width="60" height="50" 
          fill="url(#usersGradient)" 
          className="animate-pulse"
        />
        <circle cx="85" cy="35" r="8" fill="currentColor" opacity="0.2" />
        <circle cx="115" cy="35" r="8" fill="currentColor" opacity="0.15" />
        <circle cx="100" cy="55" r="6" fill="currentColor" opacity="0.1" />
      </svg>
    ),
    default: (
      <svg viewBox="0 0 200 120" className="w-24 h-16 text-white/20">
        <defs>
          <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="60" r="30" fill="url(#defaultGradient)" className="animate-pulse" />
        <circle cx="100" cy="60" r="20" fill="currentColor" opacity="0.2" />
        <circle cx="100" cy="60" r="10" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  };

  return illustrations[type as keyof typeof illustrations] || illustrations.default;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  type = 'default',
}: EmptyStateProps) {
  const isRTL = isRTLLocale();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-white/10 bg-black/20',
        className
      )}
    >
      {/* Illustration or Icon */}
      <div className="w-24 h-16 mb-4 flex items-center justify-center">
        {icon ? (
          <div className="text-white/40">
            {icon}
          </div>
        ) : (
          <EmptyStateIllustration type={type} />
        )}
      </div>

      {/* Content */}
      <div className="space-y-2 max-w-sm">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{description}</p>
      </div>

      {/* Action */}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button
              onClick={action.onClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
