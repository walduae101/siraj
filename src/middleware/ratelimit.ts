import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "~/server/config";

// In-memory token bucket store (use Redis in production)
const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Token bucket rate limiter implementation
 */
class TokenBucketRateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  /**
   * Check if request is allowed and consume a token if so
   */
  checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const tokensPerMs = config.requestsPerMinute / windowMs;

    // Get or create bucket
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: config.burstSize,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on time elapsed
    const timeElapsed = now - bucket.lastRefill;
    const tokensToAdd = timeElapsed * tokensPerMs;
    bucket.tokens = Math.min(config.burstSize, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we have tokens available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + windowMs,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: now + windowMs,
    };
  }

  /**
   * Clean up old buckets to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new TokenBucketRateLimiter();

// Cleanup old buckets every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Get rate limit configuration for a route
 */
function getRateLimitConfig(route: string, userRole: "authenticated" | "anonymous" | "admin"): RateLimitConfig {
  const config = getConfig();
  
  // Check for route-specific override
  const routeConfig = config.rateLimit.routes[route as keyof typeof config.rateLimit.routes];
  if (routeConfig) {
    return {
      requestsPerMinute: routeConfig.requestsPerMinute,
      burstSize: routeConfig.burstSize,
    };
  }

  // Use role-based defaults
  return config.rateLimit[userRole];
}

/**
 * Generate rate limit key based on user and action
 */
function generateRateLimitKey(request: NextRequest, action: string): string {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  
  // For authenticated users, use UID if available
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // Extract UID from JWT or use IP as fallback
    try {
      const token = authHeader.substring(7);
      // In a real implementation, decode JWT to get UID
      // For now, use a hash of the token
      const uid = Buffer.from(token).toString("base64").substring(0, 16);
      return `${uid}:${action}`;
    } catch {
      // Fallback to IP if token parsing fails
      return `${ip}:${action}`;
    }
  }

  // For anonymous users, use IP
  return `${ip}:${action}`;
}

/**
 * Determine user role from request
 */
function getUserRole(request: NextRequest): "authenticated" | "anonymous" | "admin" {
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    // Check if it's an admin token (in real implementation, decode JWT)
    const token = authHeader.substring(7);
    if (token.includes("admin") || request.nextUrl.pathname.startsWith("/api/admin")) {
      return "admin";
    }
    return "authenticated";
  }
  
  return "anonymous";
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(
  request: NextRequest,
  action: string,
  route?: string
): RateLimitResult | null {
  const config = getConfig();
  
  // Skip rate limiting if disabled
  if (!config.features.RATE_LIMIT_ENABLED) {
    return { allowed: true, remaining: 999, resetTime: Date.now() + 60000 };
  }

  const userRole = getUserRole(request);
  const rateLimitConfig = getRateLimitConfig(route || action, userRole);
  const key = generateRateLimitKey(request, action);

  return rateLimiter.checkRateLimit(key, rateLimitConfig);
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": "60", // Requests per minute
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  action: string,
  route?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = rateLimitMiddleware(request, action, route);
    
    if (!result) {
      // Rate limiting disabled, proceed normally
      return handler(request);
    }

    if (!result.allowed) {
      // Rate limit exceeded
      const headers = createRateLimitHeaders(result);
      
                   // Log rate limit block
             console.log("[rate-limit] Request blocked", {
               component: "ratelimit",
               action,
               ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
               userRole: getUserRole(request),
               remaining: result.remaining,
               resetTime: result.resetTime,
             });

             // Record metric
             const { MetricsService } = await import("~/server/services/metrics");
             MetricsService.recordRateLimitBlocked(action, getUserRole(request));

      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        }
      );
    }

    // Rate limit passed, proceed with handler
    const response = await handler(request);
    
    // Add rate limit headers to response
    const headers = createRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Rate limit decorator for specific actions
 */
export function rateLimit(action: string, route?: string) {
  return function <T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!;
    
    descriptor.value = async function (...args: T): Promise<R> {
      // This would need to be adapted for the specific context
      // For now, this is a placeholder for decorator-based rate limiting
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Get rate limit status for monitoring
 */
export function getRateLimitStatus(): {
  totalBuckets: number;
  activeBuckets: number;
} {
  return {
    totalBuckets: tokenBuckets.size,
    activeBuckets: Array.from(tokenBuckets.values()).filter(
      bucket => Date.now() - bucket.lastRefill < 5 * 60 * 1000
    ).length,
  };
}
