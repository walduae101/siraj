import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { FraudDashboard } from "./fraud-dashboard";
import { AppCheckFailureRate } from "./app-check-failure-rate";

export default async function FraudPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fraud Detection Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor fraud detection metrics, review decisions, and manage allow/deny lists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Suspense fallback={<div>Loading App Check metrics...</div>}>
          <AppCheckFailureRate />
        </Suspense>
      </div>

      <Suspense fallback={<div>Loading fraud dashboard...</div>}>
        <FraudDashboard />
      </Suspense>
    </div>
  );
}
