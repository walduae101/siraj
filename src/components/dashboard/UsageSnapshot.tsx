'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '~/lib/utils';
import { toArabicDigits, isRTLLocale } from '../rtl';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import SkeletonCard from './SkeletonCard';
import { Zap, Code, FileSpreadsheet, Crown } from 'lucide-react';

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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
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
  const isRTL = isRTLLocale();

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUsage();
        setUsageData(data);
      } catch (err) {
        setError('فشل في تحميل بيانات الاستخدام');
        console.error('Usage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            حاول مرة أخرى
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
