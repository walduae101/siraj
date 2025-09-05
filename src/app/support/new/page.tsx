'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Mail, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function SupportNewPage() {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    description: '',
    severity: 'low' as 'low' | 'med' | 'high' | 'urgent',
  });
  
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    ticketId?: string;
  }>({ type: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading' });

    try {
      const response = await fetch('/api/support/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        setStatus({
          type: 'success',
          message: 'Your support request has been submitted successfully!',
          ticketId: result.ticketId,
        });
        
        // Reset form
        setFormData({
          email: '',
          subject: '',
          description: '',
          severity: 'low',
        });
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'med': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <MessageSquare className="w-4 h-4" />;
      case 'med': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'urgent': return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (status.type === 'success') {
    return (
      <main className="container mx-auto py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Support Request Submitted!</CardTitle>
            <CardDescription className="text-green-700">
              We've received your request and will get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Ticket ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                  {status.ticketId}
                </code>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Priority:</span>
                <Badge className={getSeverityColor(formData.severity)}>
                  {getSeverityIcon(formData.severity)}
                  <span className="ml-1 capitalize">{formData.severity}</span>
                </Badge>
              </div>
            </div>
            
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                We've sent a confirmation email to <strong>{formData.email}</strong> with your ticket details.
                Please check your inbox (and spam folder).
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-gray-600">
              <h4 className="font-medium text-gray-800">What happens next?</h4>
              <ul className="space-y-1 ml-4">
                <li>• Our support team will review your request within 24 hours</li>
                <li>• You'll receive updates via email as we work on your issue</li>
                <li>• For urgent issues, we'll prioritize your request</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href="/support/new">Submit Another Request</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Support</h1>
        <p className="text-muted-foreground">
          Describe your issue and we'll get back to you as soon as possible.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Support Request</CardTitle>
          <CardDescription>
            Please provide as much detail as possible to help us assist you quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={status.type === 'loading'}
              />
              <p className="text-xs text-muted-foreground">
                We'll send updates about your request to this email address.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject *
              </label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
                disabled={status.type === 'loading'}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="severity" className="text-sm font-medium">
                Priority Level
              </label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleInputChange('severity', value)}
                disabled={status.type === 'loading'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>Low - General question or minor issue</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="med">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Medium - Feature request or moderate issue</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>High - Important issue affecting functionality</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Urgent - Critical issue blocking usage</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description *
              </label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                disabled={status.type === 'loading'}
              />
              <p className="text-xs text-muted-foreground">
                Include error messages, browser information, or any other relevant details.
              </p>
            </div>

            {status.type === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={status.type === 'loading'}
            >
              {status.type === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Support Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Need immediate assistance? Check our{' '}
          <Link href="/docs/api" className="text-blue-600 hover:underline">
            API documentation
          </Link>{' '}
          or{' '}
          <Link href="/faq" className="text-blue-600 hover:underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
