export type EventName =
  | 'login'
  | 'plan_upgrade'
  | 'api_key_created'
  | 'api_call_success'
  | 'onboarding_complete'
  | 'support.ticket_created'
  | 'feature_used'
  | 'page_view'
  | 'user_signup'
  | 'subscription_created'
  | 'payment_completed'
  | 'api_key_rotated'
  | 'api_key_revoked'
  | 'rate_limit_exceeded'
  | 'error_occurred';

export interface AnalyticsEvent {
  type: EventName;
  uid?: string | null;
  keyId?: string | null;
  orgId?: string | null;
  meta?: Record<string, any>;
  ts?: number; // epoch ms
  // privacy flags
  dnt?: boolean;        // do-not-track (browser)
  consent?: boolean;    // user consent
  // additional context
  userAgent?: string;
  ip?: string;
  referrer?: string;
  page?: string;
}

export interface AnalyticsEventWithContext extends AnalyticsEvent {
  // Server-enriched fields
  sessionId?: string;
  requestId?: string;
  environment?: 'development' | 'staging' | 'production';
  version?: string;
}

// Event-specific metadata schemas
export interface LoginEventMeta {
  method: 'email' | 'google' | 'github' | 'sso';
  isFirstTime?: boolean;
  userType?: 'individual' | 'organization';
}

export interface PlanUpgradeEventMeta {
  fromPlan: string;
  toPlan: string;
  amount?: number;
  currency?: string;
  billingInterval?: 'monthly' | 'yearly';
}

export interface ApiKeyCreatedEventMeta {
  keyId: string;
  name?: string;
  permissions: string[];
  plan: string;
}

export interface ApiCallSuccessEventMeta {
  endpoint: string;
  method: string;
  responseTime?: number;
  keyId: string;
  plan: string;
  rateLimitRemaining?: number;
}

export interface OnboardingCompleteEventMeta {
  timeToComplete?: number; // seconds
  stepsCompleted: string[];
  skippedSteps?: string[];
}

export interface SupportTicketCreatedEventMeta {
  ticketId: string;
  severity: 'low' | 'med' | 'high' | 'urgent';
  subject: string;
  hasUser?: boolean;
}

export interface FeatureUsedEventMeta {
  feature: string;
  context?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export interface ErrorOccurredEventMeta {
  error: string;
  endpoint?: string;
  statusCode?: number;
  userAgent?: string;
  stack?: string;
}

// Type-safe event creators
export function createLoginEvent(
  uid: string,
  meta: LoginEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'login',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createPlanUpgradeEvent(
  uid: string,
  meta: PlanUpgradeEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'plan_upgrade',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createApiKeyCreatedEvent(
  uid: string,
  meta: ApiKeyCreatedEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'api_key_created',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createApiCallSuccessEvent(
  uid: string,
  keyId: string,
  meta: ApiCallSuccessEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'api_call_success',
    uid,
    keyId,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createOnboardingCompleteEvent(
  uid: string,
  meta: OnboardingCompleteEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'onboarding_complete',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createSupportTicketCreatedEvent(
  uid: string | null,
  meta: SupportTicketCreatedEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'support.ticket_created',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createFeatureUsedEvent(
  uid: string,
  meta: FeatureUsedEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'feature_used',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}

export function createErrorOccurredEvent(
  uid: string | null,
  meta: ErrorOccurredEventMeta,
  options?: { dnt?: boolean; consent?: boolean }
): AnalyticsEvent {
  return {
    type: 'error_occurred',
    uid,
    meta,
    ts: Date.now(),
    dnt: options?.dnt,
    consent: options?.consent,
  };
}
