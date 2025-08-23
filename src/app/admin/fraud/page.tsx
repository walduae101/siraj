"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HelpCircle,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

export default function FraudAdminPage() {
  const [selectedDays, setSelectedDays] = useState(1);

  // Fetch fraud statistics
  const { data: stats, isLoading: statsLoading } =
    api.fraud.admin.stats.decisions.useQuery(
      { days: selectedDays },
      { refetchInterval: 30000 }, // Refresh every 30 seconds
    );

  // Fetch recent decisions
  const { data: recentDecisions, isLoading: decisionsLoading } =
    api.fraud.admin.stats.recentDecisions.useQuery(
      { limit: 10 },
      { refetchInterval: 30000 },
    );

  const getActionColor = (action: string) => {
    switch (action) {
      case "allow":
        return "bg-green-100 text-green-800";
      case "challenge":
        return "bg-yellow-100 text-yellow-800";
      case "deny":
        return "bg-red-100 text-red-800";
      case "queue_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "allow":
        return <CheckCircle className="h-4 w-4" />;
      case "challenge":
        return <HelpCircle className="h-4 w-4" />;
      case "deny":
        return <XCircle className="h-4 w-4" />;
      case "queue_review":
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Fraud Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage fraud detection, risk decisions, and manual
            reviews
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/fraud/lists">Manage Lists</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/fraud/reviews">Manual Reviews</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="decisions">Recent Decisions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Decisions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {statsLoading ? "..." : stats?.total || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Last {selectedDays} day{selectedDays !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Average Score
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {statsLoading ? "..." : Math.round(stats?.avgScore || 0)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Risk score average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Denied</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-red-600">
                  {statsLoading ? "..." : stats?.byAction?.deny || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Checkouts blocked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">In Review</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-blue-600">
                  {statsLoading ? "..." : stats?.byAction?.queue_review || 0}
                </div>
                <p className="text-muted-foreground text-xs">Pending review</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Decision Distribution</CardTitle>
              <CardDescription>
                Breakdown of risk decisions by action type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats?.byAction &&
                  Object.entries(stats.byAction).map(([action, count]) => (
                    <div key={action} className="flex items-center space-x-2">
                      {getActionIcon(action)}
                      <div>
                        <div className="font-medium capitalize">
                          {action.replace("_", " ")}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {count} decisions
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common fraud management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/admin/fraud/lists">
                    <Shield className="mb-2 h-6 w-6" />
                    Manage Lists
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/admin/fraud/reviews">
                    <Clock className="mb-2 h-6 w-6" />
                    Manual Reviews
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col" asChild>
                  <Link href="/admin/fraud/settings">
                    <Activity className="mb-2 h-6 w-6" />
                    Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Risk Decisions</CardTitle>
              <CardDescription>
                Latest fraud risk evaluations and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decisionsLoading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : recentDecisions && recentDecisions.length > 0 ? (
                <div className="space-y-4">
                  {recentDecisions.map((decision: any) => (
                    <div
                      key={decision.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        {getActionIcon(decision.action)}
                        <div>
                          <div className="font-medium">
                            {decision.metadata?.uid?.substring(0, 8)}...
                          </div>
                          <div className="text-muted-foreground text-sm">
                            Score: {decision.score} | Confidence:{" "}
                            {decision.confidence}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getActionColor(decision.action)}>
                          {decision.action.replace("_", " ")}
                        </Badge>
                        <div className="text-muted-foreground text-sm">
                          {new Date(decision.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No recent decisions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Alerts</CardTitle>
              <CardDescription>
                Active alerts and suspicious activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-800">
                      High Denial Rate
                    </div>
                    <div className="text-sm text-yellow-700">
                      Denial rate has increased by 25% in the last hour
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800">
                      Suspicious IP Activity
                    </div>
                    <div className="text-red-700 text-sm">
                      IP 192.168.1.100 has made 50+ checkout attempts
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
