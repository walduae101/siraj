export interface ApiKey {
  id: string;
  uid: string;
  name: string;
  keyPrefix: string; // 'siraj_live_'
  keyId: string; // unique identifier part
  secretHash: string; // hashed secret
  salt: string; // salt used for hashing
  status: 'active' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions?: string[]; // optional permissions array
}

export interface ApiKeyCreateRequest {
  name: string;
  expiresAt?: Date;
  permissions?: string[];
}

export interface ApiKeyCreateResponse {
  id: string;
  key: string; // full key: siraj_live_<id>.<secret> (only shown once)
  name: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ApiKeyListResponse {
  id: string;
  name: string;
  keyPrefix: string;
  keyId: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions?: string[];
}

export interface RateLimitConfig {
  perMinute: number;
  perDay: number;
  burstLimit?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface PlanLimits {
  free: RateLimitConfig;
  pro: RateLimitConfig;
  org: RateLimitConfig;
}

export interface ApiKeyAuthResult {
  keyId: string;
  uid: string;
  key: ApiKey;
  isValid: boolean;
}
