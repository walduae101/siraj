'use client';

import { cn } from '~/lib/utils';
import { toArabicDigits, getRTLTextAlign, isRTLLocale } from '../rtl';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showNumbers?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  max,
  label,
  showNumbers = true,
  className,
  size = 'md',
}: ProgressBarProps) {
  const isRTL = isRTLLocale();
  const textAlign = getRTLTextAlign(isRTL);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Determine color based on usage percentage
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and numbers */}
      {(label || showNumbers) && (
        <div className={cn('flex items-center justify-between text-sm', textAlign)}>
          {label && (
            <span className="text-white/80 font-medium">
              {label}
            </span>
          )}
          {showNumbers && (
            <span className="text-white/60 font-mono">
              {isRTL ? toArabicDigits(value) : value} / {isRTL ? toArabicDigits(max) : max}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${value} of ${max}`}
        className={cn(
          'relative w-full rounded-full bg-white/10 overflow-hidden',
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getProgressColor()
          )}
          style={{
            width: `${percentage}%`,
            transform: isRTL ? 'scaleX(-1)' : 'none',
            transformOrigin: isRTL ? 'right' : 'left',
          }}
        />
        
        {/* Shimmer effect for high usage */}
        {percentage > 80 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Usage warning for high usage */}
      {percentage >= 90 && (
        <div className={cn('text-xs text-red-400 flex items-center gap-1', textAlign)}>
          <span>⚠️</span>
          <span>استخدام عالي - فكر في الترقية</span>
        </div>
      )}
    </div>
  );
}
