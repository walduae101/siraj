'use client';

import { useEffect } from 'react';
import { cn } from '~/lib/utils';
import { isSupportMode, getSupportModeBannerText } from '~/lib/supportMode';
import { track } from '~/lib/analytics';

interface SupportBannerProps {
  userLabel: string;
  className?: string;
}

export default function SupportBanner({ userLabel, className }: SupportBannerProps) {
  // Don't render if not in support mode
  if (!isSupportMode()) {
    return null;
  }

  // Fire analytics event on first render
  useEffect(() => {
    track('ux.support_mode_view', {
      route: window.location.pathname,
      userLabel,
    });
  }, [userLabel]);

  const bannerText = getSupportModeBannerText(userLabel);

  return (
    <div
      className={cn(
        'fixed top-4 left-4 z-50 px-3 py-2 rounded-full',
        'bg-orange-500/90 text-white text-sm font-medium',
        'backdrop-blur-sm border border-orange-400/20',
        'shadow-lg shadow-orange-500/20',
        'animate-pulse',
        className
      )}
      role="banner"
      aria-label="Support Mode Active"
    >
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 bg-white rounded-full animate-ping" />
        {bannerText}
      </span>
    </div>
  );
}
