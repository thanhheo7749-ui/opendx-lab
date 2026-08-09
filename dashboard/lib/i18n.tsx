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
  useEffect,
  type ReactNode,
} from "react";
import { dictionaries, type Locale, type DictionaryKey } from "./i18n-dictionaries";

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
const STORAGE_KEY = "opendx-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && (stored === "vi" || stored === "en")) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
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
