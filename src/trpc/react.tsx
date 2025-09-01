"use client";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";
import { getFirebaseAuth } from "~/lib/firebase-auth";

import type { AppRouter } from "~/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            (typeof window !== "undefined" &&
              window.location.hostname === "localhost") ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpLink({
          transformer: SuperJSON,
          url: `${getBaseUrl()}/api/trpc`,
          headers: async () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");

            // Add Firebase auth token if user is authenticated
            try {
              const auth = await getFirebaseAuth();
              const user = auth.currentUser;
              if (user) {
                const token = await user.getIdToken();
                headers.set("authorization", `Bearer ${token}`);
              }
            } catch (error) {
              console.warn("Failed to get Firebase auth token:", error);
            }

            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // SSR: use fallback for localhost
  return "http://localhost:3000";
}

