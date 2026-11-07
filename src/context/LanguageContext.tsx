import React, { createContext, useContext, useState } from 'react';
import { Language, translations } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('radhamadhab_lang_v1');
    return (saved === 'en' || saved === 'bn' || saved === 'bi') ? (saved as Language) : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('radhamadhab_lang_v1', lang);
  };

  const toggleLanguage = () => {
    // Cycle: en -> bn -> bi -> en
    const nextLang: Language = language === 'en' ? 'bn' : language === 'bn' ? 'bi' : 'en';
    setLanguage(nextLang);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
