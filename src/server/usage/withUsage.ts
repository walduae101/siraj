import { getServerUser } from "~/server/auth/getServerUser";
import { getEntitlement } from "~/server/models/entitlements";
import { bumpUsage, getUsage, isLimitExceeded, getRemainingUsage } from "~/server/models/usage";

export interface UsageError {
  code: 'USAGE_LIMIT_EXCEEDED';
  feature: string;
  used: number;
  limit: number;
  remaining: number;
  upgradeUrl: string;
}

export class UsageLimitError extends Error {
  public readonly code = 'USAGE_LIMIT_EXCEEDED';
  public readonly feature: string;
  public readonly used: number;
  public readonly limit: number;
  public readonly remaining: number;
  public readonly upgradeUrl: string;

  constructor(params: {
    feature: string;
    used: number;
    limit: number;
    remaining: number;
    upgradeUrl: string;
  }) {
    super(`Usage limit exceeded for feature: ${params.feature}`);
    this.feature = params.feature;
    this.used = params.used;
    this.limit = params.limit;
    this.remaining = params.remaining;
    this.upgradeUrl = params.upgradeUrl;
  }
}

export async function withUsage(params: {
  uid?: string;
  orgId?: string;
  feature: string;
  by?: number;
}): Promise<void> {
  const { uid, orgId, feature, by = 1 } = params;
  
  // Get user if not provided
  let userId = uid;
  if (!userId && !orgId) {
    const user = await getServerUser();
    if (!user) {
      throw new Error('Authentication required');
    }
    userId = user.uid;
  }

  // Get user's plan from entitlements
  let plan = 'free';
  if (userId) {
    const entitlement = await getEntitlement(userId);
    if (entitlement && entitlement.status === 'active') {
      plan = entitlement.plan;
    }
  }

  // Get current usage
  const usageRecord = await getUsage({ uid: userId, orgId });
  const currentUsage = usageRecord?.features[feature] || 0;
  const newUsage = currentUsage + by;

  // Check if limit would be exceeded
  if (isLimitExceeded(newUsage, plan, feature)) {
    const limit = getRemainingUsage(currentUsage, plan, feature);
    const remaining = Math.max(0, limit - by);
    
    throw new UsageLimitError({
      feature,
      used: newUsage,
      limit: currentUsage + limit,
      remaining,
      upgradeUrl: '/pricing',
    });
  }

  // Bump usage
  await bumpUsage({ uid: userId, orgId, feature, by });
}

export function isUsageLimitError(error: unknown): error is UsageLimitError {
  return error instanceof UsageLimitError;
}