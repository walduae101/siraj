'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Key, 
  CheckCircle, 
  MessageSquare, 
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface AnalyticsData {
  event: string;
  count: number;
  last24h: number;
  last7d: number;
  trend: 'up' | 'down' | 'stable';
}

interface VendorStatus {
  mixpanel: { configured: boolean; reachable?: boolean };
  ga4: { configured: boolean; reachable?: boolean };
}

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([
    { event: 'login', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
    { event: 'api_key_created', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
    { event: 'api_call_success', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
    { event: 'onboarding_complete', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
    { event: 'support.ticket_created', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
    { event: 'plan_upgrade', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
    { event: 'feature_used', count: 0, last24h: 0, last7d: 0, trend: 'stable' },
  ]);

  const [vendorStatus, setVendorStatus] = useState<VendorStatus>({
    mixpanel: { configured: false, reachable: false },
    ga4: { configured: false, reachable: false },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Simulate data loading (in real implementation, this would fetch from your analytics warehouse)
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in production, this would come from your analytics warehouse
      const mockData: AnalyticsData[] = [
        { event: 'login', count: 1247, last24h: 89, last7d: 623, trend: 'up' },
        { event: 'api_key_created', count: 156, last24h: 12, last7d: 78, trend: 'up' },
        { event: 'api_call_success', count: 8943, last24h: 1247, last7d: 6234, trend: 'up' },
        { event: 'onboarding_complete', count: 89, last24h: 7, last7d: 45, trend: 'stable' },
        { event: 'support.ticket_created', count: 23, last24h: 3, last7d: 12, trend: 'down' },
        { event: 'plan_upgrade', count: 34, last24h: 2, last7d: 18, trend: 'up' },
        { event: 'feature_used', count: 2341, last24h: 189, last7d: 1234, trend: 'up' },
      ];
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, []);

  // Test vendor connectivity
  const testVendorConnectivity = async () => {
    try {
      const response = await fetch('/api/analytics/test-vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const status = await response.json();
        setVendorStatus(status);
      }
    } catch (error) {
      console.error('Failed to test vendor connectivity:', error);
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login': return <Users className="w-5 h-5" />;
      case 'api_key_created': return <Key className="w-5 h-5" />;
      case 'api_call_success': return <CheckCircle className="w-5 h-5" />;
      case 'onboarding_complete': return <TrendingUp className="w-5 h-5" />;
      case 'support.ticket_created': return <MessageSquare className="w-5 h-5" />;
      case 'plan_upgrade': return <Activity className="w-5 h-5" />;
      case 'feature_used': return <BarChart3 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const totalEvents = analyticsData.reduce((sum, item) => sum + item.count, 0);
  const totalLast24h = analyticsData.reduce((sum, item) => sum + item.last24h, 0);
  const totalLast7d = analyticsData.reduce((sum, item) => sum + item.last7d, 0);

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track user behavior, feature usage, and system performance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testVendorConnectivity}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Vendors
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : totalEvents.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 24h: {isLoading ? '...' : totalLast24h.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : '1,247'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {isLoading ? '...' : '623'}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Calls</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : '8,943'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 24h: {isLoading ? '...' : '1,247'}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Support Tickets</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : '23'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days: {isLoading ? '...' : '12'}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vendor Status</CardTitle>
          <CardDescription>
            Analytics vendor connectivity and configuration status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium">Mixpanel</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={vendorStatus.mixpanel.configured ? 'default' : 'secondary'}>
                  {vendorStatus.mixpanel.configured ? 'Configured' : 'Not Configured'}
                </Badge>
                {vendorStatus.mixpanel.configured && (
                  <Badge variant={vendorStatus.mixpanel.reachable ? 'default' : 'destructive'}>
                    {vendorStatus.mixpanel.reachable ? 'Reachable' : 'Unreachable'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Google Analytics 4</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={vendorStatus.ga4.configured ? 'default' : 'secondary'}>
                  {vendorStatus.ga4.configured ? 'Configured' : 'Not Configured'}
                </Badge>
                {vendorStatus.ga4.configured && (
                  <Badge variant={vendorStatus.ga4.reachable ? 'default' : 'destructive'}>
                    {vendorStatus.ga4.reachable ? 'Reachable' : 'Unreachable'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Event Analytics</CardTitle>
          <CardDescription>
            Track key user actions and system events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading analytics data...
            </div>
          ) : (
            <div className="space-y-4">
              {analyticsData.map((item) => (
                <div key={item.event} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="text-gray-600">
                      {getEventIcon(item.event)}
                    </div>
                    <div>
                      <div className="font-medium capitalize">
                        {item.event.replace('_', ' ').replace('.', ' ')}
                      </div>
                      {showDetails && (
                        <div className="text-sm text-muted-foreground">
                          Last 24h: {item.last24h} • Last 7d: {item.last7d}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{item.count.toLocaleString()}</div>
                      <div className={`text-sm flex items-center gap-1 ${getTrendColor(item.trend)}`}>
                        <span>{getTrendIcon(item.trend)}</span>
                        <span className="capitalize">{item.trend}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Development Note */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Development Mode</h4>
            <p className="text-sm text-yellow-700">
              This analytics dashboard shows mock data. In production, connect to your analytics warehouse 
              (BigQuery, Snowflake, etc.) or vendor APIs to display real-time data.
            </p>
            <div className="mt-2 text-xs text-yellow-600">
              <p>• Events are forwarded to Mixpanel/GA4 via server proxy</p>
              <p>• Vendor keys are stored securely in Google Secret Manager</p>
              <p>• Privacy controls (DNT, consent) are respected</p>
              <p>• No client-side vendor SDKs required</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
