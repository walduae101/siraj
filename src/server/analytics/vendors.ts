import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import type { AnalyticsEvent } from './schema';

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  try {
    const [version] = await client.accessSecretVersion({ name });
    return version?.payload?.data?.toString('utf8') ?? '';
  } catch (error) {
    console.warn(`Failed to access secret ${name}:`, error);
    return '';
  }
}

// Vendor keys (optional; leave empty if not configured)
export async function vendorKeys() {
  try {
    const projectId = await client.getProjectId();
    
    async function read(key: string): Promise<string> {
      return getSecret(`projects/${projectId}/secrets/${key}/versions/latest`);
    }

    const [MIXPANEL_TOKEN, GA_MEASUREMENT_ID, GA_API_SECRET] = await Promise.all([
      read('MIXPANEL_TOKEN').catch(() => ''),
      read('GA_MEASUREMENT_ID').catch(() => ''),
      read('GA_API_SECRET').catch(() => ''),
    ]);

    return { MIXPANEL_TOKEN, GA_MEASUREMENT_ID, GA_API_SECRET };
  } catch (error) {
    console.warn('Failed to get vendor keys:', error);
    return { MIXPANEL_TOKEN: '', GA_MEASUREMENT_ID: '', GA_API_SECRET: '' };
  }
}

// Ship to Mixpanel (server)
export async function sendToMixpanel(evt: AnalyticsEvent, token: string): Promise<{ ok: boolean; status?: number; skipped?: boolean }> {
  if (!token) {
    return { ok: true, skipped: true };
  }

  try {
    const payload = [{
      event: evt.type,
      properties: {
        token,
        distinct_id: evt.uid || evt.keyId || 'anon',
        time: Math.floor((evt.ts || Date.now()) / 1000),
        $insert_id: `${evt.type}_${evt.ts || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...evt.meta,
        // Add context
        $os: 'Web',
        $browser: 'Siraj App',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      }
    }];

    const response = await fetch('https://api.mixpanel.com/track?ip=1', {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'user-agent': 'Siraj Analytics Server/1.0'
      },
      body: JSON.stringify(payload)
    });

    return { ok: response.ok, status: response.status };
  } catch (error) {
    console.error('Mixpanel send error:', error);
    return { ok: false, status: 0 };
  }
}

// Ship to GA4 Measurement Protocol (server)
export async function sendToGA(evt: AnalyticsEvent, measurementId: string, apiSecret: string): Promise<{ ok: boolean; status?: number; skipped?: boolean }> {
  if (!measurementId || !apiSecret) {
    return { ok: true, skipped: true };
  }

  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
    
    const body = {
      client_id: evt.uid || evt.keyId || 'anon.1',
      events: [{
        name: evt.type,
        params: {
          ...evt.meta,
          engagement_time_msec: 1,
          // Add context
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          timestamp_micros: (evt.ts || Date.now()) * 1000,
        }
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'content-type': 'application/json',
        'user-agent': 'Siraj Analytics Server/1.0'
      },
      body: JSON.stringify(body)
    });

    return { ok: response.ok, status: response.status };
  } catch (error) {
    console.error('GA4 send error:', error);
    return { ok: false, status: 0 };
  }
}

// Batch send to multiple vendors
export async function sendToVendors(evt: AnalyticsEvent): Promise<{
  mixpanel: { ok: boolean; status?: number; skipped?: boolean };
  ga4: { ok: boolean; status?: number; skipped?: boolean };
}> {
  const { MIXPANEL_TOKEN, GA_MEASUREMENT_ID, GA_API_SECRET } = await vendorKeys();

  const [mixpanel, ga4] = await Promise.all([
    sendToMixpanel(evt, MIXPANEL_TOKEN),
    sendToGA(evt, GA_MEASUREMENT_ID, GA_API_SECRET),
  ]);

  return { mixpanel, ga4 };
}

// Test vendor connectivity
export async function testVendorConnectivity(): Promise<{
  mixpanel: { configured: boolean; reachable?: boolean };
  ga4: { configured: boolean; reachable?: boolean };
}> {
  const { MIXPANEL_TOKEN, GA_MEASUREMENT_ID, GA_API_SECRET } = await vendorKeys();

  const testEvent: AnalyticsEvent = {
    type: 'login',
    uid: 'test_user',
    meta: { test: true },
    ts: Date.now(),
  };

  const results = {
    mixpanel: { configured: !!MIXPANEL_TOKEN, reachable: false },
    ga4: { configured: !!(GA_MEASUREMENT_ID && GA_API_SECRET), reachable: false },
  };

  // Test Mixpanel
  if (MIXPANEL_TOKEN) {
    try {
      const result = await sendToMixpanel(testEvent, MIXPANEL_TOKEN);
      results.mixpanel.reachable = result.ok;
    } catch (error) {
      console.warn('Mixpanel connectivity test failed:', error);
    }
  }

  // Test GA4
  if (GA_MEASUREMENT_ID && GA_API_SECRET) {
    try {
      const result = await sendToGA(testEvent, GA_MEASUREMENT_ID, GA_API_SECRET);
      results.ga4.reachable = result.ok;
    } catch (error) {
      console.warn('GA4 connectivity test failed:', error);
    }
  }

  return results;
}
