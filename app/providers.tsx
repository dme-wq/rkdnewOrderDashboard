"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 55 * 1000,
            gcTime: 1000 * 60 * 60 * 24, // 24 hours cache retention
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
          },
        },
      })
  );

  const [persister, setPersister] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPersister(
        createSyncStoragePersister({
          storage: window.localStorage,
        })
      );
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {persister ? (
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
          {children}
        </PersistQueryClientProvider>
      ) : (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )}
    </ThemeProvider>
  );
}
