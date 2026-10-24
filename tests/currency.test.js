import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptCurrency } from '../src/lib/currency.js';
import { moneyLabel } from '../src/i18n/languages.js';
import { toNumber } from '../server/numbers.js';
import { currencyRegions } from '../src/lib/currencyRegions.js';

test('receipt country disambiguates pesos and dollars; explicit currency takes precedence', () => {
  assert.equal(receiptCurrency('$', 'AR'), 'ARS');
  assert.equal(receiptCurrency('$', 'MX'), 'MXN');
  assert.equal(receiptCurrency('$', 'US'), 'USD');
  assert.equal(receiptCurrency('zł', 'PL'), 'PLN');
  assert.equal(receiptCurrency('pln', 'PL'), 'PLN');
  assert.equal(receiptCurrency('USD', 'AR'), 'USD');
  assert.equal(receiptCurrency('US$', 'AR'), 'USD');
  assert.equal(receiptCurrency('AR$'), 'ARS');
  assert.equal(receiptCurrency('$'), '$');
  assert.equal(receiptCurrency(''), '');
  assert.equal(receiptCurrency(null, 'AR'), '');
});

test('changing UI language keeps currency and amount, including downloaded money labels', () => {
  for (const language of ['es', 'en', 'pl', 'ru', 'be']) {
    for (const currency of ['ARS', 'PLN', 'EUR', 'USD']) {
      assert.equal(moneyLabel(1234.56, currency, language),
        new Intl.NumberFormat(language, { style: 'currency', currency }).format(1234.56));
    }
  }
  assert.match(moneyLabel(1234.56, 'ARS', 'es'), /ARS/);
  assert.match(moneyLabel(1234.56, 'PLN', 'pl'), /zł/);
  assert.equal(moneyLabel(12.5, '$', 'es'), '12,50 $');
  assert.equal(moneyLabel(12.5, '', 'es'), '12,50');
});

test('worldwide currencies and shared symbols use the receipt country', () => {
  for (const [symbol, country, expected] of [
    ['¥', 'JP', 'JPY'], ['¥', 'CN', 'CNY'], ['₩', 'KR', 'KRW'],
    ['₹', 'IN', 'INR'], ['R$', 'BR', 'BRL'], ['R', 'ZA', 'ZAR'],
    ['₦', 'NG', 'NGN'], ['$', 'AU', 'AUD'], ['$', 'NZ', 'NZD'],
    ['$', 'JM', 'JMD'], ['kr', 'NO', 'NOK'], ['kr', 'SE', 'SEK'],
    ['£', 'GB', 'GBP'], ['£', 'EG', 'EGP'], ['CHF', 'CH', 'CHF'],
    ['AED', 'AE', 'AED'], ['KWD', 'KW', 'KWD'], ['MAD', 'MA', 'MAD'],
  ]) {
    assert.equal(receiptCurrency(symbol, country), expected, `${symbol} ${country}`);
  }
  assert.equal(receiptCurrency('¥'), '¥');
  assert.equal(receiptCurrency('kr'), 'kr');
  assert.equal(receiptCurrency('USD', 'JP'), 'USD');
  for (const code of new Set(Object.values(currencyRegions).flat())) {
    assert.equal(receiptCurrency(code), code);
    assert.ok(moneyLabel(1234, code, 'es').length > 0, code);
  }
  assert.match(moneyLabel(12.345, 'KWD', 'en'), /12\.345/);
  assert.match(moneyLabel(1234, 'JPY', 'en'), /1,234/);
});

test('local decimal and thousands separators preserve receipt amounts', () => {
  for (const value of ['1.234,56', '1,234.56', '1 234,56', '1\u00a0234,56', '1234.56', 1234.56]) {
    assert.equal(toNumber(value), 1234.56);
  }
  assert.equal(toNumber('12.345.678,90'), 12345678.9);
  assert.equal(toNumber('0,125'), 0.125);
  assert.equal(toNumber(null, null), null);
  assert.equal(toNumber('invalid', null), null);
});
