import { NextRequest, NextResponse } from 'next/server';
import { REMOTE_BASE, isLocalHost } from '../../../../../config/dev-bridge';

interface Ctx {
  params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return handleProxy(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return handleProxy(req, params, 'POST');
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return handleProxy(req, params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  return handleProxy(req, params, 'DELETE');
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handleProxy(req, params, 'PATCH');
}

async function handleProxy(req: NextRequest, params: Promise<{ path: string[] }>, method: string) {
  // Validate host - only allow localhost/127.0.0.1
  const host = req.headers.get('host');
  if (!isLocalHost(host)) {
    return NextResponse.json({ error: 'Dev proxy only available on localhost' }, { status: 404 });
  }

  try {
    const { path } = await params;
    const pathString = path.join('/');
    const url = new URL(req.url);
    const search = url.search;
    
    // Construct remote URL
    const remoteUrl = `${REMOTE_BASE}/api/${pathString}${search}`;
    
    // Prepare headers (strip host, add dev proxy header)
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    }
    headers.set('x-dev-proxy', '1');
    
    // Forward request to remote backend
    const response = await fetch(remoteUrl, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined,
    });
    
    // Create response with same status and headers
    const proxyResponse = NextResponse.json(
      await response.json().catch(() => ({ error: 'Non-JSON response' })),
      { status: response.status }
    );
    
    // Copy response headers (except Set-Cookie to avoid cross-site issues)
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== 'set-cookie') {
        proxyResponse.headers.set(key, value);
      }
    }
    
    return proxyResponse;
  } catch (error) {
    console.error('Dev proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
