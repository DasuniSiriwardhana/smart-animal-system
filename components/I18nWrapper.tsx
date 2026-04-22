"use client";
import { AutoTranslateProvider } from '@universal-i18n/react';

export function I18nWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AutoTranslateProvider 
      sourceLocale="en" 
      availableLocales="all"
    >
      {children}
    </AutoTranslateProvider>
  );
}