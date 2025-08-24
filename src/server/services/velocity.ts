import { getConfig } from "~/server/config";
import { getDb } from "~/server/firebase/admin-lazy";

export interface VelocityCounts {
  uid: {
    minute: number;
    hour: number;
    day: number;
  };
  ip: {
    minute: number;
    hour: number;
    day: number;
  };
}

export interface VelocityInput {
  uid: string;
  ip: string;
  uaHash: string;
}

export class VelocityService {
  /**
   * Increment velocity counters for both UID and IP in a single transaction
   * Returns current window counts for decision making
   */
  async incrementAndGetCounts(input: VelocityInput): Promise<VelocityCounts> {
    const { uid, ip, uaHash } = input;
    const now = new Date();
    const dateKey = this.getDateKey(now);
    const hourKey = this.getHourKey(now);
    const minuteKey = this.getMinuteKey(now);

    const db = await getDb();
    const result = await db.runTransaction(async (transaction) => {
      // Get or create fraud signals document for today
      const uidDocRef = db
        .collection("fraudSignals")
        .doc(dateKey)
        .collection(uid)
        .doc("counters");
      const ipDocRef = db
        .collection("fraudSignals")
        .doc(dateKey)
        .collection(ip)
        .doc("counters");

      // Read current values
      const [uidDoc, ipDoc] = await Promise.all([
        transaction.get(uidDocRef),
        transaction.get(ipDocRef),
      ]);

      // Initialize or update counters
      const uidData = uidDoc.exists ? uidDoc.data()! : {};
      const ipData = ipDoc.exists ? ipDoc.data()! : {};

      // Increment counters
      const uidCounts = {
        minute: (uidData[minuteKey] || 0) + 1,
        hour: (uidData[hourKey] || 0) + 1,
        day: (uidData[dateKey] || 0) + 1,
      };

      const ipCounts = {
        minute: (ipData[minuteKey] || 0) + 1,
        hour: (ipData[hourKey] || 0) + 1,
        day: (ipData[dateKey] || 0) + 1,
      };

      // Update documents with new counters and metadata
      const uidUpdate = {
        [minuteKey]: uidCounts.minute,
        [hourKey]: uidCounts.hour,
        [dateKey]: uidCounts.day,
        lastSeen: now,
        firstSeen: uidData.firstSeen || now,
        uaHashSet: this.addToSet(uidData.uaHashSet || [], uaHash),
        ipSet: this.addToSet(uidData.ipSet || [], ip),
        updatedAt: now,
      };

      const ipUpdate = {
        [minuteKey]: ipCounts.minute,
        [hourKey]: ipCounts.hour,
        [dateKey]: ipCounts.day,
        lastSeen: now,
        firstSeen: ipData.firstSeen || now,
        uaHashSet: this.addToSet(ipData.uaHashSet || [], uaHash),
        uidSet: this.addToSet(ipData.uidSet || [], uid),
        updatedAt: now,
      };

      transaction.set(uidDocRef, uidUpdate, { merge: true });
      transaction.set(ipDocRef, ipUpdate, { merge: true });

      return { uidCounts, ipCounts };
    });

    return {
      uid: result.uidCounts,
      ip: result.ipCounts,
    };
  }

  /**
   * Get current velocity counts without incrementing
   */
  async getCounts(input: VelocityInput): Promise<VelocityCounts> {
    const { uid, ip } = input;
    const now = new Date();
    const dateKey = this.getDateKey(now);
    const hourKey = this.getHourKey(now);
    const minuteKey = this.getMinuteKey(now);

    const db = await getDb();
    const [uidDoc, ipDoc] = await Promise.all([
      db
        .collection("fraudSignals")
        .doc(dateKey)
        .collection(uid)
        .doc("counters")
        .get(),
      db
        .collection("fraudSignals")
        .doc(dateKey)
        .collection(ip)
        .doc("counters")
        .get(),
    ]);

    const uidData = uidDoc.exists ? uidDoc.data()! : {};
    const ipData = ipDoc.exists ? ipDoc.data()! : {};

    return {
      uid: {
        minute: uidData[minuteKey] || 0,
        hour: uidData[hourKey] || 0,
        day: uidData[dateKey] || 0,
      },
      ip: {
        minute: ipData[minuteKey] || 0,
        hour: ipData[hourKey] || 0,
        day: ipData[dateKey] || 0,
      },
    };
  }

