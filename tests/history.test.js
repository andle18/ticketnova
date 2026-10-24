import test from 'node:test';
import assert from 'node:assert/strict';
import { getProfile, saveProfile, clearProfile } from '../src/lib/profile.js';
import { getHistory, saveAnalysis, deleteAnalysis, clearHistory, HISTORY_LIMIT } from '../src/lib/history.js';

function storage(t) {
  const data = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  });
  return data;
}

const analysis = (store = 'Tienda') => ({
  store, total: 5, currency: '€', products: [{ name: 'Fruta', price: 5, nova: 'fresco', quantity: '1 kg' }],
  summary: { totalSpent: 5, freshPct: 100, minimoPct: 0, procesadoPct: 0, ultraPct: 0, freshAmount: 5, ultraAmount: 0, ratio: 0 },
  topEliminate: [], smartBuys: [], nextWeek: { keep: [{ name: 'Fruta', price: 5 }], add: [], estimatedTotal: 5 },
  profileGuidance: { buyMore: [], avoid: [], untilNextPurchase: 'Recomendación original' },
});
function createProfile() {
  assert.equal(saveProfile({ name: 'Ana', historyEnabled: true, currentWeightKg: 75, idealWeightKg: 70 }), true);
  return getProfile();
}

test('history survives reloads and profile edits with original weight snapshot', t => {
  storage(t);
  const profile = createProfile();
  assert.equal(saveAnalysis(profile, analysis()), true);
  saveProfile({ ...profile, name: 'Ana María', currentWeightKg: 72 });
  const reloaded = getProfile();
  assert.equal(reloaded.id, profile.id);
  const entries = getHistory(reloaded.id);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].analysis.store, 'Tienda');
  assert.equal(entries[0].analysis.profileGuidance.untilNextPurchase, 'Recomendación original');
  assert.equal(entries[0].profileSnapshot.currentWeightKg, 75);
});

test('history retains the output language, detected ticket language and original product names', t => {
  storage(t);
  const profile = createProfile();
  saveAnalysis(profile, {
    ...analysis(), language: 'be', detectedLanguage: 'ru',
    products: [{ name: 'Малако', originalName: 'МОЛОКО', quantity: '1 л', price: 5, nova: 'minimo' }],
  });
  const restored = getHistory(profile.id)[0].analysis;
  assert.equal(restored.language, 'be');
  assert.equal(restored.detectedLanguage, 'ru');
  assert.equal(restored.products[0].name, 'Малако');
  assert.equal(restored.products[0].originalName, 'МОЛОКО');
});

test('history preserves Argentine and Polish currencies when reopening receipts', t => {
  storage(t);
  const profile = createProfile();
  for (const [countryCode, currency, expected] of [['AR', '$', 'ARS'], ['PL', 'zł', 'PLN']]) {
    assert.equal(saveAnalysis(profile, { ...analysis(), countryCode, currency, total: 1234.56 }), true);
    const restored = getHistory(profile.id)[0].analysis;
    assert.equal(restored.countryCode, countryCode);
    assert.equal(restored.currency, expected);
    assert.equal(restored.total, 1234.56);
  }
});

test('history is opt-in; disabling it retains old entries but prevents saving new ones', t => {
  storage(t);
  saveProfile({ name: 'Ana' });
  const profile = getProfile();
  assert.equal(saveAnalysis(profile, analysis()), false);
  saveProfile({ ...profile, historyEnabled: true });
  assert.equal(saveAnalysis(getProfile(), analysis()), true);
  saveProfile({ ...getProfile(), historyEnabled: false });
  assert.equal(saveAnalysis(profile, analysis()), false);
  assert.equal(getHistory(profile.id).length, 1);
});

test('deleted profiles lose history and new profiles with the same name do not inherit it', t => {
  const data = storage(t);
  const first = createProfile();
  saveAnalysis(first, analysis());
  assert.equal(clearProfile(), true);
  assert.equal(data.has(`ticket-analyzer:history:${first.id}`), false);
  const second = createProfile();
  assert.notEqual(second.id, first.id);
  assert.deepEqual(getHistory(second.id), []);
  assert.equal(saveAnalysis(first, analysis()), false);
  assert.equal(deleteAnalysis(first.id, 'any'), false);
  assert.equal(clearHistory(first.id), false);
});

test('deleting individual entries and all history leaves the profile intact', t => {
  storage(t);
  const profile = createProfile();
  saveAnalysis(profile, analysis('A'));
  saveAnalysis(profile, analysis('B'));
  const entries = getHistory(profile.id);
  assert.equal(deleteAnalysis(profile.id, entries[0].id), true);
  assert.deepEqual(getHistory(profile.id).map(item => item.analysis.store), ['A']);
  assert.equal(clearHistory(profile.id), true);
  assert.deepEqual(getHistory(profile.id), []);
  assert.equal(getProfile().id, profile.id);
});

test('only the latest 20 analyses are retained and photo fields never enter storage', t => {
  const data = storage(t);
  const profile = createProfile();
  for (let i = 0; i <= HISTORY_LIMIT; i++) {
    saveAnalysis(profile, { ...analysis(`Compra ${i}`), imageBase64: 'private-photo', file: 'private-file' });
  }
  const entries = getHistory(profile.id);
  assert.equal(entries.length, HISTORY_LIMIT);
  assert.equal(entries[0].analysis.store, `Compra ${HISTORY_LIMIT}`);
  assert.equal(entries.at(-1).analysis.store, 'Compra 1');
  assert.equal(data.get(`ticket-analyzer:history:${profile.id}`).includes('private-'), false);
});

test('quota errors preserve existing history and report a failed save', t => {
  const data = storage(t);
  const profile = createProfile();
  saveAnalysis(profile, analysis('Anterior'));
  const original = data.get(`ticket-analyzer:history:${profile.id}`);
  t.mock.method(localStorage, 'setItem', () => { throw new Error('QuotaExceeded'); });
  assert.equal(saveAnalysis(profile, analysis('Nueva')), false);
  assert.equal(data.get(`ticket-analyzer:history:${profile.id}`), original);
});

test('invalid stored entries are discarded and malformed render fields are sanitized', t => {
  const data = storage(t);
  const profile = createProfile();
  const key = `ticket-analyzer:history:${profile.id}`;
  for (const raw of ['not-json', 'null', '{}', '[null, {}]']) {
    data.set(key, raw);
    assert.deepEqual(getHistory(profile.id), []);
  }
  saveAnalysis(profile, { ...analysis(), store: { unexpected: true }, smartBuys: [null], profileGuidance: { buyMore: [null] } });
  const restored = getHistory(profile.id)[0].analysis;
  assert.equal(restored.store, '');
  assert.deepEqual(restored.smartBuys, []);
  assert.deepEqual(restored.profileGuidance.buyMore, []);
});
