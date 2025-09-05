'use client';

import Link from 'next/link';
import { cn } from '~/lib/utils';
import { isRTLLocale } from '../rtl';
import { ChevronLeft, ChevronRight, TrendingUp, Users, BookOpen } from 'lucide-react';

interface UsageData {
  ai: { used: number; limit: number };
  api: { used: number; limit: number };
  csv: { used: number; limit: number };
}

interface FooterCTAProps {
  plan: 'free' | 'pro' | 'org';
  usage: UsageData;
  hasOrg: boolean;
  className?: string;
}

export default function FooterCTA({ plan, usage, hasOrg, className }: FooterCTAProps) {
  const isRTL = isRTLLocale();
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  // Calculate if any usage is nearing limit (< 15% remaining)
  const isNearLimit = Object.entries(usage).some(([key, data]) => {
    const remaining = data.limit - data.used;
    return remaining < (data.limit * 0.15);
  });

  // Determine the best CTA based on current state
  let ctaConfig: {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<any>;
    className: string;
  };

  if (isNearLimit) {
    ctaConfig = {
      title: 'أوشكت على النفاد',
      description: 'ترقية الآن للحصول على المزيد من الاستخدام',
      href: '/pricing',
      icon: TrendingUp,
      className: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10',
    };
  } else if (!hasOrg) {
    ctaConfig = {
      title: 'أنشئ مؤسسة',
      description: 'إضافة فريقك والاستفادة من الميزات المتقدمة',
      href: '/orgs/new',
      icon: Users,
      className: 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10',
    };
  } else {
    ctaConfig = {
      title: 'تعرف على واجهات Siraj',
      description: 'استكشف الوثائق وابدأ في التطوير',
      href: '/docs/api',
      icon: BookOpen,
      className: 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10',
    };
  }

  const Icon = ctaConfig.icon;

  return (
    <div className={cn('mt-10', className)}>
      <Link
        href={ctaConfig.href}
        className={cn(
          'group block p-4 rounded-xl border backdrop-blur-sm',
          'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black',
          ctaConfig.className
        )}
      >
        <div className={cn(
          'flex items-center gap-3',
          isRTL ? 'flex-row-reverse' : 'flex-row'
        )}>
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/60 group-hover:text-white/80 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          
          <div className={cn('flex-1', isRTL ? 'text-right' : 'text-left')}>
            <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors">
              {ctaConfig.title}
            </h3>
            <p className="text-sm text-white/60 group-hover:text-white/70 transition-colors">
              {ctaConfig.description}
            </p>
          </div>
          
          <div className="flex-shrink-0 text-white/40 group-hover:text-white/60 transition-colors">
            <Chevron className="w-5 h-5" />
          </div>
        </div>
        
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Link>
    </div>
  );
}
