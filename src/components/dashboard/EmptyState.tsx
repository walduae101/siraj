'use client';

import { cn } from '~/lib/utils';
import { isRTLLocale } from '../rtl';
import { Button } from '~/components/ui/button';

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
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const isRTL = isRTLLocale();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-white/10 bg-black/20',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="w-16 h-16 mb-4 flex items-center justify-center text-white/40">
          {icon}
        </div>
      )}

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
