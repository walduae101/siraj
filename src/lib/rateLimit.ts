import { getDb } from '~/server/firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';
import type { RateLimitConfig, RateLimitResult, PlanLimits } from '~/types/apiKeys';

export class RateLimitService {
  private async getDb() {
    return await getDb();
  }

  /**
   * Get rate limits for a plan
   */
  getPlanLimits(plan: string): RateLimitConfig {
    const limits: PlanLimits = {
      free: {
        perMinute: 10,
        perDay: 1000,
        burstLimit: 20,
      },
      pro: {
        perMinute: 100,
        perDay: 10000,
        burstLimit: 200,
      },
      org: {
        perMinute: 500,
        perDay: 50000,
        burstLimit: 1000,
      },
    };

    return limits[plan as keyof PlanLimits] || limits.free;
  }

  /**
   * Check and consume rate limit for an API key
   */
  async checkAndConsume(
    keyId: string,
    feature: string,
    plan: string
  ): Promise<RateLimitResult> {
    const db = await this.getDb();
    const limits = this.getPlanLimits(plan);
    const now = new Date();
    const today = now.toISOString().slice(0, 10).replace(/-/g, '');
    const currentMinute = Math.floor(now.getTime() / 60000);

    // Create rate limit document path
    const rateLimitRef = db
      .collection('ratelimits')
      .doc(keyId)
      .collection('daily')
      .doc(today);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitRef);
        const data = doc.exists ? doc.data() : {};

        // Initialize counters if they don't exist
        const minuteCount = data[`minute_${currentMinute}`] || 0;
        const dayCount = data.dayCount || 0;

        // Check limits
        if (minuteCount >= limits.perMinute) {
          const resetTime = new Date((currentMinute + 1) * 60000);
          return {
            allowed: false,
            remaining: 0,
            resetTime,
            retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
          };
        }

        if (dayCount >= limits.perDay) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return {
            allowed: false,
            remaining: 0,
            resetTime: tomorrow,
            retryAfter: Math.ceil((tomorrow.getTime() - now.getTime()) / 1000),
          };
        }

        // Update counters
        const updates: any = {
          dayCount: dayCount + 1,
          [`minute_${currentMinute}`]: minuteCount + 1,
          lastUpdated: Timestamp.now(),
        };

        // Clean up old minute counters (keep only last 60 minutes)
        for (let i = 0; i < 60; i++) {
          const minuteKey = `minute_${currentMinute - i}`;
          if (data[minuteKey] && i > 0) {
            delete updates[minuteKey];
          }
        }

        transaction.set(rateLimitRef, updates, { merge: true });

        return {
          allowed: true,
          remaining: Math.min(limits.perMinute - minuteCount - 1, limits.perDay - dayCount - 1),
          resetTime: new Date((currentMinute + 1) * 60000),
        };
      });

      return result;
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: limits.perMinute - 1,
        resetTime: new Date(now.getTime() + 60000),
      };
    }
  }

  /**
   * Get current rate limit status for a key
   */
  async getRateLimitStatus(keyId: string, plan: string): Promise<{
    minuteCount: number;
    dayCount: number;
    limits: RateLimitConfig;
  }> {
    const db = await this.getDb();
    const limits = this.getPlanLimits(plan);
    const now = new Date();
    const today = now.toISOString().slice(0, 10).replace(/-/g, '');
    const currentMinute = Math.floor(now.getTime() / 60000);

    const rateLimitRef = db
      .collection('ratelimits')
      .doc(keyId)
      .collection('daily')
      .doc(today);

    const doc = await rateLimitRef.get();
    const data = doc.exists ? doc.data() : {};

    return {
      minuteCount: data[`minute_${currentMinute}`] || 0,
      dayCount: data.dayCount || 0,
      limits,
    };
  }

  /**
   * Reset rate limits for a key (admin function)
   */
  async resetRateLimit(keyId: string): Promise<void> {
    const db = await this.getDb();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    const rateLimitRef = db
      .collection('ratelimits')
      .doc(keyId)
      .collection('daily')
      .doc(today);

    await rateLimitRef.delete();
  }
}

export const rateLimitService = new RateLimitService();
