import React from 'react';
import { useTranslation } from '../i18n';

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      id="language-selector"
      className="inline-flex items-center bg-[#eeece6] rounded-full p-0.5 border border-[#dfdcd3]"
      role="group"
      aria-label={t('nav.selectLanguage')}
    >
      <button
        id="lang-btn-nl"
        type="button"
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border-none cursor-pointer transition-colors ${
          locale === 'nl'
            ? 'bg-[#24583d] text-white shadow-xs'
            : 'bg-transparent text-[#576359] hover:text-[#1b261e]'
        }`}
        onClick={() => setLocale('nl')}
        aria-pressed={locale === 'nl'}
        title={t('nav.languageDutch')}
      >
        <span className="lang-flag" aria-hidden="true">🇳🇱</span>
        <span>NL</span>
      </button>

      <button
        id="lang-btn-en"
        type="button"
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border-none cursor-pointer transition-colors ${
          locale === 'en'
            ? 'bg-[#24583d] text-white shadow-xs'
            : 'bg-transparent text-[#576359] hover:text-[#1b261e]'
        }`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        title={t('nav.languageEnglish')}
      >
        <span className="lang-flag" aria-hidden="true">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
