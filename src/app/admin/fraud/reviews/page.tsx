"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useEffect } from "react";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
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
        <h1 className="font-bold text-3xl text-gray-900">Manual Reviews</h1>
        <p className="mt-2 text-gray-600">
          Review and manage fraud detection cases that require manual
          intervention.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense fallback={<div>Loading review stats...</div>}>
          <ManualReviewStats />
        </Suspense>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 font-semibold text-xl">Review Queue</h2>
        <div className="py-8 text-center text-gray-500">
          No pending reviews at this time.
        </div>
      </div>
    </div>
  );
}
