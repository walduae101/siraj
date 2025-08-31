"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import DashboardCards from "~/components/dashboard/DashboardCards";
import { WalletWidget } from "~/components/points/WalletWidget";
import { Button } from "~/components/ui/button";
import { features } from "~/config/features";
import { getFirebaseAuth } from "~/lib/firebase.client";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useFirebaseUser();

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">جارٍ التحميل...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="mb-8 font-bold text-3xl">لوحة التحكم</h1>

      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards />
      </div>

      {/* Points/Wallet Section */}
      {features.pointsClient && (
        <div className="mb-6 rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold text-2xl">النقاط · Points</h2>
          <WalletWidget locale="ar" />
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/account/points")}
              className="flex-1"
            >
              عرض السجل الكامل
            </Button>
            <Button onClick={() => router.push("/paywall")} className="flex-1">
              شراء نقاط
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Firebase Profile Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold text-2xl">معلومات حساب جوجل</h2>
          <div className="mb-4 flex items-center gap-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email || "User"}
                className="h-16 w-16 rounded-full border"
              />
            )}
            <div>
              <p className="font-bold">{user.displayName || "غير محدد"}</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              const auth = getFirebaseAuth();
              if (auth) await signOut(auth);
              router.push("/");
            }}
          >
            تسجيل الخروج
          </Button>
        </div>

        {/* Profile Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 font-semibold text-2xl">الملف الشخصي</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>الاسم:</strong> {user.displayName || "غير محدد"}
            </p>
            <p>
              <strong>معرف Firebase:</strong> {user.uid}
            </p>
            <p>
              <strong>البريد الإلكتروني:</strong> {user.email}
            </p>
          </div>
        </div>

        {/* AI Tools Section */}
        <div className="rounded-lg border bg-card p-6 md:col-span-2">
          <h2 className="mb-4 font-semibold text-2xl">الأدوات الذكية</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => router.push("/tools")}
              className="w-full justify-start"
            >
              نور على نور - مفسر القرآن الكريم
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/tools")}
              className="w-full justify-start"
            >
              مفسر الأحلام
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/tools")}
              className="w-full justify-start"
            >
              مدقق الحقائق
            </Button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="rounded-lg border bg-card p-6 md:col-span-2">
          <h2 className="mb-4 font-semibold text-2xl">إعدادات الحساب</h2>
          <p className="mb-4 text-muted-foreground">
            يمكنك إدارة حسابك وتفضيلاتك من هنا.
          </p>
          <Button variant="outline">تحديث الملف الشخصي</Button>
        </div>
      </div>
    </div>
  );
}

