'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useFirebaseUser } from '~/components/auth/useFirebaseUser';
import { WalletWidget } from '~/components/points/WalletWidget';
import { Button } from '~/components/ui/button';
import { features } from '~/config/features';
import { logoutEverywhere } from '~/lib/firebase.client';
import { isRTLLocale } from '~/components/rtl';

// Dashboard Components
import StatCard from '~/components/dashboard/StatCard';
import Section from '~/components/dashboard/Section';
import QuickActions from '~/components/dashboard/QuickActions';
import UsageSnapshot from '~/components/dashboard/UsageSnapshot';
import SkeletonCard from '~/components/dashboard/SkeletonCard';
import EmptyState from '~/components/dashboard/EmptyState';
import VerifiedBadge from '~/components/dashboard/VerifiedBadge';
import FooterCTA from '~/components/dashboard/FooterCTA';
import ErrorBoundary from '~/components/common/ErrorBoundary';
import SupportBanner from '~/components/ops/SupportBanner';
import ReadOnlyGuard from '~/components/ops/ReadOnlyGuard';

// Icons
import { User, Crown, Calendar, Bell, Settings, LogOut, MessageSquare, Sparkles } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Loading skeleton for the entire dashboard
function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8" dir="rtl">
      <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

// Profile card component
function ProfileCard({ user }: { user: any }) {
  const isRTL = isRTLLocale();
  const isEmailVerified = user.emailVerified || true; // Assume verified for demo
  
  return (
    <StatCard
      title="معلومات حساب جوجل"
      value={
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email || "User"}
                className="h-12 w-12 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="h-12 w-12 rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-right flex-1">
              <div className="font-semibold text-white">
                {user.displayName || "غير محدد"}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">
                  {user.email}
                </span>
                {isEmailVerified && (
                  <VerifiedBadge type="verified" size="sm" />
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutEverywhere()}
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      }
      icon={<User className="w-5 h-5" />}
      intent="neutral"
    />
  );
}

// Plan card component
function PlanCard() {
  const isRTL = isRTLLocale();
  
  return (
    <StatCard
      title="خطتي الحالية"
      value={
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-xl font-bold text-white">احترافي</span>
          </div>
          <div className="text-sm text-white/60">
            التجديد: 15 يناير 2025
          </div>
          <div className="flex items-center gap-2">
            <VerifiedBadge type="secure" size="sm" />
            <span className="text-xs text-white/50">مدعوم من PayNow</span>
          </div>
        </div>
      }
      icon={<Crown className="w-5 h-5" />}
      intent="success"
      helper="خطة احترافية مع ميزات متقدمة"
      className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent"
    />
  );
}

