import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const report = await req.json().catch(() => null);
    
    // In development, log violations to console for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.warn('🚨 CSP VIOLATION DETECTED:', {
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
        report: report
      });
    }
    
    // In production, you could:
    // - Send to monitoring service (Sentry, DataDog, etc.)
    // - Store in database for analysis
    // - Alert on repeated violations
    
  } catch (error) {
    // Silently handle parsing errors
    if (process.env.NODE_ENV !== 'production') {
      console.error('CSP violation endpoint error:', error);
    }
  }
  
  // Always return 200 to avoid blocking the page
  return NextResponse.json({ ok: true });
}
