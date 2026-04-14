"use client";

import { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
];

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferred-language') || 'en';
    }
    return 'en';
  });
  
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('preferred-language', langCode);
    setIsOpen(false);
    
    // Trigger Google Translate
    const translateElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (translateElement) {
      translateElement.value = langCode;
      translateElement.dispatchEvent(new Event('change'));
    }
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">{currentLanguage?.flag} {currentLanguage?.name}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Select Language</span>
          <Badge variant="outline" className="text-[10px]">100+ languages</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Quick Access - South Asian Languages */}
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          South Asian Languages
        </div>
        {LANGUAGES.filter(l => ['si', 'ta', 'hi', 'bn', 'ur'].includes(l.code)).map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>
              <span className="mr-2">{lang.flag}</span>
              {lang.nativeName} <span className="text-muted-foreground text-xs ml-1">({lang.name})</span>
            </span>
            {currentLang === lang.code && <Check className="h-4 w-4 text-green-500" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          All Languages
        </div>
        
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>
              <span className="mr-2">{lang.flag}</span>
              {lang.nativeName} <span className="text-muted-foreground text-xs ml-1">({lang.name})</span>
            </span>
            {currentLang === lang.code && <Check className="h-4 w-4 text-green-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}