// Notifications component
function Notifications() {
  // Simulate empty state for demo - in real app, this would come from props or API
  const notifications: any[] = [];

  if (notifications.length === 0) {
    return (
      <Section title="الإشعارات">
        <EmptyState
          type="notifications"
          title="لا توجد إشعارات بعد"
          description="ستظهر هنا الإشعارات المهمة مثل تحديثات الحساب والأنشطة الجديدة"
        />
      </Section>
    );
  }

  return (
    <Section title="الإشعارات" badge={`${notifications.length} جديد`}>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-white font-medium">
                {notification.title}
              </div>
              <div className="text-xs text-white/60">
                {notification.time}
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          عرض جميع الإشعارات
        </Button>
      </div>
    </Section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useFirebaseUser();
  const isRTL = isRTLLocale();

  if (userLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8 pb-24 lg:pb-8 space-y-8"
      dir="rtl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Support Mode Banner */}
      <SupportBanner userLabel={user.email || user.uid || 'Guest'} />
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-white mb-2">لوحة التحكم</h1>
        <p className="text-white/60">
          مرحباً بك، {user.displayName || user.email}. إليك نظرة عامة على حسابك.
        </p>
      </motion.div>

      {/* Points/Wallet Section */}
      {features.pointsClient && (
        <motion.div variants={itemVariants}>
          <Section title="النقاط · Points">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <WalletWidget locale="ar" />
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/account/points")}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  عرض السجل الكامل
                </Button>
                <Button 
                  onClick={() => router.push("/paywall")} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  شراء نقاط
                </Button>
              </div>
            </div>
          </Section>
        </motion.div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <motion.div variants={itemVariants}>
            <ProfileCard user={user} />
          </motion.div>

          {/* Plan Card */}
          <motion.div variants={itemVariants}>
            <PlanCard />
          </motion.div>

          {/* Quick Actions - Hidden on mobile (shown in sticky bar) */}
          <motion.div variants={itemVariants} className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <ReadOnlyGuard>
                <QuickActions />
              </ReadOnlyGuard>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Usage Snapshot */}
          <motion.div variants={itemVariants}>
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <ErrorBoundary>
                <Suspense fallback={<SkeletonCard />}>
                  <UsageSnapshot />
                </Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div variants={itemVariants}>
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <ErrorBoundary>
                <Notifications />
              </ErrorBoundary>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Sticky Quick Actions Bar */}
      <motion.div 
        variants={itemVariants}
        className="lg:hidden fixed bottom-4 left-4 right-4 z-40"
      >
        <div className="rounded-2xl border border-white/20 bg-black/40 backdrop-blur-md p-4 shadow-2xl">
          <ReadOnlyGuard>
            <QuickActions />
          </ReadOnlyGuard>
        </div>
      </motion.div>

      {/* AI Tools Section */}
      <motion.div variants={itemVariants}>
        <Section title="الأدوات الذكية" badge="متاحة الآن">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/tools")}
              className="h-auto p-4 border-white/20 text-white hover:bg-white/10 flex-col gap-2"
            >
              <div className="text-lg">📖</div>
              <div className="font-medium">نور على نور</div>
              <div className="text-xs text-white/60">مفسر القرآن الكريم</div>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/tools")}
              className="h-auto p-4 border-white/20 text-white hover:bg-white/10 flex-col gap-2"
            >
              <div className="text-lg">💭</div>
              <div className="font-medium">مفسر الأحلام</div>
              <div className="text-xs text-white/60">تفسير الأحلام الإسلامية</div>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/tools")}
              className="h-auto p-4 border-white/20 text-white hover:bg-white/10 flex-col gap-2"
            >
              <div className="text-lg">✅</div>
              <div className="font-medium">مدقق الحقائق</div>
              <div className="text-xs text-white/60">التحقق من المعلومات</div>
            </Button>
          </div>
        </Section>
      </motion.div>

      {/* Account Settings */}
      <motion.div variants={itemVariants}>
        <Section title="إعدادات الحساب">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/account")}
              className="h-auto p-4 border-white/20 text-white hover:bg-white/10 flex items-center gap-3"
            >
              <Settings className="w-5 h-5" />
              <div className="text-right">
                <div className="font-medium">إعدادات الحساب</div>
                <div className="text-xs text-white/60">إدارة الملف الشخصي</div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/account/api")}
              className="h-auto p-4 border-white/20 text-white hover:bg-white/10 flex items-center gap-3"
            >
              <div className="w-5 h-5">🔑</div>
              <div className="text-right">
                <div className="font-medium">مفاتيح API</div>
                <div className="text-xs text-white/60">إدارة المفاتيح</div>
              </div>
            </Button>
          </div>
        </Section>
      </motion.div>

      {/* Contextual Footer CTA */}
      <motion.div variants={itemVariants}>
        <FooterCTA
          plan="pro" // TODO: Get from actual user data
          usage={{
            ai: { used: 45, limit: 100 },
            api: { used: 1200, limit: 5000 },
            csv: { used: 3, limit: 10 },
          }}
          hasOrg={false} // TODO: Get from actual user data
        />
      </motion.div>
    </motion.div>
  );
}