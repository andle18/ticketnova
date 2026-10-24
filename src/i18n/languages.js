import { receiptCurrency } from '../lib/currency.js';

export const languages = {
  es: { name: 'Español', modelName: 'español' },
  en: { name: 'English', modelName: 'inglés' },
  pl: { name: 'Polski', modelName: 'polaco' },
  ru: { name: 'Русский', modelName: 'ruso' },
  be: { name: 'Беларуская', modelName: 'bielorruso' },
};

export function supportedLanguage(value, fallback = 'es') {
  const code = typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : '';
  return Object.hasOwn(languages, code) ? code : fallback;
}

export function numberLabel(value, language, digits = 2) {
  return new Intl.NumberFormat(supportedLanguage(language), {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
}

export function moneyLabel(value, currency, language) {
  const code = receiptCurrency(currency);
  if (/^[A-Z]{3}$/.test(code)) {
    return new Intl.NumberFormat(supportedLanguage(language), { style: 'currency', currency: code }).format(value);
  }
  return `${numberLabel(value, language)}${code ? ` ${code}` : ''}`;
}
