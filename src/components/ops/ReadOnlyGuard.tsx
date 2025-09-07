'use client';

import { ReactNode } from 'react';
import { cn } from '~/lib/utils';
import { isSupportMode } from '~/lib/supportMode';

interface ReadOnlyGuardProps {
  children: ReactNode;
  className?: string;
  tooltip?: string;
}

export default function ReadOnlyGuard({ 
  children, 
  className,
  tooltip = 'متاح للقراءة فقط'
}: ReadOnlyGuardProps) {
  const isReadOnly = isSupportMode();

  if (!isReadOnly) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        'relative group',
        'opacity-60 cursor-not-allowed',
        'select-none pointer-events-none',
        className
      )}
      aria-disabled="true"
      tabIndex={-1}
      title={tooltip}
    >
      {children}
      
      {/* Read-only overlay */}
      <div className="absolute inset-0 bg-black/10 rounded-lg" />
      
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80" />
      </div>
    </div>
  );
}
