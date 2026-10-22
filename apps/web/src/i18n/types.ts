export type Locale = 'nl' | 'en';

export const DEFAULT_LOCALE: Locale = 'nl';
export const LOCALE_STORAGE_KEY = 'hiking_companion_locale';

export type InterpolationParams = Record<string, string | number>;

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: InterpolationParams) => string;
  formatDistance: (km: number) => string;
  formatPriceEur: (amount: number) => string;
  formatElevation: (meters: number) => string;
  formatNumber: (value: number, decimals?: number) => string;
}
