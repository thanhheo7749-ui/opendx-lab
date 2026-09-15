"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Provider Composition
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";
import { ToastContainer } from "@/components/ui/toast-container";

export function Providers({ children, initialLocale }: { children: React.ReactNode, initialLocale?: "vi" | "en" }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <I18nProvider initialLocale={initialLocale}>
          <ToastContainer />
          {children}
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
