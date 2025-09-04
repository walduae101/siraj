"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function CheckoutStartPage() {
  const searchParams = useSearchParams();
  const sku = searchParams.get('sku');
  const qty = searchParams.get('qty') || '1';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleStartCheckout = async () => {
    if (!sku) {
      setError('No SKU provided');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku,
          qty: parseInt(qty),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the checkout URL
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Start Checkout
            </CardTitle>
            <CardDescription className="text-gray-600">
              Complete your purchase securely
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {sku && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Product:</span>
                  <span className="text-sm text-gray-900">{sku}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <span className="text-sm text-gray-900">{qty}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button 
                onClick={handleStartCheckout}
                disabled={isLoading || !sku}
                className="w-full" 
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                asChild
              >
                <a href="/pricing">
                  Back to Pricing
                </a>
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>🔒 Secure checkout powered by PayNow</p>
              <p className="mt-1">
                Need help? <a href="/support" className="text-blue-600 hover:underline">Contact support</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
