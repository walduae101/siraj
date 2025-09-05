'use client';

import { cn } from '~/lib/utils';
import { getRTLTextAlign, isRTLLocale } from '../rtl';

interface SectionProps {
  title: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Section({
  title,
  badge,
  actions,
  children,
  className,
}: SectionProps) {
  const isRTL = isRTLLocale();
  const textAlign = getRTLTextAlign(isRTL);

  return (
    <section className={cn('space-y-4', className)}>
      {/* Section header */}
      <div className={cn('flex items-center justify-between', isRTL ? 'flex-row-reverse' : 'flex-row')}>
        <div className={cn('flex items-center gap-3', isRTL ? 'flex-row-reverse' : 'flex-row')}>
          <h2 className={cn('text-xl font-semibold text-white', textAlign)}>
            {title}
          </h2>
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs bg-violet-600/15 text-violet-400 border border-violet-500/20">
              {badge}
            </span>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Section content */}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}
