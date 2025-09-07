'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '~/lib/utils';
import { toArabicDigits, isRTLLocale } from '../rtl';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import SkeletonCard from './SkeletonCard';
import { Zap, Code, FileSpreadsheet, Crown, TrendingUp } from 'lucide-react';
import { track } from '~/lib/analytics';

interface UsageData {
  plan: 'free' | 'pro' | 'org';
  usage: {
    ai: { used: number; limit: number };
    api: { used: number; limit: number };
    csv: { used: number; limit: number };
  };
}

// Mock usage data - replace with real API calls
const getUsage = async (): Promise<UsageData> => {
  // Check for mock mode
  const isMockMode = process.env.NODE_ENV === 'development' && 
    (process.env.DASHBOARD_MOCK === '1' || process.env.NEXT_PUBLIC_DASHBOARD_MOCK === '1');
  
  if (isMockMode) {
    // Simulate slow API delay for testing
    await new Promise(resolve => setTimeout(resolve, 1500));
  } else {
    // Normal delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Simulate network error in mock mode
  if (isMockMode && Math.random() < 0.1) { // 10% chance of error
    throw new Error('Network error: Failed to fetch usage data');
  }
  
  return {
    plan: 'pro',
    usage: {
      ai: { used: 45, limit: 100 },
      api: { used: 1200, limit: 5000 },
      csv: { used: 3, limit: 10 },
    },
  };
};

const planLimits = {
  free: { ai: 10, api: 100, csv: 2 },
  pro: { ai: 100, api: 5000, csv: 10 },
  org: { ai: 500, api: 25000, csv: 50 },
};

const planNames = {
  free: 'مجاني',
  pro: 'احترافي',
  org: 'منظمة',
};

export default function UsageSnapshot() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nudgeShown, setNudgeShown] = useState(false);
  const isRTL = isRTLLocale();

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Performance timing
      const startTime = performance.now();
      performance.mark('usage-fetch-start');
      
      const data = await getUsage();
      setUsageData(data);
      
      // Track time to usage render
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      performance.mark('usage-fetch-end');
      performance.measure('usage-fetch-duration', 'usage-fetch-start', 'usage-fetch-end');
      
      // Send telemetry
      track('ux.time_to_usage', {
        duration: Math.round(renderTime),
        plan: data.plan,
        success: true,
      });
      
      // Check if we should show usage nudge (only once per day)
      const today = new Date().toDateString();
      const lastNudgeDate = localStorage.getItem('usage-nudge-date');
      
      if (lastNudgeDate !== today) {
        const { usage } = data;
        const limits = planLimits[data.plan];
        
        // Check if any usage is nearing limit (< 15% remaining)
        const isNearLimit = Object.keys(usage).some(key => {
          const used = usage[key as keyof typeof usage].used;
          const limit = limits[key as keyof typeof limits];
          const remaining = limit - used;
          return remaining < (limit * 0.15);
        });
        
        if (isNearLimit) {
          setNudgeShown(true);
          localStorage.setItem('usage-nudge-date', today);
          
          // Fire analytics event
          track('usage.nudge_shown', {
            plan: data.plan,
            usage: usage,
          });
        }
      }
    } catch (err) {
      setError('فشل في تحميل بيانات الاستخدام');
      console.error('Usage fetch error:', err);
      
      // Track error telemetry
      track('ux.time_to_usage', {
        duration: Math.round(performance.now() - performance.getEntriesByName('usage-fetch-start')[0]?.startTime || 0),
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">استخدامي</h3>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">استخدامي</h3>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400 mb-4">{error || 'خطأ في تحميل البيانات'}</p>
          <button
            onClick={fetchUsage}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? 'جاري المحاولة...' : 'حاول مرة أخرى'}
          </button>
        </div>
      </div>
    );
  }

  const { plan, usage } = usageData;
  const limits = planLimits[plan];

  const usageItems = [
    {
      title: 'مولدات الذكاء الاصطناعي',
      icon: Zap,
      used: usage.ai.used,
      limit: limits.ai,
      unit: 'مولد',
    },
    {
      title: 'استدعاءات API',
      icon: Code,
      used: usage.api.used,
      limit: limits.api,
      unit: 'استدعاء',
    },
    {
      title: 'تصدير CSV',
      icon: FileSpreadsheet,
      used: usage.csv.used,
      limit: limits.csv,
      unit: 'ملف',
    },
  ];

  const needsUpgrade = usageItems.some(item => (item.used / item.limit) >= 0.9);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">استخدامي</h3>
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-white/80">{planNames[plan]}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {usageItems.map((item, index) => {
          const Icon = item.icon;
          const percentage = (item.used / item.limit) * 100;
          const isHighUsage = percentage >= 90;

          return (
            <StatCard
              key={index}
              title={item.title}
              value={
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {isRTL ? toArabicDigits(item.used) : item.used}
                    <span className="text-sm font-normal text-white/60 ml-1">
                      / {isRTL ? toArabicDigits(item.limit) : item.limit}
                    </span>
                  </div>
                  <ProgressBar
                    value={item.used}
                    max={item.limit}
                    size="sm"
                    showNumbers={false}
                  />
                </div>
              }
              icon={<Icon className="w-5 h-5" />}
              intent={isHighUsage ? 'danger' : percentage >= 75 ? 'warn' : 'success'}
              helper={`${item.unit} متاح هذا الشهر`}
            />
          );
        })}
      </div>

      {/* Usage Nudge - shown when nearing limit */}
      {nudgeShown && (
        <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-400 font-medium mb-1">أوشكت على النفاد</h4>
              <p className="text-sm text-white/80">
                اعرف خطط الترقية للحصول على المزيد من الاستخدام
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              عرض الخطط
            </Link>
          </div>
        </div>
      )}

      {/* Upgrade CTA for high usage */}
      {needsUpgrade && (
        <div className="mt-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-yellow-400 font-medium mb-1">استخدام عالي</h4>
              <p className="text-sm text-white/80">
                أنت تستخدم أكثر من 90% من حدك. فكر في الترقية للحصول على المزيد.
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ترقية الآن
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
