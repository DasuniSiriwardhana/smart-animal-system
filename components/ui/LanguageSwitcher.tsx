'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'en',    name: 'English',    nativeName: 'English',          flag: '🇬🇧' },
  { code: 'si',    name: 'Sinhala',    nativeName: 'සිංහල',            flag: '🇱🇰' },
  { code: 'ta',    name: 'Tamil',      nativeName: 'தமிழ்',            flag: '🇮🇳' },
  { code: 'hi',    name: 'Hindi',      nativeName: 'हिन्दी',           flag: '🇮🇳' },
  { code: 'es',    name: 'Spanish',    nativeName: 'Español',          flag: '🇪🇸' },
  { code: 'fr',    name: 'French',     nativeName: 'Français',         flag: '🇫🇷' },
  { code: 'de',    name: 'German',     nativeName: 'Deutsch',          flag: '🇩🇪' },
  { code: 'zh-CN', name: 'Chinese',    nativeName: '中文',             flag: '🇨🇳' },
  { code: 'ja',    name: 'Japanese',   nativeName: '日本語',           flag: '🇯🇵' },
  { code: 'ko',    name: 'Korean',     nativeName: '한국어',           flag: '🇰🇷' },
  { code: 'ar',    name: 'Arabic',     nativeName: 'العربية',          flag: '🇸🇦' },
  { code: 'ru',    name: 'Russian',    nativeName: 'Русский',          flag: '🇷🇺' },
  { code: 'pt',    name: 'Portuguese', nativeName: 'Português',        flag: '🇵🇹' },
  { code: 'id',    name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'tr',    name: 'Turkish',    nativeName: 'Türkçe',           flag: '🇹🇷' },
  { code: 'bn',    name: 'Bengali',    nativeName: 'বাংলা',            flag: '🇧🇩' },
  { code: 'ur',    name: 'Urdu',       nativeName: 'اردو',             flag: '🇵🇰' },
  { code: 'th',    name: 'Thai',       nativeName: 'ไทย',              flag: '🇹🇭' },
  { code: 'vi',    name: 'Vietnamese', nativeName: 'Tiếng Việt',       flag: '🇻🇳' },
  { code: 'sw',    name: 'Swahili',    nativeName: 'Kiswahili',        flag: '🇹🇿' },
];

const SOUTH_ASIAN = ['si', 'ta', 'hi', 'bn', 'ur'];

//  Read localStorage OUTSIDE component to use as initial state (avoids setState-in-effect)
function getSavedLang(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('preferred-language') || 'en';
}

export function LanguageSwitcher() {
  //  Initialize directly from localStorage — no useEffect needed for this
  const [currentLang, setCurrentLang] = useState<string>(getSavedLang);
  const [ready, setReady] = useState(false);
  const appliedRef = useRef(false);

  useEffect(() => {
    // Poll for Google Translate combo box to appear
    const interval = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (combo) {
        setReady(true);
        clearInterval(interval);

        // Apply saved language once on first load
        if (!appliedRef.current && currentLang !== 'en') {
          appliedRef.current = true;
          combo.value = currentLang;
          combo.dispatchEvent(new Event('change'));
        }
      }
    }, 400);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); //  Only run once on mount — currentLang from closure is fine here

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('preferred-language', langCode);

    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (!combo) {
      console.warn('Google Translate widget not ready yet');
      return;
    }

    combo.value = langCode;
    combo.dispatchEvent(new Event('change'));
  };

  const current = LANGUAGES.find(l => l.code === currentLang) ?? LANGUAGES[0];
  const southAsianLangs = LANGUAGES.filter(l => SOUTH_ASIAN.includes(l.code));
  const otherLangs = LANGUAGES.filter(l => !SOUTH_ASIAN.includes(l.code));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline text-sm">
            {current.flag} {current.name}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60 max-h-80 overflow-y-auto" align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Select Language</span>
          {!ready && <span className="text-yellow-500">⏳ Loading...</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* South Asian section */}
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          South Asian
        </div>
        {southAsianLangs.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="cursor-pointer flex items-center justify-between"
            disabled={!ready}
          >
            <span>
              {lang.flag} {lang.nativeName}
              <span className="text-muted-foreground text-xs ml-1">({lang.name})</span>
            </span>
            {currentLang === lang.code && <Check className="h-4 w-4 text-green-500 shrink-0" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* All other languages */}
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Other Languages
        </div>
        {otherLangs.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="cursor-pointer flex items-center justify-between"
            disabled={!ready}
          >
            <span>
              {lang.flag} {lang.nativeName}
              <span className="text-muted-foreground text-xs ml-1">({lang.name})</span>
            </span>
            {currentLang === lang.code && <Check className="h-4 w-4 text-green-500 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}