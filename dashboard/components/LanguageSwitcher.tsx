"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Language Switcher (VI/EN)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5", className)}>
      <button
        onClick={() => setLocale("vi")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          locale === "vi"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        VI
      </button>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2 py-1 text-xs font-medium rounded-md transition-colors",
          locale === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
    </div>
  );
}
