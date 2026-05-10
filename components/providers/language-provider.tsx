"use client";

import { NextIntlClientProvider } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { Locale, messages, normalizeLocale } from "@/lib/i18n/messages";

type Values = string | number | undefined;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, Values>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lookup(locale: Locale, key: string) {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages[locale]);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("sudokumind-language");
    const detected = stored ?? navigator.language;
    const nextLocale = normalizeLocale(detected);
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    window.localStorage.setItem("sudokumind-language", nextLocale);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, Values>) => {
      const raw = lookup(locale, key) ?? lookup("en", key) ?? key;
      if (typeof raw !== "string") return key;
      return Object.entries(values ?? {}).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value ?? "")),
        raw
      );
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
