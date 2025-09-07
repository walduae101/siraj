'use client';

import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Lock, Zap, Users, Crown } from 'lucide-react';
import Link from 'next/link';

interface PaywallGateProps {
  children: React.ReactNode;
  feature?: string;
  plan?: 'pro' | 'org';
  fallback?: React.ReactNode;
  className?: string;
}

interface UserPlan {
  plan: string;
  status: string;
  features: string[];
}

const FEATURE_DESCRIPTIONS: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  'ai.generate': {
    title: 'AI Generation',
    description: 'Generate content with advanced AI models',
    icon: <Zap className="h-5 w-5" />,
  },
  'export.csv': {
    title: 'CSV Export',
    description: 'Export your data in CSV format',
    icon: <Lock className="h-5 w-5" />,
  },
  'export.pdf': {
    title: 'PDF Export',
    description: 'Generate professional PDF reports',
    icon: <Lock className="h-5 w-5" />,
  },
  'api.calls': {
    title: 'API Access',
    description: 'Make programmatic API calls',
    icon: <Lock className="h-5 w-5" />,
  },
};

const PLAN_FEATURES = {
  pro: {
    name: 'Pro',
    icon: <Crown className="h-5 w-5" />,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  org: {
    name: 'Organization',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
};

export function PaywallGate({ 
  children, 
  feature, 
  plan = 'pro', 
  fallback,
  className = '' 
}: PaywallGateProps) {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user's current plan from API
    // For now, simulate free plan
    setUserPlan({
      plan: 'free',
      status: 'active',
      features: [],
    });
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />;
  }

  const isEntitled = userPlan?.plan === plan || userPlan?.plan === 'org';
  const featureInfo = feature ? FEATURE_DESCRIPTIONS[feature] : null;
  const planInfo = PLAN_FEATURES[plan];

  if (isEntitled) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className}>
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full ${planInfo.color} flex items-center justify-center text-white mb-4`}>
            {planInfo.icon}
          </div>
          <CardTitle className="text-lg">
            {featureInfo ? featureInfo.title : `${planInfo.name} Feature`}
          </CardTitle>
          <CardDescription>
            {featureInfo ? featureInfo.description : `This feature requires a ${planInfo.name} subscription`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-sm">
              Current: {userPlan?.plan || 'Free'}
            </Badge>
            <span className="text-gray-400">→</span>
            <Badge className={`${planInfo.color} text-white`}>
              {planInfo.name}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/pricing">
                Upgrade to {planInfo.name}
              </Link>
            </Button>
            <p className="text-xs text-gray-500">
              Unlock unlimited access to all features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}