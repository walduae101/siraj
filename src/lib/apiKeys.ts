import { getDb } from '~/server/firebase/admin-lazy';
import { Timestamp } from 'firebase-admin/firestore';
import argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import type { ApiKey, ApiKeyCreateRequest, ApiKeyCreateResponse, ApiKeyListResponse } from '~/types/apiKeys';

export class ApiKeyService {
  private async getDb() {
    return await getDb();
  }

  /**
   * Generate a new API key with secure random components
   */
  async generateKey(uid: string, request: ApiKeyCreateRequest): Promise<ApiKeyCreateResponse> {
    const db = await this.getDb();
    
    // Generate unique key ID
    const keyId = this.generateKeyId();
    
    // Generate secret (32 bytes, base64 encoded)
    const secret = randomBytes(32).toString('base64').replace(/[+/=]/g, (char) => {
      switch (char) {
        case '+': return '-';
        case '/': return '_';
        case '=': return '';
        default: return char;
      }
    });

    // Hash the secret with salt
    const salt = randomBytes(16).toString('hex');
    const secretHash = await this.hashSecret(secret, salt);

    // Create API key document
    const keyRef = db.collection('users').doc(uid).collection('devkeys').doc();
    const now = Timestamp.now();
    
    const apiKey: ApiKey = {
      id: keyRef.id,
      uid,
      name: request.name,
      keyPrefix: 'siraj_live_',
      keyId,
      secretHash,
      salt,
      status: 'active',
      createdAt: now.toDate(),
      expiresAt: request.expiresAt,
      permissions: request.permissions || [],
    };

    await keyRef.set({
      ...apiKey,
      createdAt: now,
      expiresAt: request.expiresAt ? Timestamp.fromDate(request.expiresAt) : null,
    });

    // Return the full key (only shown once)
    const fullKey = `${apiKey.keyPrefix}${keyId}.${secret}`;
    
    return {
      id: apiKey.id,
      key: fullKey,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
    };
  }

  /**
   * List API keys for a user (without secrets)
   */
  async listKeys(uid: string): Promise<ApiKeyListResponse[]> {
    const db = await this.getDb();
    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('devkeys')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        keyId: data.keyId,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate() || undefined,
        expiresAt: data.expiresAt?.toDate() || undefined,
        permissions: data.permissions || [],
      };
    });
  }

  /**
   * Rotate an API key (create new, revoke old)
   */
  async rotateKey(uid: string, keyId: string, request: ApiKeyCreateRequest): Promise<ApiKeyCreateResponse> {
    // Revoke the old key
    await this.revokeKey(uid, keyId);
    
    // Create a new key
    return this.generateKey(uid, request);
  }

  /**
   * Revoke an API key
   */
  async revokeKey(uid: string, keyId: string): Promise<void> {
    const db = await this.getDb();
    await db
      .collection('users')
      .doc(uid)
      .collection('devkeys')
      .doc(keyId)
      .update({
        status: 'revoked',
        updatedAt: Timestamp.now(),
      });
  }

  /**
   * Verify an API key and return user info
   */
  async verifyKey(keyString: string): Promise<{ key: ApiKey; uid: string } | null> {
    try {
      // Parse key format: siraj_live_<keyId>.<secret>
      const match = keyString.match(/^siraj_live_([^.]+)\.(.+)$/);
      if (!match) {
        return null;
      }

      const [, keyId, secret] = match;
      
      // Find the key document
      const db = await this.getDb();
      const snapshot = await db
        .collectionGroup('devkeys')
        .where('keyId', '==', keyId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      // Check expiration
      if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
        return null;
      }

      // Verify the secret
      const isValid = await this.verifySecret(secret, data.secretHash, data.salt);
      if (!isValid) {
        return null;
      }

      // Update last used timestamp
      await doc.ref.update({
        lastUsedAt: Timestamp.now(),
      });

      const apiKey: ApiKey = {
        id: doc.id,
        uid: data.uid,
        name: data.name,
        keyPrefix: data.keyPrefix,
        keyId: data.keyId,
        secretHash: data.secretHash,
        salt: data.salt,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate() || undefined,
        expiresAt: data.expiresAt?.toDate() || undefined,
        permissions: data.permissions || [],
      };

      return { key: apiKey, uid: data.uid };
    } catch (error) {
      console.error('API key verification error:', error);
      return null;
    }
  }

  /**
   * Hash a secret with salt using Argon2
   */
  private async hashSecret(secret: string, salt: string): Promise<string> {
    try {
      // Use Argon2 for secure hashing
      const hash = await argon2.hash(secret, {
        type: argon2.argon2id,
        salt: Buffer.from(salt, 'hex'),
        hashLength: 32,
        timeCost: 3,
        memoryCost: 65536,
        parallelism: 1,
      });
      return hash;
    } catch (error) {
      // Fallback to SHA-256 if Argon2 fails
      console.warn('Argon2 failed, falling back to SHA-256:', error);
      const hash = createHash('sha256');
      hash.update(secret);
      hash.update(salt);
      return hash.digest('hex');
    }
  }

  /**
   * Verify a secret against its hash
   */
  private async verifySecret(secret: string, hash: string, salt: string): Promise<boolean> {
    try {
      // Try Argon2 verification first
      return await argon2.verify(hash, secret);
    } catch (error) {
      // Fallback to SHA-256 verification
      console.warn('Argon2 verification failed, falling back to SHA-256:', error);
      const computedHash = createHash('sha256');
      computedHash.update(secret);
      computedHash.update(salt);
      return computedHash.digest('hex') === hash;
    }
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    // Generate 12 random characters (base36)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Mask a key for display (show only first 8 chars)
   */
  maskKey(keyId: string): string {
    return `siraj_live_${keyId.substring(0, 8)}...`;
  }
}

export const apiKeyService = new ApiKeyService();
