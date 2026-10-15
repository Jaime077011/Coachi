"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ dir, children }: { dir: "rtl" | "ltr"; children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      // Light mode is the :root default; "theme-light" keeps `.light` free for nested light panels.
      value={{ dark: "dark", light: "theme-light" }}
    >
      <DirectionProvider dir={dir}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-center" offset={{ bottom: 88 }} mobileOffset={{ bottom: 88 }} />
          </TooltipProvider>
        </QueryClientProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
