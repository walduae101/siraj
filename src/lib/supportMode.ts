/**
 * Support Mode utilities for safe impersonation and read-only operations
 */

/**
 * Check if the application is running in support mode
 * Can be enabled via environment variable or URL query parameter
 */
export function isSupportMode(): boolean {
  // Check environment variable
  if (process.env.SUPPORT_MODE === '1') {
    return true;
  }

  // Check URL query parameter (client-side only)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('support') === '1';
  }

  return false;
}

/**
 * Redact sensitive values when in support mode
 * @param value - The value to potentially redact
 * @param fallback - The fallback string to show (default: '••••')
 * @returns The original value or fallback string
 */
export function redacted<T>(value: T, fallback: string = '••••'): T | string {
  if (isSupportMode()) {
    return fallback;
  }
  return value;
}

/**
 * Get support mode context for analytics
 */
export function getSupportModeContext() {
  return {
    isSupportMode: isSupportMode(),
    mode: isSupportMode() ? 'support' : 'normal',
  };
}

/**
 * Check if a user action should be allowed in support mode
 * @param action - The action being attempted
 * @returns Whether the action is allowed
 */
export function isActionAllowed(action: 'read' | 'write' | 'delete' | 'admin'): boolean {
  if (!isSupportMode()) {
    return true;
  }

  // In support mode, only read operations are allowed
  return action === 'read';
}

/**
 * Get support mode banner text
 */
export function getSupportModeBannerText(userLabel: string): string {
  return `🛠️ وضع الدعم · ${userLabel} · قراءة فقط`;
}
