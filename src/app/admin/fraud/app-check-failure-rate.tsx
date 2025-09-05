"use client";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

export function AppCheckFailureRate() {
  const { data: appCheckStats, isLoading } =
    api.fraud.admin.stats.appCheck.useQuery({}, { refetchInterval: 30000 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>App Check Failure Rate</CardTitle>
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

  const stats = appCheckStats || {
    totalRequests: 0,
    failedRequests: 0,
    failureRate: 0,
    last24h: {
      total: 0,
      failed: 0,
      rate: 0,
    },
  };

  const getFailureRateColor = (rate: number) => {
    if (rate <= 1) return "text-green-600";
    if (rate <= 5) return "text-yellow-600";
    if (rate <= 10) return "text-orange-600";
    return "text-red-600";
  };

  const getFailureRateBadge = (rate: number) => {
    if (rate <= 1) return "bg-green-100 text-green-800";
    if (rate <= 5) return "bg-yellow-100 text-yellow-800";
    if (rate <= 10) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Check Failure Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">Overall (30 days)</span>
            <Badge className={getFailureRateBadge(stats.failureRate)}>
              {stats.failureRate.toFixed(2)}%
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Requests:</span>
              <span className="font-medium">
                {stats.totalRequests.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Failed Requests:</span>
              <span className="font-medium text-red-600">
                {stats.failedRequests.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Last 24 Hours</span>
              <Badge className={getFailureRateBadge(stats.last24h.rate)}>
                {stats.last24h.rate.toFixed(2)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Total:</span>
                <span>{stats.last24h.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Failed:</span>
                <span className="text-red-600">
                  {stats.last24h.failed.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-1 text-gray-500 text-xs">
              <div>
                • <span className="text-green-600">≤1%</span>: Normal operation
              </div>
              <div>
                • <span className="text-yellow-600">1-5%</span>: Monitor closely
              </div>
              <div>
                • <span className="text-orange-600">5-10%</span>: Investigate
              </div>
              <div>
                • <span className="text-red-600">&gt;10%</span>: Critical issue
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

