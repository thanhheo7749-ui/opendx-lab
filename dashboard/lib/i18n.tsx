"use client";

// ==============================================================================
// OpenDX-Lab Dashboard - Lightweight i18n System
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { dictionaries, type Locale, type DictionaryKey } from "./i18n-dictionaries";

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
const COOKIE_KEY = "opendx-locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function getLocaleCookie(): Locale {
  if (typeof document === "undefined") return "vi";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([^;]*)`));
  const value = match?.[1];
  return value === "en" ? "en" : "vi";
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_KEY}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // Initialize from: prop (SSR) > cookie (client) > default "vi"
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? getLocaleCookie()
  );

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: DictionaryKey): string => {
      return dictionaries[locale][key] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useTranslation() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useContext(I18nContext);
    if (ctx) return ctx;
  } catch {
    // Ignore — happens during SSR prerender of error pages
  }
  // Fallback for pages outside I18nProvider (e.g. _global-error)
  const fallbackT = (key: DictionaryKey) => dictionaries.vi[key] ?? key;
  return { locale: "vi" as Locale, setLocale: () => {}, t: fallbackT };
}
