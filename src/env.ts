// Combined environment configuration
export { clientEnv, clientEnvSchema, type ClientEnv } from './env-client';
export { loadServerEnv, serverEnvSchema, type ServerEnv } from './env-server';

// Re-export secret manager utilities (server-side only)
export { getSecret, getSecretName, SECRET_NAMES } from './lib/secretManager';
