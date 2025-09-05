import { getServerUser } from '~/server/auth/getServerUser';
import { getChecklist } from '~/server/onboarding/service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { CheckCircle, Circle, ExternalLink, Key, Zap, Crown, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { OnboardingClient } from './OnboardingClient';

export const runtime = 'nodejs';

export default async function OnboardingPage() {
  const user = await getServerUser();
  
  if (!user) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">يرجى تسجيل الدخول / Please sign in</h1>
          <p className="text-muted-foreground">You need to be signed in to access the onboarding checklist.</p>
        </div>
      </main>
    );
  }

  const data = await getChecklist(user.uid);
  const items = data.items;
  const completedCount = Object.values(items).filter(item => item.done).length;
  const totalCount = Object.keys(items).length;
  const progress = (completedCount / totalCount) * 100;

  const checklistItems = [
    {
      key: 'create_api_key',
      label: 'Create an API key',
      description: 'Generate your first API key to start using the Siraj API',
      icon: Key,
      action: (
        <Link href="/account/api" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ExternalLink className="w-4 h-4" />
          Open API Keys
        </Link>
      ),
    },
    {
      key: 'call_ping',
      label: 'Make your first API call',
      description: 'Test your API key with a simple ping request',
      icon: Zap,
      action: (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          curl -H "x-api-key: ..." /api/ping
        </code>
      ),
    },
    {
      key: 'upgrade_plan',
      label: 'Upgrade to Pro',
      description: 'Unlock advanced features and higher rate limits',
      icon: Crown,
      action: (
        <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ExternalLink className="w-4 h-4" />
          View Plans
        </Link>
      ),
    },
    {
      key: 'invite_member',
      label: 'Invite a teammate',
      description: 'Create an organization and invite team members',
      icon: Users,
      action: (
        <Link href="/orgs/new" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <ExternalLink className="w-4 h-4" />
          Create Organization
        </Link>
      ),
    },
    {
      key: 'enable_2fa',
      label: 'Enable 2FA',
      description: 'Secure your account with two-factor authentication',
      icon: Shield,
      action: <span className="text-muted-foreground">Coming soon</span>,
    },
  ] as const;

  return (
    <main className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onboarding · الإعداد</h1>
        <p className="text-muted-foreground">
          Complete the steps below to get the most out of Siraj.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress Overview</span>
            <Badge variant="secondary">
              {completedCount} / {totalCount} completed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {progress === 100 
              ? '🎉 Congratulations! You\'ve completed the onboarding checklist!'
              : `${Math.round(progress)}% complete - keep going!`
            }
          </p>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {checklistItems.map((item) => {
          const isDone = items[item.key as keyof typeof items]?.done;
          const Icon = item.icon;
          
          return (
            <Card key={item.key} className={`transition-all duration-200 ${isDone ? 'bg-green-50 border-green-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${isDone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isDone ? 'text-green-800' : 'text-gray-900'}`}>
                        {item.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <div className="mt-3">
                        {item.action}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Done
                      </Badge>
                    ) : (
                      <OnboardingClient itemKey={item.key} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completion Message */}
      {progress === 100 && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Onboarding Complete!
            </h2>
            <p className="text-green-700 mb-4">
              You've successfully completed all onboarding steps. You're now ready to make the most of Siraj!
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/api">View API Docs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
