import test from 'node:test';
import assert from 'node:assert/strict';
import { getProfile, saveProfile, clearProfile, isProfileComplete } from '../src/lib/profile.js';
import { analyzeTicket } from '../src/lib/analyzeTicket.js';

function installStorage(t, entries = []) {
  const data = new Map(entries);
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

test('guided setup requires a name and both supported weights, including maintenance goals', () => {
  const profile = { name: 'Ana', currentWeightKg: 75, idealWeightKg: 70 };
  assert.equal(isProfileComplete(profile), true);
  assert.equal(isProfileComplete({ ...profile, idealWeightKg: 75 }), true);
  assert.equal(isProfileComplete({ ...profile, currentWeightKg: 30, idealWeightKg: 250 }), true);
  for (const name of ['', '   ', null, 'a'.repeat(41)]) {
    assert.equal(isProfileComplete({ ...profile, name }), false);
  }
  for (const weight of [null, '', '75', 0, 29.9, 250.1, Infinity, NaN]) {
    assert.equal(isProfileComplete({ ...profile, currentWeightKg: weight }), false);
    assert.equal(isProfileComplete({ ...profile, idealWeightKg: weight }), false);
  }
});

test('returning users with a complete saved profile can skip setup', t => {
  installStorage(t);
  assert.equal(isProfileComplete(getProfile()), false);
  saveProfile({ name: 'Ana', currentWeightKg: 75, idealWeightKg: 70 });
  assert.equal(isProfileComplete(getProfile()), true);
  clearProfile();
  assert.equal(isProfileComplete(getProfile()), false);
});

test('existing saved weights survive upgrading to a profile with a name', t => {
  installStorage(t, [['ticket-analyzer:profile', JSON.stringify({ currentWeightKg: 75, idealWeightKg: 70 })]]);
  const migrated = getProfile();
  assert.equal(typeof migrated.id, 'string');
  assert.deepEqual(migrated, { id: migrated.id, name: '', currentWeightKg: 75, idealWeightKg: 70, historyEnabled: false });
  assert.equal(saveProfile({ ...getProfile(), name: '  Andrés  ' }), true);
  assert.deepEqual(getProfile(), { id: migrated.id, name: 'Andrés', currentWeightKg: 75, idealWeightKg: 70, historyEnabled: false });
});

test('deleting a saved profile clears the name and weights without deleting unrelated browser data', t => {
  const data = installStorage(t, [['unrelated-setting', 'keep']]);
  saveProfile({ name: 'Ana', currentWeightKg: 65, idealWeightKg: 65 });
  assert.equal(clearProfile(), true);
  assert.deepEqual(getProfile(), { id: null, name: '', currentWeightKg: null, idealWeightKg: null, historyEnabled: false });
  assert.equal(data.has('ticket-analyzer:profile'), false);
  assert.equal(data.get('unrelated-setting'), 'keep');
});

test('corrupt or unexpected stored values do not prevent the app loading', t => {
  const data = installStorage(t);
  for (const value of ['{broken', 'null', JSON.stringify({ name: { invalid: true } })]) {
    data.set('ticket-analyzer:profile', value);
    const profile = getProfile();
    assert.equal(profile.name, '');
    assert.equal(profile.currentWeightKg, null);
    assert.equal(profile.idealWeightKg, null);
    assert.equal(profile.historyEnabled, false);
  }
});

test('blocked storage reports failed saving and deletion without crashing', t => {
  installStorage(t);
  const fail = () => { throw new Error('Storage blocked'); };
  t.mock.method(localStorage, 'getItem', fail);
  t.mock.method(localStorage, 'setItem', fail);
  t.mock.method(localStorage, 'removeItem', fail);
  assert.equal(getProfile().name, '');
  assert.equal(saveProfile({ name: 'Ana' }), false);
  assert.equal(clearProfile(), false);
});

test('receipt analysis sends weight fields but never sends the locally saved name', async t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'FileReader');
  Object.defineProperty(globalThis, 'FileReader', { configurable: true, value: class {
    readAsDataURL() { this.result = 'data:image/png;base64,aW1hZ2U='; this.onload(); }
  } });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'FileReader', previous);
    else delete globalThis.FileReader;
  });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(payload.currentWeightKg, 75);
    assert.equal(payload.idealWeightKg, 70);
    assert.equal(Object.hasOwn(payload, 'name'), false);
    assert.equal(Object.hasOwn(payload, 'id'), false);
    assert.equal(Object.hasOwn(payload, 'historyEnabled'), false);
    assert.equal(payload.language, 'auto');
    assert.equal(payload.fallbackLanguage, 'es');
    assert.equal(options.body.includes('Andrés'), false);
    return { ok: true, json: async () => ({ products: [] }) };
  });
  await analyzeTicket({ type: 'image/png' }, { id: 'local-private-id', historyEnabled: true, name: 'Andrés', currentWeightKg: 75, idealWeightKg: 70 });
});
