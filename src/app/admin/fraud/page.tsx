"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useEffect } from "react";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import { AppCheckFailureRate } from "./app-check-failure-rate";

export default function FraudPage() {
  const { user, loading } = useFirebaseUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Simple admin check - in production you'd want proper role-based auth
  const isAdmin =
    user?.email?.includes("@siraj.life") || user?.email?.includes("admin");

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-gray-900">
          Fraud Detection Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Monitor fraud detection metrics, review decisions, and manage
          allow/deny lists.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<div>Loading App Check metrics...</div>}>
          <AppCheckFailureRate />
        </Suspense>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 font-semibold text-xl">Fraud Detection Overview</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded bg-blue-50 p-4">
            <div className="font-bold text-2xl text-blue-600">0.8%</div>
            <div className="text-gray-600 text-sm">Deny Rate</div>
          </div>
          <div className="rounded bg-green-50 p-4">
            <div className="font-bold text-2xl text-green-600">122ms</div>
            <div className="text-gray-600 text-sm">Avg Processing</div>
          </div>
          <div className="rounded bg-yellow-50 p-4">
            <div className="font-bold text-2xl text-yellow-600">32</div>
            <div className="text-gray-600 text-sm">Manual Reviews</div>
          </div>
        </div>
      </div>
    </div>
  );
}
