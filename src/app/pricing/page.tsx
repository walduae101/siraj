import { Metadata } from "next";
import { Check, Star } from "lucide-react";
import { planService } from "~/server/models/plans";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export const metadata: Metadata = {
  title: "Pricing - Siraj",
  description: "Choose the perfect plan for your Arabic AI needs",
};

export default async function PricingPage() {
  // TODO: Replace with real data from Firestore
  // const plans = await planService.getAllActive();
  
  // Mock data for now
  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      interval: 'monthly' as const,
      features: [
        '20 AI generations per day',
        '5 CSV exports per day',
        '100 API calls per day',
        'Basic support'
      ],
      sku: 'FREE_PLAN',
      isActive: true,
    },
    {
      id: 'pro_monthly',
      name: 'Pro Monthly',
      description: 'For power users and small teams',
      price: 29.99,
      interval: 'monthly' as const,
      features: [
        '500 AI generations per day',
        '50 CSV exports per day',
        '5,000 API calls per day',
        'Priority support',
        'Advanced analytics',
        'Custom templates'
      ],
      sku: 'PRO_MONTHLY',
      isActive: true,
    },
    {
      id: 'pro_yearly',
      name: 'Pro Yearly',
      description: 'Best value for power users',
      price: 299.99,
      interval: 'yearly' as const,
      features: [
        '500 AI generations per day',
        '50 CSV exports per day',
        '5,000 API calls per day',
        'Priority support',
        'Advanced analytics',
        'Custom templates',
        '2 months free'
      ],
      sku: 'PRO_YEARLY',
      isActive: true,
    },
    {
      id: 'org_monthly',
      name: 'Organization Monthly',
      description: 'For teams and businesses',
      price: 99.99,
      interval: 'monthly' as const,
      features: [
        '2,000 AI generations per day',
        '200 CSV exports per day',
        '25,000 API calls per day',
        'Team collaboration',
        'Admin dashboard',
        'SSO integration',
        'Dedicated support'
      ],
      sku: 'ORG_MONTHLY',
      isActive: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the plan that fits your needs. All plans include our core Arabic AI features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.id === 'pro_yearly' 
                ? 'ring-2 ring-blue-500 scale-105' 
                : ''
            }`}
          >
            {plan.id === 'pro_yearly' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-gray-600">
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center">
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-600">/{plan.interval}</span>
                )}
                {plan.price === 0 && (
                  <span className="text-gray-600">/month</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full"
                variant={plan.id === 'pro_yearly' ? 'default' : 'outline'}
                size="lg"
                asChild
              >
                {plan.price === 0 ? (
                  <a href="/auth/signup">Get Started Free</a>
                ) : (
                  <a href={`/checkout/start?sku=${plan.sku}&qty=1`}>
                    Choose {plan.name}
                  </a>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Need a custom plan?
        </h2>
        <p className="text-gray-600 mb-6">
          Contact us for enterprise solutions and custom integrations.
        </p>
        <Button variant="outline" size="lg" asChild>
          <a href="mailto:sales@siraj.ai">Contact Sales</a>
        </Button>
      </div>

      <div className="mt-16 text-center text-sm text-gray-500">
        <p>All prices are in USD. Plans automatically renew unless cancelled.</p>
        <p className="mt-2">
          <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
          {" • "}
          <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
