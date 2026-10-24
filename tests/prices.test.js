import test from 'node:test';
import assert from 'node:assert/strict';
import { useReceiptPrices } from '../server/receiptPrices.js';

test('invented recommendation prices are removed and incomplete totals are withheld', () => {
  const result = useReceiptPrices({
    products: [{ name: 'Manzanas', price: 3 }],
    topEliminate: [{ alternativePrice: 999, alternativeSource: 'Inventada' }],
    nextWeek: { keep: [{ name: 'Manzanas', price: 999 }], add: [{ name: 'Peras', price: 1, source: 'Inventada' }], estimatedTotal: 4 },
  });
  assert.equal(result.nextWeek.keep[0].price, 3);
  assert.equal(result.nextWeek.add[0].price, null);
  assert.equal(result.nextWeek.add[0].source, null);
  assert.equal(result.nextWeek.estimatedTotal, null);
  assert.equal(result.topEliminate[0].alternativePrice, null);
});

test('ambiguous or absent receipt matches never get a guessed price', () => {
  const result = useReceiptPrices({
    products: [{ name: 'Pan', price: 1 }, { name: 'Pan', price: 2 }], topEliminate: [],
    nextWeek: { keep: [{ name: 'Pan' }, { name: 'Otro' }], add: [] },
  });
  assert.ok(result.nextWeek.keep.every(item => item.price === null));
  assert.equal(result.nextWeek.estimatedTotal, null);
});

test('complete receipt-based lists get a calculated total', () => {
  const result = useReceiptPrices({
    products: [{ name: 'A', price: 0.1 }, { name: 'B', price: 0.2 }], topEliminate: [],
    nextWeek: { keep: [{ name: 'A' }, { name: 'B' }], add: [], estimatedTotal: 999 },
  });
  assert.equal(result.nextWeek.estimatedTotal, 0.3);
});
