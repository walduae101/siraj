"use client";

import { Suspense } from "react";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ManualReviewStats } from "./manual-review-stats";

export default function ManualReviewsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Manual Reviews</h1>
        <p className="text-gray-600 mt-2">
          Review and manage fraud detection cases that require manual intervention.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Suspense fallback={<div>Loading review stats...</div>}>
          <ManualReviewStats />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Review Queue</h2>
        <div className="text-center text-gray-500 py-8">
          No pending reviews at this time.
        </div>
      </div>
    </div>
  );
}
