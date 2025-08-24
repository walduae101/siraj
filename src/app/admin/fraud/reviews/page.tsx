import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { ManualReviewsList } from "./manual-reviews-list";
import { ManualReviewStats } from "./manual-review-stats";

export default async function ManualReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/");
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

      <Suspense fallback={<div>Loading reviews...</div>}>
        <ManualReviewsList />
      </Suspense>
    </div>
  );
}
