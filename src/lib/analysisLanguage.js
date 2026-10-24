import { supportedLanguage } from '../i18n/languages.js';

// Only human-readable fields can be translated. Prices, NOVA codes, receipt
// originals, profile data, array structure and totals never come from translation.
export function analysisStrings(analysis) {
  const strings = {};
  const take = (object, path, fields) => {
    for (const field of fields) {
      if (typeof object?.[field] === 'string' && object[field]) strings[`${path}${field}`] = object[field];
    }
  };
  const rows = (items, path, fields) => {
    if (Array.isArray(items)) items.forEach((item, index) => take(item, `${path}.${index}.`, fields));
  };
  rows(analysis.products, 'products', ['name', 'quantity']);
  rows(analysis.topEliminate, 'topEliminate', ['product', 'reason', 'alternative']);
  rows(analysis.smartBuys, 'smartBuys', ['product', 'reason']);
  rows(analysis.nextWeek?.keep, 'nextWeek.keep', ['name']);
  rows(analysis.nextWeek?.add, 'nextWeek.add', ['name']);
  rows(analysis.profileGuidance?.buyMore, 'profileGuidance.buyMore', ['item', 'reason']);
  rows(analysis.profileGuidance?.avoid, 'profileGuidance.avoid', ['item', 'reason']);
  take(analysis, '', ['notes']);
  take(analysis.profileGuidance, 'profileGuidance.', ['untilNextPurchase']);
  return strings;
}

export function applyAnalysisTranslation(analysis, strings, language) {
  const expected = analysisStrings(analysis);
  if (!strings || Object.keys(expected).some(key => typeof strings[key] !== 'string' || !strings[key].trim())) {
    throw new Error('INCOMPLETE_TRANSLATION');
  }
  const translated = structuredClone(analysis);
  for (const key of Object.keys(expected)) {
    const parts = key.split('.');
    let target = translated;
    for (const part of parts.slice(0, -1)) target = target[part];
    target[parts.at(-1)] = strings[key];
  }
  translated.language = supportedLanguage(language);
  return translated;
}

export async function translateAnalysis(analysis, language) {
  const response = await fetch('/api/translate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strings: analysisStrings(analysis), language }),
  });
  if (!response.ok) throw new Error('TRANSLATION_FAILED');
  const data = await response.json();
  return applyAnalysisTranslation(analysis, data.strings, language);
}
