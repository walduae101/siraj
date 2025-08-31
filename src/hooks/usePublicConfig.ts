"use client";
import useSWR from "swr";

const f = (u: string) => fetch(u).then(r => r.json());

export function usePublicConfig() {
  const { data, error, isLoading } = useSWR("/api/public-config", f, { revalidateOnFocus: false });
  return { config: data, error, isLoading };
}
