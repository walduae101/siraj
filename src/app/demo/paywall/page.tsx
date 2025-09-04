'use client';

import { useState } from 'react';
import { PaywallGate } from '~/components/paywall/PaywallGate';
import { LimitDialog } from '~/components/paywall/LimitDialog';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Zap, Download, FileText, Code } from 'lucide-react';

export default function PaywallDemoPage() {
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [limitError, setLimitError] = useState<any>(null);

  const simulateLimitError = () => {
    setLimitError({
      feature: 'ai.generate',
      used: 10,
      limit: 10,
      remaining: 0,
      upgradeUrl: '/pricing',
    });
    setLimitDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Paywall Gates Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This page demonstrates how paywall gates work for different features and plans.
          Try the buttons below to see the upgrade prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Generation Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI Generation
            </CardTitle>
            <CardDescription>
              Generate content with advanced AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaywallGate feature="ai.generate" plan="pro">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <p className="text-sm text-green-800">
                    ✅ You have access to AI generation features!
                  </p>
                </div>
                <Button className="w-full">
                  Generate AI Content
                </Button>
              </div>
            </PaywallGate>
          </CardContent>
        </Card>

        {/* CSV Export Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              CSV Export
            </CardTitle>
            <CardDescription>
              Export your data in CSV format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaywallGate feature="export.csv" plan="pro">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <p className="text-sm text-green-800">
                    ✅ You can export CSV files!
                  </p>
                </div>
                <Button className="w-full">
                  Export as CSV
                </Button>
              </div>
            </PaywallGate>
          </CardContent>
        </Card>

        {/* PDF Export Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Export
            </CardTitle>
            <CardDescription>
              Generate professional PDF reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaywallGate feature="export.pdf" plan="pro">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <p className="text-sm text-green-800">
                    ✅ You can generate PDF reports!
                  </p>
                </div>
                <Button className="w-full">
                  Generate PDF
                </Button>
              </div>
            </PaywallGate>
          </CardContent>
        </Card>

        {/* API Access Feature */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Make programmatic API calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaywallGate feature="api.calls" plan="org">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50">
                  <p className="text-sm text-green-800">
                    ✅ You have API access!
                  </p>
                </div>
                <Button className="w-full">
                  Make API Call
                </Button>
              </div>
            </PaywallGate>
          </CardContent>
        </Card>
      </div>

      {/* Limit Dialog Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Limit Dialog Demo</CardTitle>
          <CardDescription>
            Simulate hitting a usage limit to see the upgrade dialog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={simulateLimitError} variant="outline">
                Simulate AI Limit Reached
              </Button>
              <Button 
                onClick={() => {
                  setLimitError({
                    feature: 'export.csv',
                    used: 5,
                    limit: 5,
                    remaining: 0,
                    upgradeUrl: '/pricing',
                  });
                  setLimitDialogOpen(true);
                }} 
                variant="outline"
              >
                Simulate Export Limit
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Click the buttons above to see how the limit dialog appears when usage limits are exceeded.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline">Free Plan</Badge>
            <span className="text-sm text-gray-600">
              Upgrade to unlock all features above
            </span>
          </div>
        </CardContent>
      </Card>

      <LimitDialog 
        open={limitDialogOpen} 
        onOpenChange={setLimitDialogOpen}
        error={limitError}
      />
    </div>
  );
}
