interface CrmEvent {
  type: string;
  uid: string;
  meta?: Record<string, any>;
  ts?: number;
}

export async function emitCrm(evt: CrmEvent): Promise<boolean> {
  const payload = { ...evt, ts: Date.now() };
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CRM]', JSON.stringify(payload, null, 2));
    return true;
  }
  
  // TODO: In production, push to Pub/Sub or call HubSpot/Intercom
  // Example:
  // await pubsub.topic('crm-events').publish(Buffer.from(JSON.stringify(payload)));
  // or
  // await hubspotClient.events.track(evt.type, { userId: evt.uid, ...evt.meta });
  
  return true;
}

// Convenience functions for common events
export async function emitUserSignup(uid: string, email: string): Promise<void> {
  await emitCrm({
    type: 'user.signup',
    uid,
    meta: { email },
  });
}

export async function emitUserLogin(uid: string, method: string = 'email'): Promise<void> {
  await emitCrm({
    type: 'user.login',
    uid,
    meta: { method },
  });
}

export async function emitApiKeyCreated(uid: string, keyId: string): Promise<void> {
  await emitCrm({
    type: 'api_key.created',
    uid,
    meta: { keyId },
  });
}

export async function emitFirstApiCall(uid: string, endpoint: string): Promise<void> {
  await emitCrm({
    type: 'api.first_call',
    uid,
    meta: { endpoint },
  });
}

export async function emitPlanUpgrade(uid: string, plan: string, amount?: number): Promise<void> {
  await emitCrm({
    type: 'plan.upgraded',
    uid,
    meta: { plan, amount },
  });
}

export async function emitOnboardingItemDone(uid: string, item: string): Promise<void> {
  await emitCrm({
    type: 'onboarding.item_done',
    uid,
    meta: { item },
  });
}

export async function emitOnboardingComplete(uid: string): Promise<void> {
  await emitCrm({
    type: 'onboarding.completed',
    uid,
  });
}

export async function emitInvoiceGenerated(uid: string, invoiceId: string, amount: number): Promise<void> {
  await emitCrm({
    type: 'invoice.generated',
    uid,
    meta: { invoiceId, amount },
  });
}

export async function emitPaymentFailed(uid: string, invoiceId: string, reason: string): Promise<void> {
  await emitCrm({
    type: 'payment.failed',
    uid,
    meta: { invoiceId, reason },
  });
}
