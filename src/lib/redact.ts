/**
 * Global redaction helpers for logs, analytics, and sensitive data
 * Ensures PII and secrets are never exposed in logs or analytics
 */

/**
 * Redact API keys by masking the secret part
 * @param key - The API key to redact (e.g., "siraj_live_abc123.secret456")
 * @returns Redacted key (e.g., "siraj_live_abc123.••••••")
 */
export function redactKey(key: string): string {
  if (!key || typeof key !== 'string') {
    return '••••••';
  }

  // Handle siraj_live_<id>.<secret> format
  const sirajKeyMatch = key.match(/^(siraj_live_[^.]+)\.(.+)$/);
  if (sirajKeyMatch) {
    const [, prefix, secret] = sirajKeyMatch;
    const maskedSecret = '•'.repeat(Math.min(secret.length, 6));
    return `${prefix}.${maskedSecret}`;
  }

  // Handle other API key formats
  if (key.length <= 8) {
    return '•'.repeat(key.length);
  }

  // Show first 4 and last 2 characters, mask the middle
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 2);
  const middle = '•'.repeat(Math.max(4, key.length - 6));
  
  return `${start}${middle}${end}`;
}

/**
 * Redact email addresses by masking the local part
 * @param email - The email to redact (e.g., "user@domain.com")
 * @returns Redacted email (e.g., "u••@domain.com")
 */
export function redactEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '••••@••••.com';
  }

  const emailMatch = email.match(/^(.+)@(.+)$/);
  if (!emailMatch) {
    return '••••@••••.com';
  }

  const [, localPart, domain] = emailMatch;
  
  if (localPart.length <= 2) {
    return `••@${domain}`;
  }

  const maskedLocal = localPart.charAt(0) + '•'.repeat(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Redact phone numbers by masking digits
 * @param phone - The phone number to redact
 * @returns Redacted phone number
 */
export function redactPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '••••••••••';
  }

  // Keep country code and last 2 digits, mask the rest
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) {
    return '•'.repeat(digits.length);
  }

  const start = digits.substring(0, 2);
  const end = digits.substring(digits.length - 2);
  const middle = '•'.repeat(digits.length - 4);
  
  return `${start}${middle}${end}`;
}

/**
 * Redact UIDs by showing only first and last few characters
 * @param uid - The UID to redact
 * @returns Redacted UID
 */
export function redactUid(uid: string): string {
  if (!uid || typeof uid !== 'string') {
    return '••••••••';
  }

  if (uid.length <= 8) {
    return '•'.repeat(uid.length);
  }

  const start = uid.substring(0, 4);
  const end = uid.substring(uid.length - 4);
  const middle = '•'.repeat(Math.max(4, uid.length - 8));
  
  return `${start}${middle}${end}`;
}

/**
 * Redact sensitive data in objects recursively
 * @param obj - The object to redact
 * @param sensitiveKeys - Keys that contain sensitive data
 * @returns Redacted object
 */
export function redactObject(obj: any, sensitiveKeys: string[] = ['key', 'secret', 'token', 'password', 'email', 'phone', 'uid']): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj; // Don't auto-redact strings, use specific functions
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, sensitiveKeys));
  }

  if (typeof obj === 'object') {
    const redacted: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        if (typeof value === 'string') {
          if (lowerKey.includes('email')) {
            redacted[key] = redactEmail(value);
          } else if (lowerKey.includes('phone')) {
            redacted[key] = redactPhone(value);
          } else if (lowerKey.includes('uid') || lowerKey.includes('id')) {
            redacted[key] = redactUid(value);
          } else {
            redacted[key] = redactKey(value);
          }
        } else {
          redacted[key] = '••••••';
        }
      } else {
        redacted[key] = redactObject(value, sensitiveKeys);
      }
    }
    
    return redacted;
  }

  return obj;
}

/**
 * Redact sensitive data in analytics payload
 * @param payload - The analytics payload to redact
 * @returns Redacted payload
 */
export function redactAnalyticsPayload(payload: any): any {
  const sensitiveKeys = [
    'key', 'secret', 'token', 'password', 'email', 'phone', 'uid', 'id',
    'apiKey', 'api_key', 'accessToken', 'access_token', 'refreshToken', 'refresh_token'
  ];
  
  return redactObject(payload, sensitiveKeys);
}

/**
 * Redact sensitive data in log messages
 * @param message - The log message to redact
 * @returns Redacted message
 */
export function redactLogMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return message;
  }

  // Redact API keys
  message = message.replace(/siraj_live_[^.]+\.([^.\s]+)/g, (match, secret) => {
    return match.replace(secret, '•'.repeat(Math.min(secret.length, 6)));
  });

  // Redact emails
  message = message.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, local, domain) => {
    const maskedLocal = local.charAt(0) + '•'.repeat(local.length - 1);
    return `${maskedLocal}@${domain}`;
  });

  // Redact phone numbers
  message = message.replace(/(\+?[\d\s\-\(\)]{10,})/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 10) {
      const start = digits.substring(0, 2);
      const end = digits.substring(digits.length - 2);
      const middle = '•'.repeat(digits.length - 4);
      return `${start}${middle}${end}`;
    }
    return '•'.repeat(match.length);
  });

  return message;
}
