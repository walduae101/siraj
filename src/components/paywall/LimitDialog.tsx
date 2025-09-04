'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';
import { AlertTriangle, Zap, Users, Crown } from 'lucide-react';
import Link from 'next/link';

interface LimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: {
    feature: string;
    used: number;
    limit: number;
    remaining: number;
    upgradeUrl: string;
  };
}

const FEATURE_INFO: Record<string, { 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  recommendedPlan: 'pro' | 'org';
}> = {
  'ai.generate': {
    title: 'AI Generation Limit Reached',
    description: 'You\'ve used all your AI generation credits for today',
    icon: <Zap className="h-6 w-6" />,
    recommendedPlan: 'pro',
  },
  'export.csv': {
    title: 'CSV Export Limit Reached',
    description: 'You\'ve reached your daily CSV export limit',
    icon: <AlertTriangle className="h-6 w-6" />,
    recommendedPlan: 'pro',
  },
  'export.pdf': {
    title: 'PDF Export Limit Reached',
    description: 'You\'ve reached your daily PDF export limit',
    icon: <AlertTriangle className="h-6 w-6" />,
    recommendedPlan: 'pro',
  },
  'api.calls': {
    title: 'API Limit Reached',
    description: 'You\'ve exceeded your API call limit',
    icon: <AlertTriangle className="h-6 w-6" />,
    recommendedPlan: 'org',
  },
};

const PLAN_INFO = {
  pro: {
    name: 'Pro',
    icon: <Crown className="h-5 w-5" />,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    benefits: ['1000 AI generations/day', '100 CSV exports/day', '50 PDF exports/day', '10,000 API calls/day'],
  },
  org: {
    name: 'Organization',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    benefits: ['10,000 AI generations/day', '1000 CSV exports/day', '500 PDF exports/day', '100,000 API calls/day'],
  },
};

export function LimitDialog({ open, onOpenChange, error }: LimitDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !error) {
    return null;
  }

  const featureInfo = FEATURE_INFO[error.feature] || {
    title: 'Usage Limit Reached',
    description: 'You\'ve reached your limit for this feature',
    icon: <AlertTriangle className="h-6 w-6" />,
    recommendedPlan: 'pro' as const,
  };

  const planInfo = PLAN_INFO[featureInfo.recommendedPlan];
  const usagePercentage = (error.used / error.limit) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              {featureInfo.icon}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {featureInfo.title}
              </DialogTitle>
              <DialogDescription>
                {featureInfo.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Usage Stats */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Usage Today</span>
              <span className="font-medium">
                {error.used} / {error.limit}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="text-center text-sm text-gray-500">
              {error.remaining} remaining
            </div>
          </div>

          {/* Upgrade Recommendation */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1 rounded ${planInfo.color} text-white`}>
                {planInfo.icon}
              </div>
              <span className="font-medium">Upgrade to {planInfo.name}</span>
            </div>
            
            <ul className="space-y-1 text-sm text-gray-600">
              {planInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button asChild className="flex-1">
              <Link href="/pricing">
                Upgrade Now
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}