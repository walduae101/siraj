'use client';

import { cn } from '~/lib/utils';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export default function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6',
        className
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
      </div>

      {/* Value skeleton */}
      <div className="h-8 bg-white/10 rounded w-32 mb-2 animate-pulse" />

      {/* Helper text skeleton */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-3 bg-white/10 rounded animate-pulse',
              index === lines - 1 ? 'w-16' : 'w-full'
            )}
          />
        ))}
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
    </div>
  );
}
