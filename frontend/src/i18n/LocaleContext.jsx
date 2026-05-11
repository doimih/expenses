import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages } from './messages';

const LocaleContext = createContext(null);
const LOCALE_STORAGE_KEY = 'expenses:locale';

function readStoredLocale() {
  if (typeof window === 'undefined') return 'ro';
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ro';
}

function lookup(source, path) {
  return path.split('.').reduce((accumulator, key) => (accumulator && accumulator[key] !== undefined ? accumulator[key] : undefined), source);
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(readStoredLocale);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => {
    const fallback = messages.ro;

    return {
      locale,
      setLocale,
      toggleLocale: () => setLocale((current) => (current === 'ro' ? 'en' : 'ro')),
      t: (path) => lookup(messages[locale] || fallback, path) ?? lookup(fallback, path) ?? path,
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }

  return context;
}
