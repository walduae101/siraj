import { z } from "zod";

// Client-side environment schema - only public values
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_BACKGROUND_IMAGE_URL: z
    .string()
    .default(
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    ),
  NEXT_PUBLIC_DISCORD_INVITE_URL: z
    .string()
    .default("https://discord.gg/siraj"),
  NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: z
    .string()
    .default("Connecting to Siraj Game Server..."),
  NEXT_PUBLIC_WEBSITE_URL: z.string().default("https://siraj.life"),
});

// Client environment - only public values that can be exposed to the browser
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_BACKGROUND_IMAGE_URL: process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL,
  NEXT_PUBLIC_DISCORD_INVITE_URL: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL,
  NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE: process.env.NEXT_PUBLIC_GAMESERVER_CONNECTION_MESSAGE,
  NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