  /**
   * Check if velocity exceeds configured caps
   */
  async checkVelocityLimits(input: VelocityInput): Promise<{
    uidExceeded: boolean;
    ipExceeded: boolean;
    limits: any;
  }> {
    const counts = await this.getCounts(input);
    const config = await getConfig();
    const caps = config.fraud.checkoutCaps;

    const uidExceeded =
      counts.uid.minute > caps.uid.perMinute ||
      counts.uid.hour > caps.uid.perHour ||
      counts.uid.day > caps.uid.perDay;

    const ipExceeded =
      counts.ip.minute > caps.ip.perMinute ||
      counts.ip.hour > caps.ip.perHour ||
      counts.ip.day > caps.ip.perDay;

    return {
      uidExceeded,
      ipExceeded,
      limits: {
        uid: caps.uid,
        ip: caps.ip,
        current: counts,
      },
    };
  }

  /**
   * Increment and check rate limits using sharded counters
   * Returns true if within limits, false if exceeded
   */
  async incrementAndCheck(
    scope: "ip" | "uid",
    key: string,
    limit: number,
    period: "1m" | "1h" | "1d",
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const db = await getDb();
    const now = new Date();
    const windowStart = this.getWindowStart(now, period);
    const shardCount = 10; // Fixed small shard count to avoid hot-spots

    // Use consistent sharding to avoid hot-spots
    const shardId = Math.abs(this.hashString(key)) % shardCount;
    const counterId = `${scope}:${key}:${period}:${shardId}`;

    const result = await db.runTransaction(async (transaction) => {
      const counterRef = db.collection("rlCounters").doc(counterId);
      const counterDoc = await transaction.get(counterRef);

      let currentCount = 0;
      let shouldUpdate = false;

      if (counterDoc.exists) {
        const data = counterDoc.data()!;
        // Check if we're in the same window
        if (
          data.windowStart &&
          data.windowStart.toMillis() === windowStart.getTime()
        ) {
          currentCount = data.count || 0;
        } else {
          // New window, reset counter
          shouldUpdate = true;
        }
      } else {
        shouldUpdate = true;
      }

      // Check if we're at the limit
      if (currentCount >= limit) {
        return { allowed: false, current: currentCount, limit };
      }

      // Increment counter
      const newCount = currentCount + 1;

      if (shouldUpdate || newCount > currentCount) {
        transaction.set(
          counterRef,
          {
            count: newCount,
            windowStart: windowStart,
            updatedAt: now,
            scope,
            key,
            period,
            shardId,
          },
          { merge: true },
        );
      }

      return { allowed: true, current: newCount, limit };
    });

    return result;
  }

  /**
   * Get window start time for a period
   */
  private getWindowStart(now: Date, period: "1m" | "1h" | "1d"): Date {
    const windowStart = new Date(now);

    switch (period) {
      case "1m":
        windowStart.setSeconds(0, 0);
        break;
      case "1h":
        windowStart.setMinutes(0, 0, 0);
        break;
      case "1d":
        windowStart.setHours(0, 0, 0, 0);
        break;
    }

    return windowStart;
  }

  /**
   * Simple hash function for consistent sharding
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split("T")[0]?.replace(/-/g, "") || "";
  }

  private getHourKey(date: Date): string {
    return `${this.getDateKey(date)}_${date.getUTCHours().toString().padStart(2, "0")}`;
  }

  private getMinuteKey(date: Date): string {
    return `${this.getHourKey(date)}_${date.getUTCMinutes().toString().padStart(2, "0")}`;
  }

  private addToSet<T>(array: T[], item: T): T[] {
    return array.includes(item) ? array : [...array, item];
  }
}

export const velocityService = new VelocityService();
