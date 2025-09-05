export interface SirajClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  retries?: number;
}

export interface PingResponse {
  ok: boolean;
  keyId: string;
  uid: string;
  plan: string;
  timestamp: string;
  rateLimit: {
    remaining: number;
    resetTime: string;
  };
}

export interface SirajError extends Error {
  status?: number;
  code?: string;
  retryAfter?: number;
}

export class Siraj {
  #apiKey: string;
  #base: string;
  #timeout: number;
  #retries: number;

  constructor(opts: SirajClientOptions) {
    if (!opts?.apiKey) {
      throw new Error('Missing apiKey - provide your Siraj API key');
    }
    
    this.#apiKey = opts.apiKey;
    this.#base = opts.baseUrl ?? 'https://siraj.life';
    this.#timeout = opts.timeoutMs ?? 10000;
    this.#retries = Math.min(Math.max(opts.retries ?? 2, 0), 5);
  }

  /**
   * Test your API key and get account information
   */
  async ping(): Promise<PingResponse> {
    return this.#fetchJson('/api/ping', { method: 'GET' });
  }

  /**
   * Get API health status (no authentication required)
   */
  async health(): Promise<{ ok: boolean; ts: number }> {
    return this.#fetchJson('/api/health', { method: 'GET' }, false);
  }

  /**
   * Internal method to make authenticated API requests with retry logic
   */
  async #fetchJson(
    path: string, 
    init: RequestInit, 
    requireAuth: boolean = true
  ): Promise<any> {
    const url = this.#base.replace(/\/+$/, '') + path;
    let attempt = 0;
    let lastErr: any;

    while (attempt <= this.#retries) {
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), this.#timeout);

        const headers: Record<string, string> = {
          'accept': 'application/json',
          'user-agent': 'siraj-sdk-js/0.1.0',
          ...(init.headers as Record<string, string> || {})
        };

        if (requireAuth) {
          headers['x-api-key'] = this.#apiKey;
        }

        const res = await fetch(url, {
          ...init,
          headers,
          signal: ctrl.signal
        });

        clearTimeout(timeoutId);

        // Handle rate limiting (429)
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after') || '0') || 1;
          const error: SirajError = new Error(`Rate limit exceeded (retry after ${retryAfter}s)`) as SirajError;
          error.status = 429;
          error.code = 'rate_limit';
          error.retryAfter = retryAfter;

          if (attempt === this.#retries) {
            throw error;
          }

          // Wait for retry-after period
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          attempt++;
          continue;
        }

        // Handle other HTTP errors
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          let errorData: any = null;

          try {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              errorData = await res.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } else {
              const text = await res.text();
              if (text) errorMessage = text;
            }
          } catch {
            // Ignore parsing errors, use default message
          }

          const error: SirajError = new Error(errorMessage) as SirajError;
          error.status = res.status;
          error.code = errorData?.code || `http_${res.status}`;

          throw error;
        }

        // Parse successful response
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await res.json();
        } else {
          return await res.text();
        }

      } catch (e) {
        lastErr = e;
        
        // Don't retry on authentication errors or client errors (4xx except 429)
        if (e instanceof Error && 'status' in e) {
          const status = (e as SirajError).status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw e;
          }
        }

        // Don't retry on abort (timeout)
        if (e instanceof Error && e.name === 'AbortError') {
          const timeoutError: SirajError = new Error(`Request timeout after ${this.#timeout}ms`) as SirajError;
          timeoutError.code = 'timeout';
          throw timeoutError;
        }

        if (attempt === this.#retries) {
          throw e;
        }

        // Exponential backoff: 300ms, 600ms, 1200ms, etc.
        const backoffMs = 300 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        attempt++;
      }
    }

    throw lastErr ?? new Error('Unknown error occurred');
  }

  /**
   * Get current configuration
   */
  getConfig(): { baseUrl: string; timeoutMs: number; retries: number } {
    return {
      baseUrl: this.#base,
      timeoutMs: this.#timeout,
      retries: this.#retries
    };
  }
}

// Export default instance factory
export function createSirajClient(opts: SirajClientOptions): Siraj {
  return new Siraj(opts);
}

// Export types for TypeScript users
export type { SirajClientOptions, PingResponse, SirajError };
