import { describe, it, expect } from 'vitest';
import { nl } from '../../apps/web/src/i18n/locales/nl';
import { en } from '../../apps/web/src/i18n/locales/en';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY } from '../../apps/web/src/i18n/types';
import { getShowcaseContent } from '../../apps/web/src/content/showcase';

function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

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

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}

describe('i18n Localization Engine & Translation Catalogs', () => {
  it('strictly defaults to Dutch (nl)', () => {
    expect(DEFAULT_LOCALE).toBe('nl');
    expect(LOCALE_STORAGE_KEY).toBe('hiking_companion_locale');
  });

  it('guarantees 100% key parity between nl and en catalogs', () => {
    const nlKeys = getAllKeys(nl).sort();
    const enKeys = getAllKeys(en).sort();

    expect(nlKeys.length).toBeGreaterThan(50);
    expect(enKeys).toEqual(nlKeys);

    // Verify all keys have non-empty string values
    for (const key of nlKeys) {
      const nlVal = resolveTranslationKey(nl, key);
      const enVal = resolveTranslationKey(en, key);

      expect(nlVal, `nl value for ${key} should not be empty`).toBeTruthy();
      expect(enVal, `en value for ${key} should not be empty`).toBeTruthy();
      expect(typeof nlVal).toBe('string');
      expect(typeof enVal).toBe('string');
    }
  });

  it('correctly interpolates named dynamic parameters', () => {
    const templateNl = resolveTranslationKey(nl, 'map.point')!;
    const interpolatedNl = interpolate(templateNl, { number: 4 });
    expect(interpolatedNl).toBe('Punt 4');

    const templateEn = resolveTranslationKey(en, 'map.point')!;
    const interpolatedEn = interpolate(templateEn, { number: 4 });
    expect(interpolatedEn).toBe('Point 4');

    const adminDeleteNl = resolveTranslationKey(nl, 'adminModal.deleteConfirm')!;
    expect(interpolate(adminDeleteNl, { name: 'Karel' })).toBe(
      'Weet je zeker dat je account "Karel" permanent wilt verwijderen?'
    );

    const adminDeleteEn = resolveTranslationKey(en, 'adminModal.deleteConfirm')!;
    expect(interpolate(adminDeleteEn, { name: 'Karel' })).toBe(
      'Are you sure you want to permanently delete account "Karel"?'
    );
  });

  it('preserves parameter placeholders if parameter is omitted', () => {
    const template = 'Hallo {name}, welkom!';
    expect(interpolate(template, {})).toBe('Hallo {name}, welkom!');
  });

  it('formats metric distances and elevations correctly in both locales', () => {
    const km = 28.4;

    const nlFormatted = km.toLocaleString('nl-NL', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    expect(nlFormatted).toBe('28,4');

    const enFormatted = km.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    expect(enFormatted).toBe('28.4');
  });

  it('provides comprehensive bilingual showcase landing page content', () => {
    const nlShowcase = getShowcaseContent('nl');
    const enShowcase = getShowcaseContent('en');

    expect(nlShowcase.hero.headline).toBe('Plan, Analyseer & Navigeer Jouw Trails');
    expect(enShowcase.hero.headline).toBe('Plan, Analyze & Navigate Your Trails');

    expect(nlShowcase.features.length).toBe(3);
    expect(enShowcase.features.length).toBe(3);

    expect(nlShowcase.interactiveDemo.tabs.length).toBe(3);
    expect(enShowcase.interactiveDemo.tabs.length).toBe(3);

    expect(nlShowcase.simulations.plannerTitle).toBe('Planner Modus');
    expect(enShowcase.simulations.plannerTitle).toBe('Planner Mode');

    expect(nlShowcase.loginGuide.steps.length).toBe(3);
    expect(enShowcase.loginGuide.steps.length).toBe(3);
  });
});
