// Initialize Firebase Admin
import '../src/server/bootstrap';

async function postEvent(evt: string, meta: any = {}, options: any = {}) {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/analytics/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        type: evt, 
        meta, 
        dnt: options.dnt || false, 
        consent: options.consent ?? true,
        ts: Date.now()
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ ${evt}:`, result);
    } else {
      console.error(`❌ ${evt}:`, response.status, await response.text());
    }
  } catch (error) {
    console.error(`❌ ${evt} failed:`, error);
  }
}

async function seedAnalyticsEvents() {
  console.log('📊 Seeding analytics events...');
  console.log('');

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Seed various analytics events
  const events = [
    {
      type: 'login',
      meta: { 
        uid: 'demo_user_123',
        method: 'email',
        isFirstTime: false,
        userType: 'individual'
      }
    },
    {
      type: 'api_key_created',
      meta: { 
        uid: 'demo_user_123',
        keyId: 'demo_key_123',
        name: 'Demo API Key',
        permissions: ['read', 'write'],
        plan: 'pro'
      }
    },
    {
      type: 'api_call_success',
      meta: { 
        uid: 'demo_user_123',
        keyId: 'demo_key_123',
        endpoint: 'ping',
        method: 'GET',
        responseTime: 245,
        plan: 'pro',
        rateLimitRemaining: 95
      }
    },
    {
      type: 'onboarding_complete',
      meta: { 
        uid: 'demo_user_123',
        timeToComplete: 1800, // 30 minutes
        stepsCompleted: ['create_api_key', 'call_ping', 'upgrade_plan'],
        skippedSteps: ['enable_2fa']
      }
    },
    {
      type: 'support.ticket_created',
      meta: { 
        uid: 'demo_user_123',
        ticketId: 'T-12345',
        severity: 'high',
        subject: 'API key not working',
        hasUser: true
      }
    },
    {
      type: 'plan_upgrade',
      meta: { 
        uid: 'demo_user_123',
        fromPlan: 'free',
        toPlan: 'pro',
        amount: 29.99,
        currency: 'USD',
        billingInterval: 'monthly'
      }
    },
    {
      type: 'feature_used',
      meta: { 
        uid: 'demo_user_123',
        feature: 'api_key_management',
        context: 'developer_portal',
        value: 1
      }
    },
    {
      type: 'page_view',
      meta: { 
        uid: 'demo_user_123',
        path: '/account/api',
        referrer: '/dashboard'
      }
    },
    {
      type: 'user_signup',
      meta: { 
        uid: 'new_user_456',
        email: 'newuser@example.com',
        method: 'google',
        userType: 'individual'
      }
    },
    {
      type: 'subscription_created',
      meta: { 
        uid: 'demo_user_123',
        plan: 'pro',
        amount: 29.99,
        currency: 'USD',
        billingInterval: 'monthly'
      }
    },
    {
      type: 'payment_completed',
      meta: { 
        uid: 'demo_user_123',
        amount: 29.99,
        currency: 'USD',
        paymentMethod: 'card',
        subscriptionId: 'sub_123'
      }
    },
    {
      type: 'api_key_rotated',
      meta: { 
        uid: 'demo_user_123',
        keyId: 'demo_key_123',
        oldKeyId: 'old_key_123',
        reason: 'security_rotation'
      }
    },
    {
      type: 'api_key_revoked',
      meta: { 
        uid: 'demo_user_123',
        keyId: 'demo_key_123',
        reason: 'user_request'
      }
    },
    {
      type: 'rate_limit_exceeded',
      meta: { 
        uid: 'demo_user_123',
        keyId: 'demo_key_123',
        endpoint: 'ping',
        limit: 100,
        window: '1m'
      }
    },
    {
      type: 'error_occurred',
      meta: { 
        uid: 'demo_user_123',
        error: 'Invalid API key',
        endpoint: '/api/ping',
        statusCode: 401,
        userAgent: 'curl/7.68.0'
      }
    }
  ];

  // Send events with small delays to simulate real usage
  for (const event of events) {
    await postEvent(event.type, event.meta);
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between events
  }

  console.log('');
  console.log('🎉 Analytics event seeding completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   Total events sent: ${events.length}`);
  console.log('   Event types: login, api_key_created, api_call_success, onboarding_complete,');
  console.log('                support.ticket_created, plan_upgrade, feature_used, page_view,');
  console.log('                user_signup, subscription_created, payment_completed,');
  console.log('                api_key_rotated, api_key_revoked, rate_limit_exceeded, error_occurred');
  console.log('');
  console.log('📖 Next steps:');
  console.log('   1. Check server console for [ANALYTICS/SERVER] logs');
  console.log('   2. Visit admin dashboard: http://localhost:3000/admin/analytics');
  console.log('   3. Test vendor connectivity from the dashboard');
  console.log('   4. Check Mixpanel/GA4 dashboards (if configured)');
  console.log('');
  console.log('🔧 Configuration:');
  console.log('   - Vendor keys stored in Google Secret Manager');
  console.log('   - Server proxy prevents client-side key exposure');
  console.log('   - Privacy controls (DNT, consent) respected');
  console.log('   - Events enriched with server context (IP, user-agent, etc.)');
}

// Test privacy controls
async function testPrivacyControls() {
  console.log('');
  console.log('🔒 Testing privacy controls...');
  
  // Test Do Not Track
  await postEvent('login', { uid: 'test_user', method: 'email' }, { dnt: true });
  
  // Test No Consent
  await postEvent('login', { uid: 'test_user', method: 'email' }, { consent: false });
  
  console.log('✅ Privacy controls tested (should show 202 skipped responses)');
}

// Run the seed function
(async () => {
  try {
    await seedAnalyticsEvents();
    await testPrivacyControls();
    process.exit(0);
  } catch (error) {
    console.error('💥 Analytics seeding failed:', error);
    process.exit(1);
  }
})();
