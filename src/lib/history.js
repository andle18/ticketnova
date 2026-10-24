import { getProfile } from './profile.js';
import { supportedLanguage } from '../i18n/languages.js';
import { receiptCurrency } from './currency.js';

const PREFIX = 'ticket-analyzer:history:';
export const HISTORY_LIMIT = 20;
const text = value => typeof value === 'string' ? value : '';
const number = value => Number.isFinite(value) ? value : 0;
const price = value => Number.isFinite(value) ? value : null;
const list = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
const validId = id => typeof id === 'string' && /^[\w-]{1,80}$/.test(id);
const key = id => `${PREFIX}${id}`;

// Persist only dashboard data. Never store uploaded photos, base64 or arbitrary
// model fields. Reading uses the same projection so corrupt data cannot supply
// objects where React expects text, or null where the dashboard needs arrays.
function analysisData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.products) || !data.summary) return null;
  const summary = Object.fromEntries([
    'totalSpent', 'freshPct', 'minimoPct', 'procesadoPct', 'ultraPct',
    'freshAmount', 'ultraAmount', 'ratio',
  ].map(field => [field, number(data.summary[field])]));
  const shoppingItem = item => ({ name: text(item.name), price: price(item.price), source: text(item.source) });
  const guidance = item => ({ item: text(item.item), reason: text(item.reason) });
  return {
    language: supportedLanguage(data.language),
    detectedLanguage: supportedLanguage(data.detectedLanguage, 'und'),
    store: text(data.store), location: text(data.location), date: text(data.date),
    countryCode: /^[A-Z]{2}$/.test(text(data.countryCode)) ? data.countryCode : '',
    currency: receiptCurrency(data.currency, data.countryCode), total: number(data.total), summary,
    products: list(data.products).map(item => ({
      name: text(item.name), originalName: text(item.originalName || item.name), price: number(item.price),
      quantity: typeof item.quantity === 'number' ? String(item.quantity) : text(item.quantity),
      nova: ['fresco', 'minimo', 'procesado', 'ultra'].includes(item.nova) ? item.nova : 'minimo',
    })),
    topEliminate: list(data.topEliminate).map(item => ({
      product: text(item.product), price: number(item.price), reason: text(item.reason),
      alternative: text(item.alternative), alternativePrice: null, alternativeSource: null,
    })),
    smartBuys: list(data.smartBuys).map(item => ({
      product: text(item.product), price: number(item.price), reason: text(item.reason),
      action: item.action === 'ampliar' ? 'ampliar' : 'mantener',
    })),
    nextWeek: {
      keep: list(data.nextWeek?.keep).map(shoppingItem), add: list(data.nextWeek?.add).map(shoppingItem),
      estimatedTotal: price(data.nextWeek?.estimatedTotal),
    },
    notes: text(data.notes),
    profileGuidance: {
      buyMore: list(data.profileGuidance?.buyMore).map(guidance),
      avoid: list(data.profileGuidance?.avoid).map(guidance),
      untilNextPurchase: text(data.profileGuidance?.untilNextPurchase),
    },
  };
}

export function getHistory(profileId) {
  if (!validId(profileId)) return [];
  try {
    const stored = JSON.parse(localStorage.getItem(key(profileId)) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.flatMap(entry => {
      if (!validId(entry?.id) || !Number.isFinite(Date.parse(entry.savedAt))) return [];
      const analysis = analysisData(entry.analysis);
      if (!analysis) return [];
      return [{ id: entry.id, savedAt: entry.savedAt, analysis, profileSnapshot: {
        currentWeightKg: price(entry.profileSnapshot?.currentWeightKg),
        idealWeightKg: price(entry.profileSnapshot?.idealWeightKg),
      } }];
    }).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function saveAnalysis(profile, analysis) {
  try {
    const current = getProfile();
    // Check the stored owner and consent again after the asynchronous API call.
    if (!validId(profile.id) || current.id !== profile.id || !current.historyEnabled) return false;
    const data = analysisData(analysis);
    if (!data) return false;
    const entry = {
      id: crypto.randomUUID(), savedAt: new Date().toISOString(), analysis: data,
      profileSnapshot: { currentWeightKg: price(profile.currentWeightKg), idealWeightKg: price(profile.idealWeightKg) },
    };
    localStorage.setItem(key(profile.id), JSON.stringify([entry, ...getHistory(profile.id)].slice(0, HISTORY_LIMIT)));
    return true;
  } catch {
    return false;
  }
}

export function deleteAnalysis(profileId, entryId) {
  try {
    if (!validId(profileId) || getProfile().id !== profileId) return false;
    localStorage.setItem(key(profileId), JSON.stringify(getHistory(profileId).filter(entry => entry.id !== entryId)));
    return true;
  } catch {
    return false;
  }
}

export function clearHistory(profileId) {
  try {
    if (!validId(profileId) || getProfile().id !== profileId) return false;
    localStorage.removeItem(key(profileId));
    return true;
  } catch {
    return false;
  }
}
