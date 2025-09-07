import { NextRequest } from 'next/server';
import { apiKeyService } from '~/lib/apiKeys';
import type { ApiKeyAuthResult } from '~/types/apiKeys';

export interface ApiKeyRequest extends NextRequest {
  headers: Headers & {
    get(name: 'x-api-key'): string | null;
    get(name: 'x-key-id'): string | null;
    get(name: 'x-user-uid'): string | null;
  };
}

/**
 * Extract and verify API key from request headers
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return null;
  }

  try {
    const result = await apiKeyService.verifyKey(apiKey);
    
    if (!result) {
      return null;
    }

    return {
      keyId: result.key.id,
      uid: result.uid,
      key: result.key,
      isValid: true,
    };
  } catch (error) {
    console.error('API key verification error:', error);
    return null;
  }
}

/**
 * Middleware to add API key authentication to requests
 */
export async function withApiKeyAuth(
  request: NextRequest,
  handler: (request: ApiKeyRequest, auth: ApiKeyAuthResult) => Promise<Response>
): Promise<Response> {
  const auth = await verifyApiKey(request);
  
  if (!auth) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid or missing API key',
        code: 'INVALID_API_KEY' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Add auth info to request headers
  const enhancedRequest = request as ApiKeyRequest;
  enhancedRequest.headers.set('x-key-id', auth.keyId);
  enhancedRequest.headers.set('x-user-uid', auth.uid);

  return handler(enhancedRequest, auth);
}

/**
 * Optional API key authentication (allows both API key and regular auth)
 */
export async function withOptionalApiKeyAuth(
  request: NextRequest,
  handler: (request: NextRequest, auth?: ApiKeyAuthResult) => Promise<Response>
): Promise<Response> {
  const auth = await verifyApiKey(request);
  
  if (auth) {
    // Add auth info to request headers
    const enhancedRequest = request as ApiKeyRequest;
    enhancedRequest.headers.set('x-key-id', auth.keyId);
    enhancedRequest.headers.set('x-user-uid', auth.uid);
  }

  return handler(request, auth || undefined);
}

/**
 * Check if request has valid API key
 */
export function hasApiKey(request: NextRequest): boolean {
  return !!request.headers.get('x-api-key');
}

/**
 * Get API key info from request headers
 */
export function getApiKeyInfo(request: NextRequest): { keyId: string; uid: string } | null {
  const keyId = request.headers.get('x-key-id');
  const uid = request.headers.get('x-user-uid');
  
  if (!keyId || !uid) {
    return null;
  }

  return { keyId, uid };
}
