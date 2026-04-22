"use client";
import { useAutoTranslate } from '@universal-i18n/react';
import { Globe, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useAutoTranslate();
  const [isOpen, setIsOpen] = useState(false);

  const languageNames: Record<string, string> = {
    en: 'English',
    si: 'සිංහල',
    ta: 'தமிழ்',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية',
    ru: 'Русский',
    pt: 'Português',
    it: 'Italiano',
    ko: '한국어',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-sm rounded-md hover:bg-accent/10 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{languageNames[locale] || locale.toUpperCase()}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-md shadow-lg border z-50">
            <div className="p-2">
              {availableLocales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLocale(lang);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    locale === lang
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {languageNames[lang] || lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}