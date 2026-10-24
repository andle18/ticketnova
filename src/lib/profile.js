const KEY = "ticket-analyzer:profile";
const EMPTY_PROFILE = { id: null, name: "", currentWeightKg: null, idealWeightKg: null, historyEnabled: false };

export function isProfileComplete(profile) {
  const validWeight = value => Number.isFinite(value) && value >= 30 && value <= 250;
  return typeof profile?.name === 'string' && profile.name.trim().length > 0 &&
    profile.name.trim().length <= 40 && validWeight(profile.currentWeightKg) && validWeight(profile.idealWeightKg);
}

function normalizeProfile(profile) {
  return {
    id: typeof profile?.id === "string" && /^[\w-]{1,80}$/.test(profile.id) ? profile.id : null,
    name: typeof profile?.name === "string" ? profile.name.trim().slice(0, 40) : "",
    currentWeightKg: Number.isFinite(profile?.currentWeightKg) ? profile.currentWeightKg : null,
    idealWeightKg: Number.isFinite(profile?.idealWeightKg) ? profile.idealWeightKg : null,
    historyEnabled: profile?.historyEnabled === true,
  };
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_PROFILE };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...EMPTY_PROFILE };
    const profile = normalizeProfile(parsed);
    // Give existing profiles a persistent identity without using the person's name.
    if (!profile.id) {
      profile.id = crypto.randomUUID();
      try {
        localStorage.setItem(KEY, JSON.stringify(profile));
      } catch {
        profile.id = null;
      }
    }
    return profile;
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function saveProfile(profile) {
  try {
    const normalized = normalizeProfile(profile);
    normalized.id ??= getProfile().id ?? crypto.randomUUID();
    localStorage.setItem(KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function clearProfile() {
  try {
    const profile = getProfile();
    if (profile.id) localStorage.removeItem(`ticket-analyzer:history:${profile.id}`);
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
