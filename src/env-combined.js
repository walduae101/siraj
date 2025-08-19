// This file combines both client and server env vars
// Use this in server files that need access to both

import { env as clientEnv } from "./env";
import { env as serverEnv } from "./env-server";

export const env = {
  ...clientEnv,
  ...serverEnv,
};
