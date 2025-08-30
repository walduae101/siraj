'use client';

import Link from 'next/link';
import { Card } from '~/components/ui/card';

export default function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3" dir="rtl">
      <Card className="p-4">
        <div className="text-lg font-semibold">الملف الشخصي</div>
        <p className="text-sm text-muted-foreground mt-1">تفاصيل حسابك وحالة تسجيل الدخول.</p>
        <Link className="mt-3 inline-block underline" href="/dashboard">فتح</Link>
      </Card>
      <Card className="p-4">
        <div className="text-lg font-semibold">المدفوعات</div>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة المدفوعات. {` `}
          <span className="font-medium">PayNow</span> يخضع لسيطرة العلم المميز.
        </p>
        <Link className="mt-3 inline-block underline" href="/dashboard/payments">فتح</Link>
      </Card>
      <Card className="p-4">
        <div className="text-lg font-semibold">الإيصالات</div>
        <p className="text-sm text-muted-foreground mt-1">عرض وتنزيل أحدث إيصالاتك.</p>
        <Link className="mt-3 inline-block underline" href="/dashboard/receipts">فتح</Link>
      </Card>
    </div>
  );
}
