"use client";

import { Suspense } from "react";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  const isAdmin = user?.email?.includes("@siraj.life") || user?.email?.includes("admin");

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
        <div className="text-center text-red-600">Access denied. Admin privileges required.</div>
      </div>
    );
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Fraud Detection Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">0.8%</div>
            <div className="text-sm text-gray-600">Deny Rate</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-2xl font-bold text-green-600">122ms</div>
            <div className="text-sm text-gray-600">Avg Processing</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <div className="text-2xl font-bold text-yellow-600">32</div>
            <div className="text-sm text-gray-600">Manual Reviews</div>
          </div>
        </div>
      </div>
    </div>
  );
}
