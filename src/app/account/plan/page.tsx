'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Crown, Users, Calendar, CreditCard, Download } from 'lucide-react';
import Link from 'next/link';

interface Entitlement {
  id: string;
  plan: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string;
  receiptUrl?: string;
}

export default function AccountPlanPage() {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's entitlement and payment history from API
    // For now, simulate data
    setEntitlement({
      id: 'ent_123',
      plan: 'free',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
    });

    setPayments([
      {
        id: 'pay_123',
        amount: 29.99,
        currency: 'USD',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        description: 'Pro Plan - Monthly',
        receiptUrl: '/receipts/pay_123.pdf',
      },
      {
        id: 'pay_122',
        amount: 9.99,
        currency: 'USD',
        status: 'completed',
        createdAt: '2024-01-01T10:30:00Z',
        description: 'Points Top-up - 1000 points',
        receiptUrl: '/receipts/pay_122.pdf',
      },
    ]);

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const planInfo = {
    free: { name: 'Free', icon: <Crown className="h-5 w-5" />, color: 'bg-gray-500' },
    pro: { name: 'Pro', icon: <Crown className="h-5 w-5" />, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    org: { name: 'Organization', icon: <Users className="h-5 w-5" />, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  };

  const currentPlan = planInfo[entitlement?.plan as keyof typeof planInfo] || planInfo.free;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Account Plan</h1>
        <Button asChild>
          <Link href="/pricing">
            Upgrade Plan
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${currentPlan.color} text-white`}>
                  {currentPlan.icon}
                </div>
                {currentPlan.name} Plan
              </CardTitle>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={entitlement?.status === 'active' ? 'default' : 'secondary'}>
                    {entitlement?.status || 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Started</p>
                  <p className="font-medium">
                    {entitlement?.createdAt ? new Date(entitlement.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {entitlement?.expiresAt && (
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className="font-medium">
                    {new Date(entitlement.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm">
                  Cancel Subscription
                </Button>
                <Button variant="outline" size="sm">
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>
                What's included in your {currentPlan.name} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entitlement?.plan === 'free' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">10 AI generations/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">5 CSV exports/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">2 PDF exports/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">100 API calls/day</span>
                    </div>
                  </>
                )}
                {entitlement?.plan === 'pro' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">1000 AI generations/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">100 CSV exports/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">50 PDF exports/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">10,000 API calls/day</span>
                    </div>
                  </>
                )}
                {entitlement?.plan === 'org' && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">10,000 AI generations/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">1000 CSV exports/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">500 PDF exports/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">100,000 API calls/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">Team collaboration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View and download your payment receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>
                        {payment.currency} {payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.receiptUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={payment.receiptUrl}>
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}