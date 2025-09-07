import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Watchdog endpoint for health checks and smoke tests
 * Returns basic system status and version information
 */
export async function GET() {
  try {
    const response = {
      ok: true,
      ts: Date.now(),
      version: process.env.APP_VERSION || 'dev',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        ok: false,
        ts: Date.now(),
        error: 'Health check failed',
        version: process.env.APP_VERSION || 'dev',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Check': 'failed',
        },
      }
    );
  }
}
