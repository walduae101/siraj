export type AnalyticEvent =
  | 'login'
  | 'signup'
  | 'plan_upgrade'
  | 'api_key_created'
  | 'api_call_success'
  | 'onboarding_complete'
  | 'onboarding_item_done'
  | 'invoice_generated'
  | 'payment_failed'
  | 'page_view'
  | 'feature_used'
  | 'support.ticket_created'
  | 'user_signup'
  | 'subscription_created'
  | 'payment_completed'
  | 'api_key_rotated'
  | 'api_key_revoked'
  | 'rate_limit_exceeded'
  | 'error_occurred';

export interface AnalyticsProperties {
  [key: string]: any;
}

export interface TrackOptions {
  dnt?: boolean;
  consent?: boolean;
  uid?: string;
  keyId?: string;
  orgId?: string;
}

export async function track(
  evt: AnalyticEvent, 
  props: AnalyticsProperties = {}, 
  options?: TrackOptions
): Promise<void> {
  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ANALYTICS]', evt, props, options);
  }

  try {
    // Check for Do Not Track header
    const dnt = options?.dnt || (typeof navigator !== 'undefined' && navigator.doNotTrack === '1');
    
    // Check for user consent (you can implement your own consent logic)
    const consent = options?.consent ?? true; // Default to true, implement consent management

    // Use absolute URL for server-side fetch
    const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/analytics/track`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: evt,
        meta: props,
        uid: options?.uid,
        keyId: options?.keyId,
        orgId: options?.orgId,
        dnt,
        consent,
        ts: Date.now(),
      })
    });
  } catch (error) {
    // Silently fail - analytics should never break the user experience
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Analytics tracking failed:', error);
    }
  }
}

// Convenience functions for common events
export async function trackLogin(uid: string, method: string = 'email', options?: TrackOptions): Promise<void> {
  return track('login', { method, isFirstTime: false }, { ...options, uid });
}

export async function trackSignup(uid: string, email: string, options?: TrackOptions): Promise<void> {
  return track('signup', { email }, { ...options, uid });
}

export async function trackPlanUpgrade(uid: string, fromPlan: string, toPlan: string, amount?: number, options?: TrackOptions): Promise<void> {
  return track('plan_upgrade', { fromPlan, toPlan, amount }, { ...options, uid });
}

export async function trackApiKeyCreated(uid: string, keyId: string, name?: string, options?: TrackOptions): Promise<void> {
  return track('api_key_created', { keyId, name }, { ...options, uid, keyId });
}

export async function trackApiCallSuccess(uid: string, keyId: string, endpoint: string, responseTime?: number, options?: TrackOptions): Promise<void> {
  return track('api_call_success', { endpoint, responseTime }, { ...options, uid, keyId });
}

export async function trackOnboardingComplete(uid: string, timeToComplete?: number, options?: TrackOptions): Promise<void> {
  return track('onboarding_complete', { timeToComplete }, { ...options, uid });
}

export async function trackOnboardingItemDone(uid: string, item: string, options?: TrackOptions): Promise<void> {
  return track('onboarding_item_done', { item }, { ...options, uid });
}

export async function trackInvoiceGenerated(uid: string, invoiceId: string, amount: number, options?: TrackOptions): Promise<void> {
  return track('invoice_generated', { invoiceId, amount }, { ...options, uid });
}

export async function trackPaymentFailed(uid: string, invoiceId: string, reason: string, options?: TrackOptions): Promise<void> {
  return track('payment_failed', { invoiceId, reason }, { ...options, uid });
}

export async function trackPageView(path: string, uid?: string, options?: TrackOptions): Promise<void> {
  return track('page_view', { path }, { ...options, uid });
}

export async function trackFeatureUsed(feature: string, uid: string, context?: string, value?: number, metadata?: Record<string, any>, options?: TrackOptions): Promise<void> {
  return track('feature_used', { feature, context, value, ...metadata }, { ...options, uid });
}

export async function trackSupportTicketCreated(uid: string | null, ticketId: string, severity: string, options?: TrackOptions): Promise<void> {
  return track('support.ticket_created', { ticketId, severity }, { ...options, uid });
}

export async function trackError(uid: string | null, error: string, endpoint?: string, statusCode?: number, options?: TrackOptions): Promise<void> {
  return track('error_occurred', { error, endpoint, statusCode }, { ...options, uid });
}
