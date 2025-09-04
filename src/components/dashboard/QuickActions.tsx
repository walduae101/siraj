'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '~/lib/utils';
import { getRTLFlexAlign, isRTLLocale } from '../rtl';
import { Wand2, FileDown, UserPlus, Loader2 } from 'lucide-react';

interface QuickActionsProps {
  onGenerate?: () => void;
  onExport?: () => void;
  onInvite?: () => void;
  className?: string;
}

export default function QuickActions({
  onGenerate,
  onExport,
  onInvite,
  className,
}: QuickActionsProps) {
  const isRTL = isRTLLocale();
  const flexAlign = getRTLFlexAlign(isRTL);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (onExport) {
      onExport();
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Show success toast (you can implement a toast system)
        console.log('تم التصدير بنجاح');
      } else {
        console.error('فشل في التصدير');
      }
    } catch (error) {
      console.error('خطأ في التصدير:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const actions = [
    {
      label: 'إنشاء محتوى',
      icon: Wand2,
      href: '/tools/ai',
      onClick: onGenerate,
      className: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
    },
    {
      label: 'تصدير CSV',
      icon: isExporting ? Loader2 : FileDown,
      onClick: handleExport,
      disabled: isExporting,
      className: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
    },
    {
      label: 'دعوة عضو',
      icon: UserPlus,
      href: '/orgs/new',
      onClick: onInvite,
      className: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
    },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-lg font-semibold text-white mb-4">إجراءات سريعة</h3>
      <div className={cn('flex flex-col gap-3', flexAlign)}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isDisabled = action.disabled || isExporting;

          const buttonContent = (
            <button
              onClick={action.onClick}
              disabled={isDisabled}
              className={cn(
                'group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                'text-white font-medium transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20',
                'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                action.className,
                isRTL ? 'flex-row-reverse' : 'flex-row'
              )}
              aria-label={action.label}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isExporting && action.label === 'تصدير CSV' && 'animate-spin'
                )} 
              />
              <span className="flex-1 text-right">{action.label}</span>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );

          if (action.href && !isDisabled) {
            return (
              <Link key={index} href={action.href} className="block">
                {buttonContent}
              </Link>
            );
          }

          return (
            <div key={index}>
              {buttonContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
