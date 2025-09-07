"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface CheckoutSuccessResponse {
  ok: boolean;
  entitlementId: string;
  message?: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [entitlementId, setEntitlementId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!ref) {
      setError('No reference provided');
      setStatus('error');
      return;
    }

    const completeCheckout = async () => {
      try {
        const response = await fetch(`/api/checkout/complete?ref=${ref}`);
        const data: CheckoutSuccessResponse = await response.json();

        if (data.ok) {
          setEntitlementId(data.entitlementId);
          setStatus('success');
        } else {
          setError(data.message || 'Checkout completion failed');
          setStatus('error');
        }
      } catch (err) {
        setError('Failed to complete checkout');
        setStatus('error');
      }
    };

    completeCheckout();
  }, [ref]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Completing your purchase...
          </h1>
          <p className="text-gray-600">
            Please wait while we finalize your subscription.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Button asChild>
              <a href="/pricing">Try Again</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/support">Contact Support</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Siraj Pro! 🎉
        </h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Your subscription is active</CardTitle>
            <CardDescription>
              You now have access to all Pro features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Entitlement ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {entitlementId.slice(0, 8)}...
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <a href="/dashboard">
              Go to Dashboard
            </a>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <a href="/account/plan">
              Manage Subscription
            </a>
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>You'll receive a confirmation email shortly.</p>
          <p className="mt-2">
            Need help? <a href="/support" className="text-blue-600 hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

