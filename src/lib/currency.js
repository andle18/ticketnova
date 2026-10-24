import { currencyRegions } from './currencyRegions.js';

const aliases = {
  '€': 'EUR', 'zł': 'PLN', '₽': 'RUB', Br: 'BYN',
  'AR$': 'ARS', '$AR': 'ARS', 'US$': 'USD', 'U$S': 'USD',
  'R$': 'BRL', 'S/': 'PEN', '₹': 'INR', '₴': 'UAH',
};

export function receiptCurrency(currency, countryCode = '') {
  const raw = typeof currency === 'string' ? currency.trim() : '';
  const country = typeof countryCode === 'string' ? countryCode.trim().toUpperCase() : '';
  if (Object.hasOwn(aliases, raw)) return aliases[raw];
  if (/^[a-z]{3}$/i.test(raw)) return raw.toUpperCase();
  if (raw && Object.hasOwn(currencyRegions, country)) {
    const matches = currencyRegions[country].filter(code => {
      return ['symbol', 'narrowSymbol'].some(currencyDisplay => {
        const parts = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay }).formatToParts(0);
        return parts.some(part => part.type === 'currency' && (
          part.value === raw || (/^\p{Sc}$/u.test(raw) && part.value.endsWith(raw))
        ));
      });
    });
    if (matches.length === 1) return matches[0];
  }
  // Missing or ambiguous currency stays unknown; never assume EUR or USD.
  return raw;
}

export function currencyDigits(currency) {
  const code = receiptCurrency(currency);
  return /^[A-Z]{3}$/.test(code)
    ? new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits
    : 2;
}
