import React, { createContext, useContext, useState, useEffect } from 'react';
import sr from '../i18n/sr.json';
import hr from '../i18n/hr.json';
import bs from '../i18n/bs.json';
import en from '../i18n/en.json';
import de from '../i18n/de.json';

type Language = 'sr' | 'hr' | 'bs' | 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = { sr, hr, bs, en, de };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('horeca_language');
    return (saved as Language) || 'sr';
  });

  useEffect(() => {
    localStorage.setItem('horeca_language', language);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
