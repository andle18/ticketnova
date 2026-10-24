import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { isProfileComplete } from '../lib/profile';

export default function ProfileForm({ profile, onSave, onboarding = false }) {
  const { t } = useLang();
  const id = useId();
  const [name, setName] = useState(profile?.name ?? '');
  const [current, setCurrent] = useState(profile?.currentWeightKg ?? '');
  const [target, setTarget] = useState(profile?.idealWeightKg ?? '');
  const [historyEnabled, setHistoryEnabled] = useState(profile?.historyEnabled ?? false);
  const [error, setError] = useState(null);

  const save = event => {
    event.preventDefault();
    const next = {
      name: name.trim(), currentWeightKg: current === '' ? null : Number(current),
      idealWeightKg: target === '' ? null : Number(target), historyEnabled,
    };
    if (!isProfileComplete(next)) {
      setError('profileFormInvalid');
      return;
    }
    if (!onSave(next)) {
      setError('profileStorageError');
      return;
    }
    setError(null);
  };

  const inputClass = 'w-full min-w-0 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-base text-white outline-none focus:border-violet-400/60';
  return (
    <form onSubmit={save} noValidate className="space-y-4 text-left">
      <div>
        <label htmlFor={`${id}-name`} className="mb-2 block text-sm text-white/80">{t('profileName')}</label>
        <input id={`${id}-name`} name="name" type="text" autoComplete="given-name" maxLength={40} required
          value={name} onChange={event => setName(event.target.value)} aria-describedby={`${id}-privacy`} className={inputClass} />
      </div>
      <div className={onboarding ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
        {[{ key: 'current', label: 'profileCurrentWeight', value: current, update: setCurrent },
          { key: 'target', label: 'profileIdealWeight', value: target, update: setTarget }].map(field => (
          <div key={field.key}>
            <label htmlFor={`${id}-${field.key}`} className="mb-2 block text-sm text-white/80">{t(field.label)}</label>
            <div className="flex items-center gap-2">
              <input id={`${id}-${field.key}`} name={field.key} type="number" inputMode="decimal" min="30" max="250" step="0.1" required
                value={field.value} onChange={event => field.update(event.target.value)} className={inputClass} />
              <span className="text-sm text-white/60">{t('weightUnit')}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/55">{t('profileWeightRange')}</p>
      <p id={`${id}-privacy`} className="text-xs leading-relaxed text-white/60">{t('profileSetupPrivacy')}</p>
      {!onboarding && <div>
        <label className="flex items-start gap-3 text-xs text-white/75 cursor-pointer">
          <input type="checkbox" checked={historyEnabled} onChange={event => setHistoryEnabled(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500" />
          <span>{t('historyOptIn')}</span>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{t('historyPrivacy')}</p>
      </div>}
      {error && <p role="alert" className="text-sm text-red-300">{t(error)}</p>}
      <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 transition">
        {t(onboarding ? 'setupContinue' : 'profileSave')}
        {onboarding && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </form>
  );
}
