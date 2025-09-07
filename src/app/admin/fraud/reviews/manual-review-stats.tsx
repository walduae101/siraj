"use client";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export function ManualReviewStats() {
  const { data: stats, isLoading } = api.fraud.admin.reviews.stats.useQuery(
    {},
    { refetchInterval: 30000 },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const reviewStats = stats || {
    pending: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
    inReview: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
    escalated: { "0-1": 0, "2-3": 0, "4-7": 0, ">7": 0 },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inReview":
        return "bg-blue-100 text-blue-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAgeColor = (age: string) => {
    switch (age) {
      case "0-1":
        return "text-green-600";
      case "2-3":
        return "text-yellow-600";
      case "4-7":
        return "text-orange-600";
      case ">7":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Age Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(reviewStats).map(([status, ageBuckets]) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <span className="text-gray-500 text-sm">
                  Total: {Object.values(ageBuckets).reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {Object.entries(ageBuckets).map(([age, count]) => (
                  <div key={age} className="text-center">
                    <div className={`font-medium ${getAgeColor(age)}`}>
                      {count}
                    </div>
                    <div className="text-gray-500">{age} days</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="space-y-1 text-gray-500 text-xs">
            <div>
              • <span className="text-green-600">0-1 days</span>: Normal
              processing time
            </div>
            <div>
              • <span className="text-yellow-600">2-3 days</span>: Requires
              attention
            </div>
            <div>
              • <span className="text-orange-600">4-7 days</span>: High priority
            </div>
            <div>
              • <span className="text-red-600">&gt;7 days</span>: Auto-escalated
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

