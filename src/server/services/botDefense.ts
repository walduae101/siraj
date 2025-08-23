import { getDb } from "~/server/firebase/admin-lazy";
import { getConfig } from "~/server/config";
import { TRPCError } from "@trpc/server";

export interface BotDefenseInput {
  uid: string;
  ip: string;
  userAgent: string;
  recaptchaToken?: string;
  appCheckToken?: string;
}

export interface BotDefenseResult {
  isHuman: boolean;
  confidence: number;
  reasons: string[];
  cached: boolean;
}

export class BotDefenseService {
  private config = getConfig();

  /**
   * Verify bot defense mechanisms and return confidence score
   */
  async verify(input: BotDefenseInput): Promise<BotDefenseResult> {
    const reasons: string[] = [];
    let confidence = 0;
    let cached = false;

    // Check cache first
    const cacheKey = `bot_defense:${input.uid}:${input.ip}`;
    const cachedResult = await this.getCachedResult(cacheKey);
    if (cachedResult) {
      cached = true;
      return cachedResult;
    }

    // 1. Verify App Check token (if provided)
    if (input.appCheckToken) {
      try {
        const appCheckValid = await this.verifyAppCheck(input.appCheckToken);
        if (appCheckValid) {
          confidence += 40;
          reasons.push("app_check_valid");
        } else {
          reasons.push("app_check_invalid");
        }
      } catch (error) {
        reasons.push("app_check_error");
      }
    } else {
      reasons.push("no_app_check_token");
    }

    // 2. Verify reCAPTCHA Enterprise (if provided)
    if (input.recaptchaToken) {
      try {
        const recaptchaResult = await this.verifyRecaptcha(input.recaptchaToken, input.ip);
        if (recaptchaResult.score >= 0.7) {
          confidence += 50;
          reasons.push("recaptcha_high_score");
        } else if (recaptchaResult.score >= 0.5) {
          confidence += 30;
          reasons.push("recaptcha_medium_score");
        } else {
          reasons.push("recaptcha_low_score");
        }
      } catch (error) {
        reasons.push("recaptcha_error");
      }
    } else {
      reasons.push("no_recaptcha_token");
    }

    // 3. Basic heuristic checks
    const heuristicScore = this.runHeuristicChecks(input);
    confidence += heuristicScore.score;
    reasons.push(...heuristicScore.reasons);

    // 4. Check for known bot patterns
    const botPatternScore = this.checkBotPatterns(input);
    confidence -= botPatternScore.score;
    reasons.push(...botPatternScore.reasons);

    // Normalize confidence to 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    const result: BotDefenseResult = {
      isHuman: confidence >= 50,
      confidence,
      reasons,
      cached: false,
    };

    // Cache result for 5 minutes
    await this.cacheResult(cacheKey, result);

    return result;
  }

  /**
   * Verify Firebase App Check token
   */
  private async verifyAppCheck(token: string): Promise<boolean> {
    try {
      // For now, we'll do basic validation
      // In production, you'd use Firebase Admin SDK to verify the token
      if (!token || token.length < 10) {
        return false;
      }

      // Check if token is in the allowed public keys list
      const publicKeys = this.config.fraud.appCheckPublicKeys;
      if (publicKeys.length > 0) {
        // This is a simplified check - in reality you'd verify the JWT
        return publicKeys.some(key => token.includes(key.substring(0, 10)));
      }

      // If no public keys configured, assume valid for development
      return process.env.NODE_ENV === "development";
    } catch (error) {
      console.error("App Check verification error:", error);
      return false;
    }
  }

  /**
   * Verify reCAPTCHA Enterprise assessment
   */
  private async verifyRecaptcha(token: string, ip: string): Promise<{ score: number }> {
    try {
      // For now, we'll simulate reCAPTCHA verification
      // In production, you'd call the reCAPTCHA Enterprise API
      const projectId = this.config.fraud.recaptchaProject;
      const siteKey = this.config.fraud.recaptchaSiteKey;

      if (!projectId || !siteKey) {
        console.warn("reCAPTCHA Enterprise not configured");
        return { score: 0.5 }; // Default to medium confidence
      }

      // Simulate API call to reCAPTCHA Enterprise
      // In production, you'd use the Google Cloud client library:
      // const recaptcha = new RecaptchaEnterpriseServiceClient();
      // const assessment = await recaptcha.createAssessment({...});

      // For now, return a simulated score based on token validity
      const isValidToken = token.length > 20 && token.includes(".");
      const score = isValidToken ? 0.8 : 0.2;

      return { score };
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      return { score: 0.1 }; // Low confidence on error
    }
  }

  /**
   * Run basic heuristic checks
   */
  private runHeuristicChecks(input: BotDefenseInput): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check user agent
    const ua = input.userAgent.toLowerCase();
    if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
      score -= 30;
      reasons.push("bot_user_agent");
    } else if (ua.includes("chrome") || ua.includes("firefox") || ua.includes("safari")) {
      score += 10;
      reasons.push("browser_user_agent");
    }

    // Check for common bot patterns
    if (ua.includes("headless") || ua.includes("phantom")) {
      score -= 40;
      reasons.push("headless_browser");
    }

    // Check IP patterns (basic)
    if (input.ip === "127.0.0.1" || input.ip === "::1") {
      score -= 20;
      reasons.push("localhost_ip");
    }

    return { score, reasons };
  }

  /**
   * Check for known bot patterns
   */
  private checkBotPatterns(input: BotDefenseInput): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Check for suspicious user agent patterns
    const ua = input.userAgent.toLowerCase();
    
    // Common bot patterns
    const botPatterns = [
      "python", "curl", "wget", "scrapy", "selenium", "puppeteer",
      "playwright", "cypress", "phantomjs", "nightmare"
    ];

    for (const pattern of botPatterns) {
      if (ua.includes(pattern)) {
        score -= 50;
        reasons.push(`bot_pattern_${pattern}`);
      }
    }

    // Check for missing or suspicious headers
    if (!input.userAgent || input.userAgent.length < 10) {
      score -= 20;
      reasons.push("missing_user_agent");
    }

    return { score, reasons };
  }

  /**
   * Get cached result
   */
  private async getCachedResult(key: string): Promise<BotDefenseResult | null> {
    try {
      const db = await getDb();
      const doc = await db.collection("botDefenseCache").doc(key).get();
      if (!doc.exists) return null;

      const data = doc.data()!;
      const expiresAt = data.expiresAt.toDate();
      
      if (expiresAt < new Date()) {
        // Expired, remove it
        await db.collection("botDefenseCache").doc(key).delete();
        return null;
      }

      return {
        isHuman: data.isHuman,
        confidence: data.confidence,
        reasons: data.reasons,
        cached: true,
      };
    } catch (error) {
      console.error("Error getting cached bot defense result:", error);
      return null;
    }
  }

  /**
   * Cache result for 5 minutes
   */
  private async cacheResult(key: string, result: BotDefenseResult): Promise<void> {
    try {
      const db = await getDb();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      await db.collection("botDefenseCache").doc(key).set({
        isHuman: result.isHuman,
        confidence: result.confidence,
        reasons: result.reasons,
        expiresAt,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error caching bot defense result:", error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<number> {
    try {
      const db = await getDb();
      const snapshot = await db.collection("botDefenseCache")
        .where("expiresAt", "<", new Date())
        .get();

      const batch = db.batch();
      let count = 0;

      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      return count;
    } catch (error) {
      console.error("Error cleaning up bot defense cache:", error);
      return 0;
    }
  }
}

export const botDefenseService = new BotDefenseService();
