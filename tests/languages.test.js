import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { translations } from '../src/i18n/translations.js';
import { languages, supportedLanguage, moneyLabel } from '../src/i18n/languages.js';
import { analysisStrings, applyAnalysisTranslation } from '../src/lib/analysisLanguage.js';
import { languageInstruction, resolveAnalysisLanguage, validTranslationInput, translateStrings } from '../server/language.js';

test('all five languages cover every UI key and preserve interpolation placeholders', () => {
  const keys = Object.keys(translations.es).sort();
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const code of Object.keys(languages)) {
    assert.deepEqual(Object.keys(translations[code]).sort(), keys, code);
    for (const key of keys) {
      assert.ok(translations[code][key].trim(), `${code}.${key}`);
      assert.deepEqual(placeholders(translations[code][key]), placeholders(translations.es[key]), `${code}.${key}`);
    }
  }
  const files = readdirSync('src/components').filter(name => name.endsWith('.jsx')).map(name => `src/components/${name}`);
  files.push('src/App.jsx');
  for (const file of files) {
    for (const match of readFileSync(file, 'utf8').matchAll(/\bt\(['"]([^'"]+)['"]/g)) {
      assert.ok(Object.hasOwn(translations.es, match[1]), `${file}: ${match[1]}`);
    }
  }
});

test('automatic mode uses the ticket language, with a safe fallback for ambiguity or unsupported languages', () => {
  for (const code of Object.keys(languages)) {
    assert.deepEqual(resolveAnalysisLanguage('auto', 'es', code), { language: code, detectedLanguage: code });
  }
  assert.deepEqual(resolveAnalysisLanguage('auto', 'pl', 'und'), { language: 'pl', detectedLanguage: 'und' });
  assert.deepEqual(resolveAnalysisLanguage('auto', 'invalid', 'fr'), { language: 'es', detectedLanguage: 'und' });
  assert.equal(supportedLanguage('__proto__'), 'es');
  assert.equal(supportedLanguage('ru-RU'), 'ru');
});

test('manual choice overrides output without changing the detected ticket language', () => {
  assert.deepEqual(resolveAnalysisLanguage('be', 'es', 'ru'), { language: 'be', detectedLanguage: 'ru' });
  assert.match(languageInstruction('auto', 'en'), /no su país/);
  assert.match(languageInstruction('pl', 'es'), /language="pl" aunque/);
});

const analysis = {
  language: 'pl', detectedLanguage: 'pl', store: 'Biedronka', currency: 'zł', total: 5,
  products: [{ name: 'Mleko', originalName: 'MLEKO 2%', quantity: '1 l', price: 5, nova: 'minimo' }],
  summary: { totalSpent: 5 }, topEliminate: [], smartBuys: [],
  nextWeek: { keep: [{ name: 'Mleko', price: 5, source: 'receipt' }], add: [{ name: 'Jabłka', price: null }], estimatedTotal: null },
  notes: 'Zakupy', profileGuidance: { buyMore: [], avoid: [], untilNextPurchase: '' },
};

test('translations update all display text while preserving money, classifications, quantities, originals and input', () => {
  const strings = {
    'products.0.name': 'Молоко', 'products.0.quantity': '1 л',
    'nextWeek.keep.0.name': 'Молоко', 'nextWeek.add.0.name': 'Яблоки', notes: 'Покупки',
    'products.0.price': '999', '__proto__.polluted': 'true',
  };
  const translated = applyAnalysisTranslation(analysis, strings, 'ru');
  assert.equal(translated.products[0].name, 'Молоко');
  assert.equal(translated.nextWeek.add[0].name, 'Яблоки');
  assert.equal(translated.products[0].originalName, 'MLEKO 2%');
  assert.equal(translated.products[0].price, 5);
  assert.equal(translated.products[0].nova, 'minimo');
  assert.equal(translated.currency, 'zł');
  assert.equal(translated.total, 5);
  assert.equal(translated.detectedLanguage, 'pl');
  assert.equal(translated.language, 'ru');
  assert.equal(analysis.products[0].name, 'Mleko');
  assert.equal({}.polluted, undefined);
});

test('translation input excludes profile details, pictures, totals, NOVA codes and arbitrary paths', () => {
  const strings = analysisStrings({ ...analysis, name: 'Private name', imageBase64: 'Private photo' });
  assert.ok(validTranslationInput(strings, 'ru'));
  assert.equal(JSON.stringify(strings).includes('Private'), false);
  assert.equal('total' in strings, false);
  assert.equal('products.0.originalName' in strings, false);
  for (const key of ['total', 'products.0.nova', 'products.0.price', '__proto__.polluted', 'name']) {
    assert.ok(!validTranslationInput({ [key]: 'text' }, 'ru'));
  }
  assert.ok(!validTranslationInput(strings, 'invalid'));
  assert.ok(!validTranslationInput(strings, null));
  assert.throws(() => applyAnalysisTranslation(analysis, { notes: 'Text' }, 'en'), /INCOMPLETE_TRANSLATION/);
});

function mockModel(result, stop_reason = 'end_turn') {
  return { messages: { create: async () => ({ stop_reason, content: [{ type: 'text', text: JSON.stringify(result) }] }) } };
}

test('provider translation handles Cyrillic and rejects altered numbers, missing fields and truncated responses', async () => {
  const input = { 'products.0.name': 'Mleko 2%', 'products.0.quantity': '1 l' };
  const output = { 'products.0.name': 'Молоко 2%', 'products.0.quantity': '1 л' };
  assert.deepEqual(await translateStrings(mockModel(output), input, 'ru'), output);
  await assert.rejects(translateStrings(mockModel({ ...output, 'products.0.name': 'Молоко 3%' }), input, 'ru'), /INVALID_TRANSLATION/);
  await assert.rejects(translateStrings(mockModel({ 'products.0.name': 'Молоко 2%' }), input, 'ru'), /INVALID_TRANSLATION/);
  await assert.rejects(translateStrings(mockModel(output, 'max_tokens'), input, 'ru'), /INCOMPLETE_TRANSLATION/);
});

test('locale formatting keeps the original currency rather than converting it', () => {
  const formatted = moneyLabel(12.5, 'PLN', 'pl');
  assert.match(formatted, /12,50/);
  assert.match(formatted, /zł/);
  assert.match(moneyLabel(12.5, 'RUB', 'ru'), /12,50/);
});
