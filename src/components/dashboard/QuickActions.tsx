'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { getRTLFlexAlign, isRTLLocale } from '../rtl';
import { Wand2, FileDown, UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '~/components/ui/Toast';

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
  const toast = useToast();

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
        toast.success('تم التصدير ✓', 'تم تصدير البيانات بنجاح');
      } else {
        toast.error('فشل في التصدير', 'حدث خطأ أثناء تصدير البيانات');
      }
    } catch (error) {
      toast.error('خطأ في التصدير', 'تحقق من اتصالك بالإنترنت');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate();
    } else {
      toast.info('انتقال إلى مولد المحتوى', 'سيتم توجيهك إلى صفحة إنشاء المحتوى');
    }
  };

  const handleInvite = () => {
    if (onInvite) {
      onInvite();
    } else {
      toast.info('انتقال إلى دعوة الأعضاء', 'سيتم توجيهك إلى صفحة دعوة الأعضاء');
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
  };

  const actions = [
    {
      label: 'إنشاء محتوى',
      icon: Wand2,
      href: '/tools/ai',
      onClick: handleGenerate,
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
      onClick: handleInvite,
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
            <motion.button
              onClick={() => handleActionClick(action.onClick!)}
              disabled={isDisabled}
              className={cn(
                'group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                'text-white font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                action.className,
                isRTL ? 'flex-row-reverse' : 'flex-row'
              )}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2, ease: 'easeOut' }
              }}
              whileTap={{ 
                scale: 0.95,
                transition: { duration: 0.1 }
              }}
              animate={action.label === 'دعوة عضو' ? {
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5, ease: 'easeInOut' }
              } : {}}
              aria-label={action.label}
            >
              <motion.div
                animate={action.label === 'دعوة عضو' ? {
                  rotate: [0, 10, -10, 10, 0],
                  transition: { duration: 0.5, ease: 'easeInOut' }
                } : {}}
              >
                <Icon 
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isExporting && action.label === 'تصدير CSV' && 'animate-spin'
                  )} 
                />
              </motion.div>
              <span className="flex-1 text-right">{action.label}</span>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
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
