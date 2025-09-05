'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '~/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error in analytics (non-PII)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="w-16 h-16 mb-4 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h3 className="text-lg font-medium text-white mb-2">
            حدث خطأ غير متوقع
          </h3>
          
          <p className="text-sm text-white/60 mb-6 max-w-sm">
            عذراً، حدث خطأ في تحميل هذا القسم. يرجى المحاولة مرة أخرى.
          </p>
          
          <div className="flex gap-3">
            <Button
              onClick={this.handleRetry}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              حاول مرة أخرى
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-white/20 text-white hover:bg-white/10"
            >
              إعادة تحميل الصفحة
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-black/20 rounded-lg text-left max-w-md">
              <summary className="text-sm text-white/80 cursor-pointer mb-2">
                تفاصيل الخطأ (وضع التطوير)
              </summary>
              <pre className="text-xs text-red-300 whitespace-pre-wrap">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
