'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Coins, Zap, Plus } from 'lucide-react';
import Link from 'next/link';

interface PointsBalance {
  current: number;
  totalEarned: number;
  totalSpent: number;
}

interface PointsPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  currency: string;
  popular?: boolean;
}

export default function AccountPointsPage() {
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [packages, setPackages] = useState<PointsPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's points balance and available packages from API
    // For now, simulate data
    setBalance({
      current: 250,
      totalEarned: 1000,
      totalSpent: 750,
    });

    setPackages([
      {
        id: 'points_100',
        name: 'Starter Pack',
        points: 100,
        price: 4.99,
        currency: 'USD',
      },
      {
        id: 'points_500',
        name: 'Popular Pack',
        points: 500,
        price: 19.99,
        currency: 'USD',
        popular: true,
      },
      {
        id: 'points_1000',
        name: 'Value Pack',
        points: 1000,
        price: 34.99,
        currency: 'USD',
      },
      {
        id: 'points_2500',
        name: 'Pro Pack',
        points: 2500,
        price: 79.99,
        currency: 'USD',
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

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Points Balance</h1>
        <Button asChild>
          <Link href="/pricing">
            View All Plans
          </Link>
        </Button>
      </div>

      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
            Current Balance
          </CardTitle>
          <CardDescription>
            Your points can be used for premium features and AI generations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600">
                {balance?.current || 0}
              </div>
              <p className="text-sm text-gray-500">Available Points</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {balance?.totalEarned || 0}
              </div>
              <p className="text-sm text-gray-500">Total Earned</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {balance?.totalSpent || 0}
              </div>
              <p className="text-sm text-gray-500">Total Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            How to Use Points
          </CardTitle>
          <CardDescription>
            Points can be used for various premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">AI Generation</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Text generation: 1 point per 100 words</li>
                <li>• Image generation: 5 points per image</li>
                <li>• Code generation: 2 points per function</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Export Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CSV export: 2 points per export</li>
                <li>• PDF generation: 5 points per document</li>
                <li>• Bulk operations: 10 points per batch</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top-up Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Buy More Points
          </CardTitle>
          <CardDescription>
            Choose a points package that fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-yellow-600">
                    {pkg.points}
                  </div>
                  <p className="text-sm text-gray-500">points</p>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-2xl font-semibold">
                    {pkg.currency} {pkg.price.toFixed(2)}
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/checkout/start?sku=${pkg.id}`}>
                      Buy Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent points transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">AI Generation</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <Badge variant="destructive">-5 points</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Points Purchase</p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
              <Badge variant="default">+500 points</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">PDF Export</p>
                <p className="text-sm text-gray-500">2 days ago</p>
              </div>
              <Badge variant="destructive">-5 points</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}