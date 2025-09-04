'use client';

import { cn } from '~/lib/utils';
import { getRTLTextAlign, isRTLLocale } from '../rtl';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  helper?: string;
  icon?: React.ReactNode;
  intent?: 'neutral' | 'success' | 'warn' | 'danger';
  className?: string;
}

const intentStyles = {
  neutral: 'border-white/10 bg-black/30',
  success: 'border-green-500/20 bg-green-500/5',
  warn: 'border-yellow-500/20 bg-yellow-500/5',
  danger: 'border-red-500/20 bg-red-500/5',
};

export default function StatCard({
  title,
  value,
  helper,
  icon,
  intent = 'neutral',
  className,
}: StatCardProps) {
  const isRTL = isRTLLocale();
  const textAlign = getRTLTextAlign(isRTL);

  return (
    <div
      className={cn(
        'group relative rounded-2xl border backdrop-blur-sm transition-all duration-200',
        'hover:border-white/20 hover:shadow-lg hover:shadow-black/10',
        'focus-within:ring-2 focus-within:ring-white/20 focus-within:ring-offset-2 focus-within:ring-offset-black',
        intentStyles[intent],
        className
      )}
    >
      <div className="p-6">
        {/* Header with icon and title */}
        <div className={cn('flex items-center gap-3 mb-4', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          {icon && (
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/60 group-hover:text-white/80 transition-colors">
              {icon}
            </div>
          )}
          <h3 className={cn('text-sm font-medium text-white/80 group-hover:text-white transition-colors', textAlign)}>
            {title}
          </h3>
        </div>

        {/* Value */}
        <div className={cn('mb-2', textAlign)}>
          <div className="text-2xl font-bold text-white group-hover:text-white transition-colors">
            {value}
          </div>
        </div>

        {/* Helper text */}
        {helper && (
          <div className={cn('text-xs text-white/60 group-hover:text-white/70 transition-colors', textAlign)}>
            {helper}
          </div>
        )}
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
