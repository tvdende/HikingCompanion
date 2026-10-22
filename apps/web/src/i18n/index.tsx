import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Locale, InterpolationParams, I18nContextType } from './types';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from './types';
import { nl } from './locales/nl';
import { en } from './locales/en';

const catalogs = { nl, en };

const I18nContext = createContext<I18nContextType | null>(null);

function resolveTranslationKey(obj: any, path: string): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

function interpolate(template: string, params?: InterpolationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored === 'en' || stored === 'nl') {
          return stored;
        }
      }
    } catch {
      // Ignore localStorage access errors (e.g. incognito)
    }
    return DEFAULT_LOCALE;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  // Synchronize document.documentElement.lang and title
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.title =
        locale === 'nl'
          ? 'Hiking Companion - Plan, Analyseer & Navigeer Jouw Trails'
          : 'Hiking Companion - Plan, Analyze & Navigate Your Trails';
    }
  }, [locale]);

  const t = useCallback(
    (key: string, params?: InterpolationParams): string => {
      const activeCatalog = catalogs[locale];
      let value = resolveTranslationKey(activeCatalog, key);

      // Fallback to Dutch (default locale)
      if (value === null && locale !== DEFAULT_LOCALE) {
        value = resolveTranslationKey(catalogs[DEFAULT_LOCALE], key);
      }

      // Fallback to the raw key if not found in any catalog
      if (value === null) {
        return key;
      }

      return interpolate(value, params);
    },
    [locale]
  );

  const formatDistance = useCallback(
    (km: number): string => {
      const formatted = km.toLocaleString(locale === 'nl' ? 'nl-NL' : 'en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      return `${formatted} km`;
    },
    [locale]
  );

  const formatElevation = useCallback(
    (meters: number): string => {
      const formatted = meters.toLocaleString(locale === 'nl' ? 'nl-NL' : 'en-US');
      return `${formatted} m`;
    },
    [locale]
  );

  const formatPriceEur = useCallback(
    (amount: number): string => {
      const formatted = amount.toLocaleString(locale === 'nl' ? 'nl-NL' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `€${formatted}`;
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, decimals = 0): string => {
      return value.toLocaleString(locale === 'nl' ? 'nl-NL' : 'en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [locale]
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      t,
      formatDistance,
      formatElevation,
      formatPriceEur,
      formatNumber,
    }),
    [locale, setLocale, t, formatDistance, formatElevation, formatPriceEur, formatNumber]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an <I18nProvider>');
  }
  return context;
};

export * from './types';
export { nl } from './locales/nl';
export { en } from './locales/en';
