import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n/translations';
import { moneyLabel, numberLabel, supportedLanguage } from '../i18n/languages';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('es');
  const [languagePreference, setLanguagePreference] = useState('auto');
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = (key, values = {}) => {
    const template = translations[lang][key] ?? translations.es[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  };
  const changeLanguage = value => setLang(supportedLanguage(value));
  const formatNumber = (value, digits = 2) => numberLabel(value, lang, digits);
  const formatMoney = (value, currency = '€') => moneyLabel(value, currency, lang);
  return (
    <LangContext.Provider value={{ lang, setLang: changeLanguage, t, languagePreference, setLanguagePreference, formatNumber, formatMoney }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
