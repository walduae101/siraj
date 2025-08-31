"use client";

import Link from "next/link";
import { Card } from "~/components/ui/card";

export default function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3" dir="rtl">
      <Card className="p-4">
        <div className="font-semibold text-lg">الملف الشخصي</div>
        <p className="mt-1 text-muted-foreground text-sm">
          تفاصيل حسابك وحالة تسجيل الدخول.
        </p>
        <Link className="mt-3 inline-block underline" href="/dashboard">
          فتح
        </Link>
      </Card>
      <Card className="p-4">
        <div className="font-semibold text-lg">المدفوعات</div>
        <p className="mt-1 text-muted-foreground text-sm">
          إدارة المدفوعات. {` `}
          <span className="font-medium">PayNow</span> يخضع لسيطرة العلم المميز.
        </p>
        <Link
          className="mt-3 inline-block underline"
          href="/dashboard/payments"
        >
          فتح
        </Link>
      </Card>
      <Card className="p-4">
        <div className="font-semibold text-lg">الإيصالات</div>
        <p className="mt-1 text-muted-foreground text-sm">
          عرض وتنزيل أحدث إيصالاتك.
        </p>
        <Link
          className="mt-3 inline-block underline"
          href="/dashboard/receipts"
        >
          فتح
        </Link>
      </Card>
    </div>
  );
}

