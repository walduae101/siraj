'use client';

import { cn } from '~/lib/utils';
import { Check, Lock, Shield } from 'lucide-react';

interface VerifiedBadgeProps {
  type?: 'verified' | 'secure' | 'trusted';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeConfig = {
  verified: {
    icon: Check,
    text: 'موثق',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
  secure: {
    icon: Lock,
    text: 'آمن',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  trusted: {
    icon: Shield,
    text: 'موثوق',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
};

const sizeConfig = {
  sm: {
    icon: 'w-3 h-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
  },
  md: {
    icon: 'w-4 h-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
  },
  lg: {
    icon: 'w-5 h-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
  },
};

export default function VerifiedBadge({
  type = 'verified',
  size = 'sm',
  className,
}: VerifiedBadgeProps) {
  const config = badgeConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border backdrop-blur-sm',
        'transition-all duration-200 hover:scale-105',
        config.className,
        sizeStyles.padding,
        sizeStyles.text,
        className
      )}
    >
      <Icon className={sizeStyles.icon} />
      <span className="font-medium">{config.text}</span>
    </div>
  );
}
